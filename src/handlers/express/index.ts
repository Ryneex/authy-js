import { type RequestHandler } from "express"
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

export function auth({ adapter }: { adapter: Adapter }): RequestHandler {
    return async (req, res, next) => {
        const sessionId = req.cookies.session_id
        req.auth = {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string } & T>(opts)
                if (!response.success) return response
                res.cookie("session_id", response.session.id)
                return response as T
            },
            getCurrentUser: <T>() => adapter.getUserBySessionId<T>(sessionId),
            getCurrentSession: <T>() => adapter.getSession<T>(sessionId),
            deleteCurrentSession: async <T>() => {
                const response = await adapter.deleteSession<T>(sessionId)
                if (!response.success) return response
                res.clearCookie("session_id")
                return response
            },
            deleteUsersAllSessions: async () => {
                const response = await adapter.deleteUsersAllSessions(sessionId)
                if (!response.success) return response
                res.clearCookie("session_id")
                return response
            },
            adapter,
        }

        next()
    }
}

export default auth
