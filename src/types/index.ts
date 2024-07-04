interface ISession {
    id: string
    userId: string
    expiresAt: Date
}

type ErrorResponse = { success: false; message: string }
type SessionResponse = { success: true; session: ISession } | ErrorResponse
type UserResponse<T = unknown> = { success: true; user: T } | ErrorResponse

interface Adapter {
    createSession(opts: { userId: string; expiresIn: number }): Promise<SessionResponse>
    getSession(sessionId: string): Promise<SessionResponse>
    deleteSession(sessionId: string): Promise<SessionResponse>
    getUser(sessionId: string): Promise<UserResponse>
    deleteUsersAllSessions(sessionId: string): Promise<{ success: boolean; message: string }>
}
