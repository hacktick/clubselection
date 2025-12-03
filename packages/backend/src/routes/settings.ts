import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/settings/:key - Get a specific setting (public)
router.get('/settings/:key', async (req: Request, res: Response) => {
    const { key } = req.params;

    try {
        const setting = await prisma.settings.findUnique({
            where: { key },
        });

        if (!setting) {
            // Return default value for site_title if not found
            if (key === 'site_title') {
                return res.json({
                    success: true,
                    setting: {
                        key: 'site_title',
                        value: 'Club Selection Management',
                    },
                });
            }
            return res.status(404).json({ error: 'Setting not found' });
        }

        return res.json({
            success: true,
            setting: {
                key: setting.key,
                value: setting.value,
            },
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/settings/:key - Update a setting (admin only)
router.put(
    '/admin/settings/:key',
    authenticateToken,
    requireAdmin,
    [
        body('value').trim().notEmpty().withMessage('Value is required'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { key } = req.params;
        const { value } = req.body;

        try {
            const setting = await prisma.settings.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });

            return res.json({
                success: true,
                setting: {
                    key: setting.key,
                    value: setting.value,
                },
            });
        } catch (error) {
            console.error('Error updating setting:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
