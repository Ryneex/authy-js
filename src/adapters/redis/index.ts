import { v4 } from "uuid"
import { formatSession } from "./helpers/formatSession"
import { type createClient } from "redis"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { sendError } from "@/utils/sendError"

export class RedisAdapter implements Adapter {
    private client: ReturnType<typeof createClient>
    private userDbAdapter?: Adapter
    constructor(opts: { client: ReturnType<typeof createClient>; userDbAdapter?: Adapter }) {
        !opts.client.isOpen && opts.client.connect()
        this.userDbAdapter = opts.userDbAdapter
        this.client = opts.client
    }

    async createSession<T>(opts: ICreateSessionOpts): Promise<SessionResponse<T>> {
        try {
            const id = v4()
            const expiresInSecond = Math.round((Date.parse(opts.expiresAt.toString()) - Date.now()) / 1000)
            await this.client.setEx(`sessions:${id}`, expiresInSecond, JSON.stringify(opts))
            return { success: true, session: formatSession({ ...opts, id }) }
        } catch (error) {
            return sendError("Something went wrong, couldn't create session")
        }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.client.get(`sessions:${sessionId}`)
            if (!session) return sendError("Couldn't find session")
            return { success: true, session: formatSession({ ...JSON.parse(session), id: sessionId }) }
        } catch (error) {
            return sendError("Something went wrong, couldn't get session")
        }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        if (!this.userDbAdapter) return sendError("userDbAdapter is required because redis don't contain user informations")
        const res = await this.getSession<ICreateSessionOpts>(sessionId)
        if (!res.success) return res
        return await this.userDbAdapter.getUserByUserId(res.session.userId)
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!this.userDbAdapter) return sendError("userDbAdapter is required because redis don't contain user informations")
        const res = await this.getUserByUserId<T>(userId)
        if (!res.success) return res
        return res
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const res = await this.getSession<T>(sessionId)
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
