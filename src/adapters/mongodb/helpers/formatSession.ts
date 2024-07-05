import { type Model } from "mongoose"
import { ISession } from "@/types"

export function formatSession(session: Awaited<ReturnType<Model<ISession>["create"]>>[0]): ISession {
    return { id: String(session._id), userId: String(session.userId), expiresAt: session.expiresAt }
}
