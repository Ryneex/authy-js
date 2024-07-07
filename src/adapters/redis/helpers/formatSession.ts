export function formatSession<T>(session: { expiresAt: Date | string; [x: string]: unknown }): T {
    return { ...session, expiresAt: new Date(session.expiresAt) } as T
}
