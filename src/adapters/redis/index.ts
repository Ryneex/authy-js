import { v4 } from "uuid"
import { formatSession } from "./helpers/formatSession"
import { type createClient } from "redis"
import { Adapter, SessionResponse, UserResponse } from "@/types"

const sendError = (message: string): { success: false; message: string } => ({ success: false, message })

export class RedisAdapter implements Adapter {
    private client: ReturnType<typeof createClient>
    private userDbAdapter?: Adapter
    constructor(opts: { client: ReturnType<typeof createClient>; userDbAdapter?: Adapter }) {
        !opts.client.isOpen && opts.client.connect()
        this.userDbAdapter = opts.userDbAdapter
        this.client = opts.client
    }

    async createSession(opts: { userId: string; expiresIn: number }): Promise<SessionResponse> {
        try {
            const id = v4()
            const session = {
                userId: opts.userId,
                expiresAt: new Date(Date.now() + opts.expiresIn),
            }
            await this.client.setEx(`sessions:${id}`, opts.expiresIn / 1000, JSON.stringify(session))
            return { success: true, session: formatSession({ ...session, id }) }
        } catch (error) {
            return sendError("Something went wrong, couldn't create session")
        }
    }

    async getSession(sessionId: string): Promise<SessionResponse> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.client.get(`sessions:${sessionId}`)
            if (!session) return sendError("Couldn't find session")
            return { success: true, session: formatSession({ ...JSON.parse(session), id: sessionId }) }
        } catch (error) {
            return sendError("Something went wrong, couldn't get session")
        }
    }

    async getUserBySessionId<T>(sessionId: string): Promise<UserResponse<T>> {
        if (!this.userDbAdapter) return sendError("userDbAdapter is required because redis don't contain user informations")
        const res = await this.getSession(sessionId)
        if (!res.success) return res
        return await this.userDbAdapter.getUserByUserId(res.session.userId)
    }

    async getUserByUserId<T>(): Promise<UserResponse<T>> {
        return sendError("Redis don't store user informations")
    }

    async deleteSession(sessionId: string): Promise<SessionResponse> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const res = await this.getSession(sessionId)
            if (!res.success) return res
            await this.client.del(`sessions:${sessionId}`)
            return res
        } catch (error) {
            return sendError("Something went wrong, couldn't delete session")
        }
    }

    async deleteUsersAllSessions(): Promise<{ success: boolean; message: string }> {
        return sendError("This feature isn't available yet on redis")
    }
}
