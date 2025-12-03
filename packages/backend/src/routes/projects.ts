import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// Helper function to generate student token from identifier
function generateStudentToken(input: string): string {
    const normalized = input.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return hash.substring(0, 12);
}

// POST /api/admin/projects/:id/students - Bulk add students
router.post(
    '/admin/projects/:id/students',
    [
        param('id').isString(),
        body('identifiers').isArray().withMessage('Identifiers must be an array'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const { identifiers } = req.body as { identifiers: string[] };

        try {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const students = [];
            for (const identifier of identifiers) {
                if (!identifier.trim()) continue;

                const token = generateStudentToken(identifier);

                // Upsert student
                const student = await prisma.student.upsert({
                    where: { token },
                    update: {},
                    create: {
                        token,
                        name: identifier, // Use identifier as name initially
                    },
                });

                students.push(student);
            }

            // Connect students to project
            await prisma.project.update({
                where: { id },
                data: {
                    students: {
                        connect: students.map(s => ({ id: s.id })),
                    },
                },
            });

            return res.json({
                success: true,
                addedCount: students.length,
                students: students.map(s => ({
                    id: s.id,
                    token: s.token,
                    name: s.name,
                })),
            });
        } catch (error) {
            console.error('Error adding students:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// GET /api/admin/projects/:id/students - Get all students for project
router.get('/admin/projects/:id/students', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const students = await prisma.student.findMany({
            where: {
                projects: {
                    some: {
                        id,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                token: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return res.json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/projects/:id/students/count - Get student count for project
router.get('/admin/projects/:id/students/count', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const count = await prisma.student.count({
            where: {
                projects: {
                    some: {
                        id,
                    },
                },
            },
        });

        return res.json({ count });
    } catch (error) {
        console.error('Error counting students:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/projects/:id/students - Get students for project
router.get('/admin/projects/:id/students', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                students: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        return res.json({
            success: true,
            count: project.students.length,
            students: project.students.map(s => ({
                id: s.id,
                token: s.token,
                name: s.name,
                createdAt: s.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/projects/:id/students - Remove all students from project
router.delete('/admin/projects/:id/students', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Disconnect all students from the project
        await prisma.project.update({
            where: { id },
            data: {
                students: {
                    set: [],
                },
            },
        });

        return res.json({
            success: true,
            message: 'All students removed from project',
        });
    } catch (error) {
        console.error('Error removing students:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/projects/:id/tags - List project tags
router.get('/admin/projects/:id/tags', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const tags = await prisma.tag.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'asc' },
        });

        return res.json({
            success: true,
            tags: tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                color: tag.color,
                minRequired: tag.minRequired,
                maxAllowed: tag.maxAllowed,
                createdAt: tag.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/projects/:id/tags - Create tag
router.post(
    '/admin/projects/:id/tags',
    [
        param('id').isString(),
        body('name').trim().notEmpty().withMessage('Tag name is required'),
        body('color').trim().notEmpty().withMessage('Tag color is required'),
        body('minRequired').optional().isInt({ min: 0 }).withMessage('Min required must be >= 0'),
        body('maxAllowed').optional({ nullable: true }).custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const num = Number(value);
            if (!Number.isInteger(num) || num < 1) {
                throw new Error('Max allowed must be >= 1 or empty for unlimited');
            }
            return true;
        }),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const { name, color, minRequired, maxAllowed } = req.body;

        try {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const tag = await prisma.tag.create({
                data: {
                    name,
                    color,
                    minRequired: minRequired ?? 0,
                    maxAllowed: maxAllowed ?? null,
                    projectId: id,
                },
            });

            return res.json({
                success: true,
                tag: {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    minRequired: tag.minRequired,
                    maxAllowed: tag.maxAllowed,
                    createdAt: tag.createdAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error creating tag:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PUT /api/admin/projects/:id/tags/:tagId - Update tag
router.put(
    '/admin/projects/:id/tags/:tagId',
    [
        param('id').isString(),
        param('tagId').isString(),
        body('name').trim().notEmpty().withMessage('Tag name is required'),
        body('color').trim().notEmpty().withMessage('Tag color is required'),
        body('minRequired').optional().isInt({ min: 0 }).withMessage('Min required must be >= 0'),
        body('maxAllowed').optional({ nullable: true }).custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const num = Number(value);
            if (!Number.isInteger(num) || num < 1) {
                throw new Error('Max allowed must be >= 1 or empty for unlimited');
            }
            return true;
        }),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { tagId } = req.params;
        const { name, color, minRequired, maxAllowed } = req.body;

        try {
            const tag = await prisma.tag.update({
                where: { id: tagId },
                data: {
                    name,
                    color,
                    minRequired: minRequired ?? 0,
                    maxAllowed: maxAllowed ?? null,
                },
            });

            return res.json({
                success: true,
                tag: {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    minRequired: tag.minRequired,
                    maxAllowed: tag.maxAllowed,
                    updatedAt: tag.updatedAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error updating tag:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// DELETE /api/admin/projects/:id/tags/:tagId - Delete tag
router.delete('/admin/projects/:id/tags/:tagId', async (req: Request, res: Response) => {
    const { tagId } = req.params;

    try {
        await prisma.tag.delete({
            where: { id: tagId },
        });

        return res.json({
            success: true,
            message: 'Tag deleted',
        });
    } catch (error) {
        console.error('Error deleting tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
