import { CookieOptions, type RequestHandler } from "express"
import Cookie from "cookie"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { parseExpires } from "@/utils/parseExpires"

declare global {
    namespace Express {
        interface Request {
            auth: {
                createSession: <T>(opts: ICreateSessionOpts) => Promise<SessionResponse<T>>
                getCurrentUser: <T>() => Promise<UserResponse<T>>
                getCurrentSession: <T>() => Promise<SessionResponse<T>>
                deleteCurrentSession: <T>() => Promise<SessionResponse<T>>
                deleteUsersAllSessions: () => Promise<{ success: boolean; message: string }>
                adapter: Adapter
            }
        }
    }
}

interface CookieOption extends Omit<CookieOptions, "expires"> {
    expires: string | number | undefined
}

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: CookieOption }
}

export function ExpressHandler({ adapter, cookie }: IAuthOpts): RequestHandler {
    const cookieName = cookie?.name || "session_id"
    const cookieExpiresIn = cookie?.options?.expires
    return async (req, res, next) => {
        const sessionId = Cookie.parse(req.headers.cookie || "")[cookieName]
        req.auth = {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string }>(opts)
                if (!response.success) return response
                res.cookie(cookieName, response.session.id, { ...cookie?.options, expires: parseExpires(cookieExpiresIn) })
                return response as SessionResponse<T>
            },
            getCurrentUser: <T>() => adapter.getUserBySessionId<T>(sessionId),
            getCurrentSession: <T>() => adapter.getSession<T>(sessionId),
            deleteCurrentSession: async <T>() => {
                const response = await adapter.deleteSession<T>(sessionId)
                if (!response.success) return response
                res.clearCookie(cookie?.name || "session_id")
                return response
            },
            deleteUsersAllSessions: async () => {
                const response = await adapter.deleteUsersAllSessions(sessionId)
                if (!response.success) return response
                res.clearCookie(cookie?.name || "session_id")
                return response
            },
            adapter,
        }
        next()
    }
}

export default ExpressHandler
