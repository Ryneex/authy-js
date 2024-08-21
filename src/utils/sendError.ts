export const UserError = (e: string) => {
    return { success: false as false, message: e, user: null }
}

export const SessionError = (e: string) => {
    return { success: false as false, message: e, session: null }
}
