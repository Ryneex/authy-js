import ms from "ms"

export function parseExpires(expires: string | number | undefined) {
    if (typeof expires === "string") {
        const duration = ms(expires)
        if (!duration) throw new Error("expires is not a valid date string. val=" + expires)
        return new Date(Date.now() + duration)
    }
    if (typeof expires === "number") return new Date(Date.now() + expires)
    return expires
}
