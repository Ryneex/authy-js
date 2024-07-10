export interface ICreateSessionOpts {
    userId: string
    expiresAt: Date
    [x: string]: unknown
}

export type ErrorResponse = { success: false; message: string }
export type SessionResponse<T = unknown> = { success: true; session: T } | ErrorResponse
export type UserResponse<T = unknown> = { success: true; user: T } | ErrorResponse

export interface Adapter {
    createSession<T>(opts: ICreateSessionOpts): Promise<SessionResponse<T>>
    getSession<T>(sessionId?: string): Promise<SessionResponse<T>>
    deleteSession<T>(sessionId?: string): Promise<SessionResponse<T>>
    getUserBySessionId<T>(sessionId?: string): Promise<UserResponse<T>>
    getUserByUserId<T>(userId?: string): Promise<UserResponse<T>>
    deleteUsersAllSessions(sessionId?: string): Promise<{ success: boolean; message: string }>
}
