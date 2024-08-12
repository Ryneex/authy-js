import { CookieOptions, type RequestHandler } from "express"
import Cookie from "cookie"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"

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

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: CookieOptions }
}

export function ExpressHandler({ adapter, cookie }: IAuthOpts): RequestHandler {
    return async (req, res, next) => {
        const sessionId = Cookie.parse(req.headers.cookie || "")[cookie?.name || "session_id"]
        req.auth = {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string }>(opts)
                if (!response.success) return response
                res.cookie(cookie?.name || "session_id", response.session.id, {
                    secure: true,
                    expires: opts.expiresAt,
                    ...cookie?.options,
                })
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
