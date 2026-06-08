export const AUTH_COOKIE_NAME = 'token'

export function getAuthCookieOptions() {
    const secure = process.env.COOKIE_SECURE !== 'false'
    return {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
}

export function getClearAuthCookieOptions() {
    const { secure, sameSite } = getAuthCookieOptions()
    return {
        httpOnly: true,
        secure,
        sameSite,
    }
}
