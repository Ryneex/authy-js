import type mongoose from "mongoose"
import { type Model } from "mongoose"
import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { sendError } from "@/utils/sendError"

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
        try {
            const session = await this.Session.create(opts)
            if (!session) return sendError("Couldn't create session")
            return { success: true, session: session }
        } catch (error) {
            return sendError(error)
        }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findById(sessionId)
            if (!session) return sendError("Couldn't find session")
            if (isSessionExpired(session)) {
                await session.deleteOne()
                return sendError("Session has expired")
            }
            return { success: true, session }
        } catch (error) {
            return sendError("Something went wrong, couldn't get session")
        }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        try {
            const response = await this.getSession<ICreateSessionOpts>(sessionId)
            if (!response.success) return response
            const user = await this.User.findById(response.session.userId)
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!userId) return sendError("User ID is required")
        try {
            const user = await this.User.findById(userId)
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findByIdAndDelete(sessionId)
            if (!session) return sendError("Couldn't delete session")
            return { success: true, session: session }
        } catch (error) {
            return sendError("Something went wrong, couldn't delete session")
        }
    }

    async deleteUsersAllSessions(sessionId?: string): Promise<{ success: boolean; message: string }> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findById(sessionId)
            if (!session) return sendError("Couldn't find session")
            await this.Session.deleteMany({ userId: session.userId })
            return { success: true, message: "Deleted All Sessions" }
        } catch (error) {
            return sendError("Something wen't wrong, couldn't delete all sessions")
        }
    }
}
