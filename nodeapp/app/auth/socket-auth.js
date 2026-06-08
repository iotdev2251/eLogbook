import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../../config/jwt.js'
import { loggerFactory } from '../../config/logger.js'
import { extractAuthToken } from './token-utils.js'

const logger = loggerFactory('socket-auth')

export function socketAuthMiddleware(socket, next) {
    const token = extractAuthToken({
        authorization: socket.handshake.headers?.authorization,
        cookie: socket.handshake.headers?.cookie,
    }) || socket.handshake.auth?.token

    if (!token) {
        return next(new Error('Unauthorized'))
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret())
        socket.user = decoded.user
        next()
    } catch (err) {
        logger.warn('Socket auth failed for %s', socket.id)
        next(new Error('Unauthorized'))
    }
}
