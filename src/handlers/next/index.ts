import { Adapter, ICreateSessionOpts, SessionResponse } from "@/types"
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"
import { cookies } from "next/headers"

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: Partial<ResponseCookie> }
}

export function NextHandler<U, S = unknown>({ adapter, cookie }: IAuthOpts) {
    return {
        createSession: async (opts: ICreateSessionOpts) => {
            const response = await adapter.createSession<{ id: string } & S>(opts)
            if (!response.success) return response
            cookies().set(cookie?.name || "session_id", response.session.id, {
                expires: opts.expiresAt,
                ...cookie?.options,
            })
            return response as SessionResponse<S>
        },
        getCurrentUser: () => {
            const sessionId = cookies().get(cookie?.name || "session_id")?.value
            return adapter.getUserBySessionId<U>(sessionId)
        },
        getCurrentSession: () => {
            const sessionId = cookies().get(cookie?.name || "session_id")?.value
            return adapter.getSession<S>(sessionId)
        },
        deleteCurrentSession: async () => {
            const sessionId = cookies().get(cookie?.name || "session_id")?.value
            const response = await adapter.deleteSession<S>(sessionId)
            if (!response.success) return response
            cookies().delete(cookie?.name || "session_id")
            return response
        },
        deleteUsersAllSessions: async () => {
            const sessionId = cookies().get(cookie?.name || "session_id")?.value
            const response = await adapter.deleteUsersAllSessions(sessionId)
            if (!response.success) return response
            cookies().delete(cookie?.name || "session_id")
            return response
        },
        adapter,
    }
}
