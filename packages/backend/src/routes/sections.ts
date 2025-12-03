import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/projects/:id/sections - List all time sections
router.get('/admin/projects/:id/sections', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const sections = await prisma.timeSection.findMany({
            where: { projectId: id },
            orderBy: { order: 'asc' },
        });

        return res.json({
            success: true,
            sections: sections.map(section => ({
                id: section.id,
                label: section.label,
                startTime: section.startTime,
                endTime: section.endTime,
                order: section.order,
                createdAt: section.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching sections:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/projects/:id/sections - Create time section
router.post(
    '/admin/projects/:id/sections',
    [
        param('id').isString(),
        body('label').trim().notEmpty().withMessage('Label is required'),
        body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (use HH:mm)'),
        body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (use HH:mm)'),
        body('order').optional().isInt({ min: 0 }).withMessage('Order must be >= 0'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const { label, startTime, endTime, order } = req.body;

        try {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Auto-assign order if not provided
            let sectionOrder = order;
            if (sectionOrder === undefined) {
                const maxOrder = await prisma.timeSection.findFirst({
                    where: { projectId: id },
                    orderBy: { order: 'desc' },
                    select: { order: true },
                });
                sectionOrder = maxOrder ? maxOrder.order + 1 : 0;
            }

            const section = await prisma.timeSection.create({
                data: {
                    label,
                    startTime,
                    endTime,
                    order: sectionOrder,
                    projectId: id,
                },
            });

            return res.json({
                success: true,
                section: {
                    id: section.id,
                    label: section.label,
                    startTime: section.startTime,
                    endTime: section.endTime,
                    order: section.order,
                    createdAt: section.createdAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error creating section:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PUT /api/admin/projects/:id/sections/:sectionId - Update time section
router.put(
    '/admin/projects/:id/sections/:sectionId',
    [
        param('id').isString(),
        param('sectionId').isString(),
        body('label').trim().notEmpty().withMessage('Label is required'),
        body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format (use HH:mm)'),
        body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format (use HH:mm)'),
        body('order').optional().isInt({ min: 0 }).withMessage('Order must be >= 0'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { sectionId } = req.params;
        const { label, startTime, endTime, order } = req.body;

        try {
            const section = await prisma.timeSection.update({
                where: { id: sectionId },
                data: {
                    label,
                    startTime,
                    endTime,
                    order: order ?? undefined,
                },
            });

            return res.json({
                success: true,
                section: {
                    id: section.id,
                    label: section.label,
                    startTime: section.startTime,
                    endTime: section.endTime,
                    order: section.order,
                    updatedAt: section.updatedAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error updating section:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// DELETE /api/admin/projects/:id/sections/:sectionId - Delete time section
router.delete('/admin/projects/:id/sections/:sectionId', async (req: Request, res: Response) => {
    const { sectionId } = req.params;

    try {
        // Check if section is in use
        const usageCount = await prisma.courseOccurrence.count({
            where: { sectionId },
        });

        if (usageCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete section',
                message: `This section is used by ${usageCount} course occurrence(s). Please remove those first.`,
            });
        }

        await prisma.timeSection.delete({
            where: { id: sectionId },
        });

        return res.json({
            success: true,
            message: 'Section deleted',
        });
    } catch (error) {
        console.error('Error deleting section:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
