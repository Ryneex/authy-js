import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import type { FastifyInstance } from "fastify"
import Cookie, { type CookieSerializeOptions } from "cookie"

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

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: CookieSerializeOptions }
}

export function FastifyHandler(fastify: FastifyInstance, { adapter, cookie }: IAuthOpts) {
    fastify.decorateRequest("auth", null)
    fastify.addHook("preHandler", (req, res, next) => {
        const sessionId = Cookie.parse(req.headers.cookie || "")[cookie?.name || "session_id"]
        req.auth = {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string }>(opts)
                if (!response.success) return response
                const sessionCookie = Cookie.serialize(cookie?.name || "session_id", response.session.id, {
                    secure: true,
                    ...cookie?.options,
                })
                res.header("set-cookie", sessionCookie)
                return response as T
            },
            getCurrentUser: <T>() => adapter.getUserBySessionId<T>(sessionId),
            getCurrentSession: <T>() => adapter.getSession<T>(sessionId),
            deleteCurrentSession: async <T>() => {
                const response = await adapter.deleteSession<T>(sessionId)
                if (!response.success) return response
                const expiredCookie = Cookie.serialize(cookie?.name || "session_id", "", {
                    expires: new Date("2000"),
                })
                res.header("set-cookie", expiredCookie)
                return response
            },
            deleteUsersAllSessions: async () => {
                const response = await adapter.deleteUsersAllSessions(sessionId)
                if (!response.success) return response
                const expiredCookie = Cookie.serialize(cookie?.name || "session_id", "", {
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
