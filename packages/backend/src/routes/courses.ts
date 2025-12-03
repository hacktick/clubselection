import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/projects/:id/courses - List all courses
router.get('/admin/projects/:id/courses', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const courses = await prisma.course.findMany({
            where: { projectId: id },
            include: {
                occurrences: {
                    include: {
                        section: true,
                    },
                    orderBy: [
                        { dayOfWeek: 'asc' },
                        { section: { order: 'asc' } },
                    ],
                },
                tags: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return res.json({
            success: true,
            courses: courses.map(course => ({
                id: course.id,
                name: course.name,
                description: course.description,
                capacity: course.capacity,
                occurrences: course.occurrences.map(occ => ({
                    id: occ.id,
                    dayOfWeek: occ.dayOfWeek,
                    sectionId: occ.sectionId,
                    section: occ.section,
                })),
                tags: course.tags,
                createdAt: course.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/projects/:id/courses - Create course
router.post(
    '/admin/projects/:id/courses',
    [
        param('id').isString(),
        body('name').trim().notEmpty().withMessage('Course name is required'),
        body('description').optional().trim(),
        body('capacity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Capacity must be >= 1'),
        body('tagIds').optional().isArray().withMessage('Tag IDs must be an array'),
        body('occurrences').isArray({ min: 1 }).withMessage('At least one occurrence is required'),
        body('occurrences.*.dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6'),
        body('occurrences.*.sectionId').optional().isString().withMessage('Section ID must be a string'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const { name, description, capacity, tagIds, occurrences } = req.body;

        try {
            const project = await prisma.project.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const course = await prisma.course.create({
                data: {
                    name,
                    description: description || null,
                    capacity: capacity || null,
                    projectId: id,
                    occurrences: {
                        create: occurrences.map((occ: any) => ({
                            dayOfWeek: occ.dayOfWeek,
                            sectionId: occ.sectionId,
                        })),
                    },
                    tags: tagIds && tagIds.length > 0 ? {
                        connect: tagIds.map((tagId: string) => ({ id: tagId })),
                    } : undefined,
                },
                include: {
                    occurrences: true,
                    tags: true,
                },
            });

            return res.json({
                success: true,
                course: {
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    capacity: course.capacity,
                    occurrences: course.occurrences,
                    tags: course.tags,
                    createdAt: course.createdAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error creating course:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PUT /api/admin/projects/:id/courses/:courseId - Update course
router.put(
    '/admin/projects/:id/courses/:courseId',
    [
        param('id').isString(),
        param('courseId').isString(),
        body('name').trim().notEmpty().withMessage('Course name is required'),
        body('description').optional().trim(),
        body('capacity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Capacity must be >= 1'),
        body('tagIds').optional().isArray().withMessage('Tag IDs must be an array'),
        body('occurrences').isArray().withMessage('Occurrences must be an array'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { courseId } = req.params;
        const { name, description, capacity, tagIds, occurrences } = req.body;

        try {
            // Delete existing occurrences and create new ones
            await prisma.courseOccurrence.deleteMany({
                where: { courseId },
            });

            const course = await prisma.course.update({
                where: { id: courseId },
                data: {
                    name,
                    description: description || null,
                    capacity: capacity || null,
                    occurrences: {
                        create: occurrences.map((occ: any) => ({
                            dayOfWeek: occ.dayOfWeek,
                            sectionId: occ.sectionId,
                        })),
                    },
                    tags: {
                        set: tagIds && tagIds.length > 0
                            ? tagIds.map((tagId: string) => ({ id: tagId }))
                            : [],
                    },
                },
                include: {
                    occurrences: {
                        include: {
                            section: true,
                        },
                    },
                    tags: true,
                },
            });

            return res.json({
                success: true,
                course: {
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    capacity: course.capacity,
                    occurrences: course.occurrences,
                    tags: course.tags,
                    updatedAt: course.updatedAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error updating course:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// DELETE /api/admin/projects/:id/courses/:courseId - Delete course
router.delete('/admin/projects/:id/courses/:courseId', async (req: Request, res: Response) => {
    const { courseId } = req.params;

    try {
        await prisma.course.delete({
            where: { id: courseId },
        });

        return res.json({
            success: true,
            message: 'Course deleted',
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
