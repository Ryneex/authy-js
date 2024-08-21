import type mongoose from "mongoose"
import { type Model } from "mongoose"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { UserError, SessionError } from "@/utils/sendError"

interface IConstructor {
    User: Model<any>
    Session: Model<any> | null
    dbConnectionUrl?: string
    mongoose?: typeof mongoose
}

const isSessionExpired = (session: any) => new Date() > session.expiresAt

export class MongoDBAdapter implements Adapter {
    private Session: Model<any>
    private User: Model<any>

    constructor({ User, Session, dbConnectionUrl, mongoose }: IConstructor) {
        // connect mongoose instance thats passed from server, if not connected
        if (dbConnectionUrl) !mongoose?.connection.readyState && mongoose?.connect(dbConnectionUrl)
        this.Session = Session as any
        this.User = User
    }

    async createSession<T>(opts: ICreateSessionOpts): Promise<SessionResponse<T>> {
        const session = await this.Session.create(opts)
        if (!session) return SessionError("Couldn't create session")
        return { success: true, session: session }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const session = await this.Session.findById(sessionId)
        if (!session) return SessionError("Couldn't find session")
        if (isSessionExpired(session)) return SessionError("Session has expired")
        return { success: true, session }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        const response = await this.getSession<ICreateSessionOpts>(sessionId)
        if (!response.success) return UserError(response.message)
        const user = await this.User.findById(response.session.userId)
        if (!user) return UserError("User not found")
        return { success: true, user }
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!userId) return UserError("User ID is required")
        const user = await this.User.findById(userId)
        if (!user) return UserError("User not found")
        return { success: true, user }
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const session = await this.Session.findByIdAndDelete(sessionId)
        if (!session) return SessionError("Couldn't delete session")
        return { success: true, session: session }
    }

    async deleteUsersAllSessions(sessionId?: string): Promise<{ success: boolean; message: string }> {
        if (!sessionId) return { success: false, message: "Session ID is required" }
        const session = await this.Session.findById(sessionId)
        if (!session) return { success: false, message: "Couldn't find session" }
        await this.Session.deleteMany({ userId: session.userId })
        return { success: true, message: "Deleted All Sessions" }
    }
}
