export function extractBearerToken(authHeader) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7, authHeader.length)
    }
    return ''
}

export function extractTokenFromCookie(cookieHeader) {
    if (!cookieHeader) {
        return ''
    }
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
}

export function extractAuthToken({ authorization, cookie } = {}) {
    return extractBearerToken(authorization) || extractTokenFromCookie(cookie)
}
