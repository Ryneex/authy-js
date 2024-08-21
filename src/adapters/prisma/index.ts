import { Adapter, ICreateSessionOpts, SessionResponse, UserResponse } from "@/types"
import { UserError, SessionError } from "@/utils/sendError"

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
        const session = await this.Session.create({ data: opts })
        return { success: true, session: session }
    }

    async getSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const session = await this.Session.findUnique({ where: { id: sessionId } })
        if (!session) return SessionError("Couldn't find session")
        if (isSessionExpired(session)) return SessionError("Session has expired")
        return { success: true, session }
    }

    async getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>> {
        const response = await this.getSession<{ userId: string }>(sessionId)
        if (!response.success) return UserError(response.message)
        const user = await this.User.findUnique({ where: { id: response.session.userId } })
        if (!user) return UserError("User not found")
        return { success: true, user }
    }

    async getUserByUserId<T>(userId?: string): Promise<UserResponse<T>> {
        if (!userId) return UserError("User ID is required")
        const user = await this.User.findUnique({ where: { id: userId } })
        if (!user) return UserError("User not found")
        return { success: true, user }
    }

    async deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>> {
        if (!sessionId) return SessionError("Session ID is required")
        const session = await this.Session.delete({ where: { id: sessionId } })
        if (!session) return SessionError("Couldn't delete session")
        return { success: true, session: session }
    }

    async deleteUsersAllSessions(sessionId?: string): Promise<{ success: boolean; message: string }> {
        if (!sessionId) return { success: false, message: "Session ID is required" }
        const session = await this.Session.findUnique({ where: { id: sessionId } })
        if (!session) return { success: false, message: "Couldn't find session" }
        await this.Session.deleteMany({ where: { userId: session.userId } })
        return { success: true, message: "Deleted All Sessions" }
    }
}
