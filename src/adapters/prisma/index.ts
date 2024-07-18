import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { sendError } from "@/utils/sendError"

const isSessionExpired = (session: any) => new Date() > session.expiresAt

type IConstructor = {
    // these objects will be generated using prisma, so types can't be guessed
    User: any
    Session?: any
}

export class PrismaAdapter implements Adapter {
    private User
    private Session

    constructor({ User, Session }: IConstructor) {
        this.User = User
        this.Session = Session
    }

    async createSession<T>(opts: ICreateSessionOpts): Promise<SessionResponse<T>> {
        try {
            const session = await this.Session.create({ data: opts })
            return { success: true, session: session }
        } catch (error) {
            return sendError(error)
        }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findUnique({ where: { id: sessionId } })
            if (!session) return sendError("Couldn't find session")
            if (isSessionExpired(session)) {
                await this.Session.delete({ where: { id: sessionId } })
                return sendError("Session has expired")
            }
            return { success: true, session }
        } catch (error) {
            return sendError("Something went wrong, couldn't get session")
        }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        try {
            const response = await this.getSession<{ userId: string }>(sessionId)
            if (!response.success) return response
            const user = await this.User.findUnique({ where: { id: response.session.userId } })
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!userId) return sendError("User ID is required")
        try {
            const user = await this.User.findUnique({ where: { id: userId } })
            if (!user) return sendError("User not found")
            return { success: true, user }
        } catch (error) {
            return sendError("Something went wrong, couldn't get user")
        }
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.delete({ where: { id: sessionId } })
            if (!session) return sendError("Couldn't delete session")
            return { success: true, session: session }
        } catch (error) {
            return sendError("Something went wrong, couldn't delete session")
        }
    }

    async deleteUsersAllSessions(sessionId?: string): Promise<{ success: boolean; message: string }> {
        if (!sessionId) return sendError("Session ID is required")
        try {
            const session = await this.Session.findUnique({ where: { id: sessionId } })
            if (!session) return sendError("Couldn't find session")
            await this.Session.deleteMany({ where: { userId: session.userId } })
            return { success: true, message: "Deleted All Sessions" }
        } catch (error) {
            return sendError("Something wen't wrong, couldn't delete all sessions")
        }
    }
}
