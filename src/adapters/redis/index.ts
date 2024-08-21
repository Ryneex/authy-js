import { v4 } from "uuid"
import { formatSession } from "./helpers/formatSession"
import { type createClient } from "redis"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { UserError, SessionError } from "@/utils/sendError"

export class RedisAdapter implements Adapter {
    private client: ReturnType<typeof createClient>
    private userDbAdapter?: Adapter
    constructor(opts: { client: ReturnType<typeof createClient>; userDbAdapter?: Adapter }) {
        !opts.client.isOpen && opts.client.connect()
        this.userDbAdapter = opts.userDbAdapter
        this.client = opts.client
    }

    async createSession<T>(opts: ICreateSessionOpts): Promise<SessionResponse<T>> {
        const id = v4()
        const expiresInSecond = Math.round((Date.parse(opts.expiresAt.toString()) - Date.now()) / 1000)
        await this.client.setEx(`sessions:${id}`, expiresInSecond, JSON.stringify(opts))
        return { success: true, session: formatSession({ ...opts, id }) }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const session = await this.client.get(`sessions:${sessionId}`)
        if (!session) return SessionError("Couldn't find session")
        return { success: true, session: formatSession({ ...JSON.parse(session), id: sessionId }) }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        if (!this.userDbAdapter) return UserError("userDbAdapter is required because redis do not contain any user informations")
        const res = await this.getSession<ICreateSessionOpts>(sessionId)
        if (!res.success) return UserError(res.message)
        return await this.userDbAdapter.getUserByUserId(res.session.userId)
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!this.userDbAdapter) return UserError("userDbAdapter is required because redis do not contain any user informations")
        const res = await this.userDbAdapter.getUserByUserId<T>(userId)
        if (!res.success) return res
        return res
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const res = await this.getSession<T>(sessionId)
        if (!res.success) return res
        await this.client.del(`sessions:${sessionId}`)
        return res
    }

    async deleteUsersAllSessions(): Promise<{ success: false; message: string }> {
        return { success: false, message: "This feature isn't available yet on redis" }
    }
}
