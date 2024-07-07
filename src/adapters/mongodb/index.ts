import type mongoose from "mongoose"
import { type Model } from "mongoose"
import getSessionModel from "./helpers/getSessionModel"
import { formatSession } from "./helpers/formatSession"
import { Adapter, ISession, SessionResponse, UserResponse } from "@/types"

interface IConstructor {
    User: Model<any>
    dbConnectionUrl?: string
    mongoose: typeof mongoose
}

const sendError = (message: string): { success: false; message: string } => ({ success: false, message })
const isSessionExpired = (session: ISession) => new Date() > session.expiresAt

export class MongodbAdapter implements Adapter {
    private Session: Model<ISession>
    private User: Model<any>

    constructor({ User, dbConnectionUrl, mongoose }: IConstructor) {
        // connect mongoose instance thats passed from server, if not connected
        if (dbConnectionUrl) !mongoose.connection.readyState && mongoose.connect(dbConnectionUrl)
        this.Session = getSessionModel(User, mongoose)
        this.User = User
    }

    async createSession(opts: { userId: string; expiresIn: number }): Promise<SessionResponse> {
        try {
            const session = await this.Session.create({ userId: opts.userId, expiresAt: new Date(Date.now() + opts.expiresIn) })
            if (!session) return sendError("Couldn't create session")
            return { success: true, session: formatSession(session) }
        } catch (error) {
            return sendError("Something went wrong, couldn't create session")
        }
    }

    async getSession(sessionId: string): Promise<SessionResponse> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findById(sessionId)
            if (!session) return sendError("Couldn't find session")
            if (isSessionExpired(session)) {
                await session.deleteOne()
                return sendError("Session has expired")
            }
            return { success: true, session: formatSession(session) }
        } catch (error) {
            return sendError("Something went wrong, couldn't get session")
        }
    }

    async getUserBySessionId<T>(sessionId: string): Promise<UserResponse<T>> {
        try {
            const response = await this.getSession(sessionId)
            if (!response.success) return response
            const user = await this.User.findById(response.session.userId)
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async getUserByUserId<T>(userId: string): Promise<UserResponse<T>> {
        if (!userId) return sendError("User ID is required")
        try {
            const user = await this.User.findById(userId)
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async deleteSession(sessionId: string): Promise<SessionResponse> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findByIdAndDelete(sessionId)
            if (!session) return sendError("Couldn't delete session")
            return { success: true, session: formatSession(session) }
        } catch (error) {
            return sendError("Something went wrong, couldn't delete session")
        }
    }

    async deleteUsersAllSessions(sessionId: string): Promise<{ success: boolean; message: string }> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findById(sessionId)
            if (!session) return sendError("Couldn't find session")
            await this.Session.deleteMany({ user: session.userId })
            return { success: true, message: "Deleted All Sessions" }
        } catch (error) {
            return sendError("Something wen't wrong, couldn't delete all sessions")
        }
    }
}
