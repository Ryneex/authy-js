import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import type { FastifyInstance } from "fastify"
import Cookie, { type CookieSerializeOptions } from "cookie"
import { parseExpires } from "@/utils/parseExpires"

declare module "fastify" {
    interface FastifyRequest {
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

interface CookieOptions extends Omit<CookieSerializeOptions, "expires"> {
    expires: string | number | undefined
}

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: CookieOptions }
}

export function FastifyHandler(fastify: FastifyInstance, { adapter, cookie }: IAuthOpts) {
    const cookieName = cookie?.name || "session_id"
    const cookieExpiresIn = cookie?.options?.expires
    fastify.decorateRequest("auth", null)
    fastify.addHook("preHandler", (req, res, next) => {
        const sessionId = Cookie.parse(req.headers.cookie || "")[cookieName]
        req.auth = {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string }>(opts)
                if (!response.success) return response
                const sessionCookie = Cookie.serialize(cookieName, response.session.id, { ...cookie?.options, expires: parseExpires(cookieExpiresIn) })
                res.header("set-cookie", sessionCookie)
                return response as T
            },
            getCurrentUser: <T>() => adapter.getUserBySessionId<T>(sessionId),
            getCurrentSession: <T>() => adapter.getSession<T>(sessionId),
            deleteCurrentSession: async <T>() => {
                const response = await adapter.deleteSession<T>(sessionId)
                if (!response.success) return response
                const expiredCookie = Cookie.serialize(cookieName, "", {
                    expires: new Date("2000"),
                })
                res.header("set-cookie", expiredCookie)
                return response
            },
            deleteUsersAllSessions: async () => {
                const response = await adapter.deleteUsersAllSessions(sessionId)
                if (!response.success) return response
                const expiredCookie = Cookie.serialize(cookieName, "", {
                    expires: new Date("2000"),
                })
                res.header("set-cookie", expiredCookie)
                return response
            },
            adapter,
        }
        next()
    })
}

export default FastifyHandler
