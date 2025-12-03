import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import prisma from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/login - Admin authentication
router.post(
    '/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').trim().notEmpty().withMessage('Password is required'),
    ],
    async (req: Request, res: Response) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Invalid input',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        try {
            // Find admin by username
            const admin = await prisma.admin.findUnique({
                where: { username },
            });

            if (!admin) {
                return res.status(401).json({
                    error: 'Invalid username or password'
                });
            }

            // Compare password
            const isValidPassword = await bcrypt.compare(password, admin.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid username or password'
                });
            }

            // Generate JWT token
            const token = generateToken({
                id: admin.id,
                role: 'admin',
                username: admin.username
            });

            // Successfully authenticated
            return res.json({
                success: true,
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    name: admin.name,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
);

export default router;
