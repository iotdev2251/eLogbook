import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../config/jwt.js';
import { loggerFactory } from '../../config/logger.js';
import { extractBearerToken } from './token-utils.js';

const logger = loggerFactory('auth-middleware');

export const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token || extractBearerToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded.user;
        next();
    } catch (err) {
        logger.error('Token verification failed', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied: Requires admin role' });
    }
};
