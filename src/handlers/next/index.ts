import { Adapter, ICreateSessionOpts } from "@/types"
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"
import { cookies } from "next/headers"

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: Partial<ResponseCookie> }
}

export function NextHandler({ adapter, cookie }: IAuthOpts) {
    return () => {
        const sessionId = cookies().get(cookie?.name || "session_id")?.value
        return {
            createSession: async <T>(opts: ICreateSessionOpts) => {
                const response = await adapter.createSession<{ id: string }>(opts)
                if (!response.success) return response
                cookies().set(cookie?.name || "session_id", response.session.id, {
                    secure: true,
                    ...cookie?.options,
                })
                return response as T
            },
            getCurrentUser: <T>() => adapter.getUserBySessionId<T>(sessionId),
            getCurrentSession: <T>() => adapter.getSession<T>(sessionId),
            deleteCurrentSession: async <T>() => {
                const response = await adapter.deleteSession<T>(sessionId)
                if (!response.success) return response
                cookies().delete(cookie?.name || "session_id")
                return response
            },
            deleteUsersAllSessions: async () => {
                const response = await adapter.deleteUsersAllSessions(sessionId)
                if (!response.success) return response
                cookies().delete(cookie?.name || "session_id")
                return response
            },
            adapter,
        }
    }
}
