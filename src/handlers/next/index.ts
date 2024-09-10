import { Adapter, ICreateSessionOpts, SessionResponse } from "@/types"
import { parseExpires } from "@/utils/parseExpires"
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"
import { cookies } from "next/headers"

interface CookieOptions extends Omit<ResponseCookie, "expires"> {
    expires: string | number | undefined
}

interface IAuthOpts {
    adapter: Adapter
    cookie?: { name?: string; options?: Partial<CookieOptions> }
}

export function NextHandler<U, S = unknown>({ adapter, cookie }: IAuthOpts) {
    const cookieName = cookie?.name || "session_id"
    const cookieExpiresIn = cookie?.options?.expires
    return {
        createSession: async (opts: ICreateSessionOpts) => {
            const response = await adapter.createSession<{ id: string } & S>(opts)
            if (!response.success) return response
            cookies().set(cookieName, response.session.id, { ...cookie?.options, expires: parseExpires(cookieExpiresIn) })
            return response as SessionResponse<S>
        },
        getCurrentUser: () => adapter.getUserBySessionId<U>(cookies().get(cookieName)?.value),
        getCurrentSession: () => adapter.getSession<S>(cookies().get(cookieName)?.value),
        deleteCurrentSession: async () => {
            const sessionId = cookies().get(cookieName)?.value
            const response = await adapter.deleteSession<S>(sessionId)
            if (!response.success) return response
            cookies().delete(cookieName)
            return response
        },
        deleteUsersAllSessions: async () => {
            const sessionId = cookies().get(cookieName)?.value
            const response = await adapter.deleteUsersAllSessions(sessionId)
            if (!response.success) return response
            cookies().delete(cookieName)
            return response
        },
        adapter,
    }
}
