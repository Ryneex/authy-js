import { type RequestHandler } from "express"
import { Adapter, SessionResponse, UserResponse } from "@/types"

declare global {
    namespace Express {
        interface Request {
            auth: {
                createSession: (opts: { userId: string; expiresIn: number }) => Promise<SessionResponse>
                getCurrentUser: () => Promise<UserResponse>
                getCurrentSession: () => Promise<SessionResponse>
                deleteCurrentSession: () => Promise<SessionResponse>
                deleteUsersAllSessions: () => Promise<{ success: boolean; message: string }>
                adapter: Adapter
            }
        }
    }
}

export function auth({ adapter }: { adapter: Adapter }): RequestHandler {
    return (req, res, next) => {
        const sessionId = req.cookies.session_id
        req.auth = {
            createSession: async (opts) => {
                const response = await adapter.createSession(opts)
                if (!response.success) return response
                res.cookie("session_id", response.session.id)
                return response
            },
            getCurrentUser: () => adapter.getUserBySessionId(sessionId),
            getCurrentSession: () => adapter.getSession(sessionId),
            deleteCurrentSession: async () => {
                const response = await adapter.deleteSession(sessionId)
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
