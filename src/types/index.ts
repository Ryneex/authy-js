export interface ISession {
    id: string
    userId: string
    expiresAt: Date
}

export type ErrorResponse = { success: false; message: string }
export type SessionResponse = { success: true; session: ISession } | ErrorResponse
export type UserResponse<T = unknown> = { success: true; user: T } | ErrorResponse

export interface Adapter {
    createSession(opts: { userId: string; expiresIn: number }): Promise<SessionResponse>
    getSession(sessionId: string): Promise<SessionResponse>
    deleteSession(sessionId: string): Promise<SessionResponse>
    getUserBySessionId<T>(sessionId: string): Promise<UserResponse<T>>
    getUserByUserId<T>(userId: string): Promise<UserResponse<T>>
    deleteUsersAllSessions(sessionId: string): Promise<{ success: boolean; message: string }>
}
