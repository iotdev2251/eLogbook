import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many login attempts. Please try again later.' },
})
