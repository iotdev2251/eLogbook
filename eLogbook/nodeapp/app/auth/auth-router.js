import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
import { authMiddleware, adminMiddleware } from './auth-middleware.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_prod';

// @route   POST /auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '7 days' },
            (err, token) => {
                if (err) throw err;
                // Set cookie for browser clients
                res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /auth/me
// @desc    Get logged in user details
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, role: true, created_at: true }
        });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ msg: 'Logged out successfully' });
});

// @route   GET /auth/users
// @desc    Get all users (Admin only)
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, role: true, created_at: true }
        });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /auth/users
// @desc    Create a new user (Admin only)
router.post('/users', [authMiddleware, adminMiddleware], async (req, res) => {
    const { username, password, role } = req.body;
    try {
        let user = await prisma.user.findUnique({ where: { username } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role || 'viewer'
            },
            select: { id: true, username: true, role: true }
        });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /auth/users/:id
// @desc    Delete a user (Admin only)
router.delete('/users/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ msg: 'Cannot delete yourself' });
        }
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export const authRouter = router;
