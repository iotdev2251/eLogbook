import jwt from 'jsonwebtoken';
import { c } from '../../config/constant.js';
import { loggerFactory } from '../../config/logger.js';

const logger = loggerFactory('auth-middleware');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_prod';

export const authMiddleware = (req, res, next) => {
    // Check Authorization header or cookies
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
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
