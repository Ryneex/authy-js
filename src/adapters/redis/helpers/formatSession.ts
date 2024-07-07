import { ISession } from "@/types"

export function formatSession(session: { id: string; userId: string; expiresAt: string | Date }): ISession {
    return { id: session.id, userId: session.userId, expiresAt: new Date(session.expiresAt) }
}
