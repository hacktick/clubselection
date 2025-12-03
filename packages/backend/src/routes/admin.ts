import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { stringify as yamlStringify } from 'yaml';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// Helper function to generate student token from identifier (same as in projects.ts)
function generateStudentToken(input: string): string {
    const normalized = input.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return hash.substring(0, 12);
}

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/projects - List all projects with submission counts
router.get('/admin/projects', async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                courses: {
                    include: {
                        enrollments: true,
                    },
                },
                submissions: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const projectsData = await Promise.all(projects.map(async (project) => {
            // Get count of completed submissions (students who clicked submit)
            const completedCount = project.submissions.length;

            // Get unique students with enrollments
            const studentsWithEnrollments = new Set(
                project.courses.flatMap(course =>
                    course.enrollments.map(e => e.studentId)
                )
            );

            // Get unique students who have submitted
            const submittedStudentIds = new Set(
                project.submissions.map(s => s.studentId)
            );

            // In progress = students with enrollments but no submission
            const inProgressCount = Array.from(studentsWithEnrollments).filter(
                studentId => !submittedStudentIds.has(studentId)
            ).length;

            return {
                id: project.id,
                name: project.name,
                description: project.description,
                timezone: project.timezone,
                submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
                submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
                completedCount,
                inProgressCount,
                createdAt: project.createdAt.toISOString(),
            };
        }));

        return res.json({ success: true, projects: projectsData });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/projects - Create new project
router.post(
    '/admin/projects',
    [
        body('name').trim().notEmpty().withMessage('Project name is required'),
        body('description').optional().trim(),
        body('timezone').optional().trim(),
        body('submissionStart').optional().isISO8601().withMessage('Invalid start date'),
        body('submissionEnd').optional().isISO8601().withMessage('Invalid end date'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { name, description, timezone, submissionStart, submissionEnd } = req.body;

        try {
            const project = await prisma.project.create({
                data: {
                    name,
                    description: description || null,
                    timezone: timezone || 'UTC',
                    submissionStart: submissionStart ? new Date(submissionStart) : null,
                    submissionEnd: submissionEnd ? new Date(submissionEnd) : null,
                },
            });

            return res.json({
                success: true,
                project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    timezone: project.timezone,
                    submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
                    submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
                    createdAt: project.createdAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error creating project:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// GET /api/admin/projects/:id - Get project details with submissions
router.get('/admin/projects/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                courses: {
                    include: {
                        enrollments: {
                            include: {
                                student: true,
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const enrollments = project.courses.flatMap((course) =>
            course.enrollments.map((enrollment) => ({
                id: enrollment.id,
                studentName: enrollment.student.name || 'Unknown',
                studentToken: enrollment.student.token,
                courseName: course.name,
                status: enrollment.status,
                createdAt: enrollment.createdAt.toISOString(),
            }))
        );

        return res.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                timezone: project.timezone,
                submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
                submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
                submissionCount: enrollments.length,
                enrollments,
                createdAt: project.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/projects/:id - Update project (only if no submissions)
router.put(
    '/admin/projects/:id',
    [
        param('id').isString(),
        body('name').trim().notEmpty().withMessage('Project name is required'),
        body('description').optional().trim(),
        body('timezone').optional().trim(),
        body('submissionStart').optional().isISO8601().withMessage('Invalid start date'),
        body('submissionEnd').optional().isISO8601().withMessage('Invalid end date'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const { name, description, timezone, submissionStart, submissionEnd } = req.body;

        try {
            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    courses: {
                        include: {
                            enrollments: true,
                        },
                    },
                },
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const hasEnrollments = project.courses.some((course) => course.enrollments.length > 0);

            if (hasEnrollments) {
                return res.status(400).json({
                    error: 'Cannot edit project with existing submissions',
                });
            }

            const updatedProject = await prisma.project.update({
                where: { id },
                data: {
                    name,
                    description: description || null,
                    timezone: timezone || 'UTC',
                    submissionStart: submissionStart ? new Date(submissionStart) : null,
                    submissionEnd: submissionEnd ? new Date(submissionEnd) : null,
                },
            });

            return res.json({
                success: true,
                project: {
                    id: updatedProject.id,
                    name: updatedProject.name,
                    description: updatedProject.description,
                    timezone: updatedProject.timezone,
                    submissionStart: updatedProject.submissionStart ? updatedProject.submissionStart.toISOString() : null,
                    submissionEnd: updatedProject.submissionEnd ? updatedProject.submissionEnd.toISOString() : null,
                    updatedAt: updatedProject.updatedAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error updating project:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// DELETE /api/admin/projects/:id/submissions - Delete all submissions
router.delete('/admin/projects/:id/submissions', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                courses: true,
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const courseIds = project.courses.map((course) => course.id);

        const result = await prisma.enrollment.deleteMany({
            where: {
                courseId: {
                    in: courseIds,
                },
            },
        });

        return res.json({
            success: true,
            deletedCount: result.count,
        });
    } catch (error) {
        console.error('Error deleting submissions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/projects/:id/submissions/export - Export submissions by identifier list
router.post(
    '/admin/projects/:id/submissions/export',
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
            // Verify project exists
            const project = await prisma.project.findUnique({
                where: { id },
                select: { id: true, name: true },
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Hash all identifiers to tokens
            const tokenToIdentifier = new Map<string, string>();
            for (const identifier of identifiers) {
                if (identifier.trim()) {
                    const token = generateStudentToken(identifier);
                    tokenToIdentifier.set(token, identifier.trim());
                }
            }

            // Get all students matching these tokens
            const tokens = Array.from(tokenToIdentifier.keys());
            const students = await prisma.student.findMany({
                where: {
                    token: { in: tokens },
                    projects: { some: { id } },
                },
                include: {
                    submissions: {
                        where: { projectId: id },
                    },
                    enrollments: {
                        where: {
                            course: { projectId: id },
                        },
                        include: {
                            course: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            // Build result
            const foundTokens = new Set(students.map(s => s.token));
            const notFound: string[] = [];

            for (const [token, identifier] of tokenToIdentifier) {
                if (!foundTokens.has(token)) {
                    notFound.push(identifier);
                }
            }

            const submissions = students.map(student => ({
                identifier: tokenToIdentifier.get(student.token) || student.name || student.token,
                token: student.token,
                studentName: student.name,
                submittedAt: student.submissions[0]?.submittedAt?.toISOString() || null,
                enrollments: student.enrollments.map(e => ({
                    courseName: e.course.name,
                    status: e.status,
                })),
            }));

            return res.json({
                project: {
                    id: project.id,
                    name: project.name,
                },
                submissions,
                notFound,
            });
        } catch (error) {
            console.error('Error exporting submissions:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// POST /api/admin/projects/import - Import project from YAML data
router.post(
    '/admin/projects/import',
    [
        body('name').trim().notEmpty().withMessage('Project name is required'),
        body('description').optional().trim(),
        body('timezone').optional().trim(),
        body('submissionStart').optional(),
        body('submissionEnd').optional(),
        body('timeSections').optional().isArray(),
        body('tags').optional().isArray(),
        body('courses').optional().isArray(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const {
            name,
            description,
            timezone,
            submissionStart,
            submissionEnd,
            timeSections,
            tags,
            courses,
        } = req.body;

        // Helper to convert day name to number
        const dayNameToNumber: Record<string, number> = {
            monday: 0,
            tuesday: 1,
            wednesday: 2,
            thursday: 3,
            friday: 4,
            saturday: 5,
            sunday: 6,
        };

        // Helper to parse date from local datetime string (e.g., "2025-12-03T14:30")
        const parseLocalDateTime = (dateStr: string | null | undefined, tz: string): Date | null => {
            if (!dateStr) return null;
            try {
                // If it's already ISO format with timezone, parse directly
                if (dateStr.includes('Z') || dateStr.includes('+')) {
                    return new Date(dateStr);
                }
                // Assume local time in project timezone, convert to UTC
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return null;
                return date;
            } catch {
                return null;
            }
        };

        try {
            const projectTimezone = timezone || 'UTC';

            // Create project with all related data in a transaction
            const project = await prisma.$transaction(async (tx) => {
                // 1. Create the project
                const newProject = await tx.project.create({
                    data: {
                        name,
                        description: description || null,
                        timezone: projectTimezone,
                        submissionStart: parseLocalDateTime(submissionStart, projectTimezone),
                        submissionEnd: parseLocalDateTime(submissionEnd, projectTimezone),
                    },
                });

                // 2. Create time sections and build a map for later reference
                const sectionMap = new Map<string, string>(); // label -> id
                if (timeSections && Array.isArray(timeSections)) {
                    for (let i = 0; i < timeSections.length; i++) {
                        const section = timeSections[i];
                        if (section.label && section.startTime && section.endTime) {
                            const created = await tx.timeSection.create({
                                data: {
                                    label: section.label,
                                    startTime: section.startTime,
                                    endTime: section.endTime,
                                    order: i,
                                    projectId: newProject.id,
                                },
                            });
                            sectionMap.set(section.label, created.id);
                        }
                    }
                }

                // 3. Create tags and build a map for later reference
                const tagMap = new Map<string, string>(); // name -> id
                if (tags && Array.isArray(tags)) {
                    for (const tag of tags) {
                        if (tag.name) {
                            const created = await tx.tag.create({
                                data: {
                                    name: tag.name,
                                    color: tag.color || '#808080',
                                    minRequired: tag.minRequired ?? 0,
                                    maxAllowed: tag.maxAllowed ?? null,
                                    projectId: newProject.id,
                                },
                            });
                            tagMap.set(tag.name, created.id);
                        }
                    }
                }

                // 4. Create courses with occurrences and tag connections
                if (courses && Array.isArray(courses)) {
                    for (const course of courses) {
                        if (course.name) {
                            // Find tag IDs for this course
                            const courseTagIds: string[] = [];
                            if (course.tags && Array.isArray(course.tags)) {
                                for (const tagName of course.tags) {
                                    const tagId = tagMap.get(tagName);
                                    if (tagId) {
                                        courseTagIds.push(tagId);
                                    }
                                }
                            }

                            // Create course
                            const createdCourse = await tx.course.create({
                                data: {
                                    name: course.name,
                                    description: course.description || null,
                                    capacity: course.capacity ?? null,
                                    projectId: newProject.id,
                                    tags: {
                                        connect: courseTagIds.map((id) => ({ id })),
                                    },
                                },
                            });

                            // Create occurrences
                            if (course.occurrences && Array.isArray(course.occurrences)) {
                                for (const occ of course.occurrences) {
                                    const dayOfWeek = typeof occ.dayOfWeek === 'string'
                                        ? dayNameToNumber[occ.dayOfWeek.toLowerCase()] ?? 0
                                        : occ.dayOfWeek ?? 0;

                                    const sectionId = sectionMap.get(occ.section);
                                    if (sectionId) {
                                        await tx.courseOccurrence.create({
                                            data: {
                                                dayOfWeek,
                                                courseId: createdCourse.id,
                                                sectionId,
                                            },
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                return newProject;
            });

            return res.json({
                success: true,
                project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    timezone: project.timezone,
                    submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
                    submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
                    createdAt: project.createdAt.toISOString(),
                },
            });
        } catch (error) {
            console.error('Error importing project:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// GET /api/admin/projects/:id/export - Export project definition as YAML
router.get('/admin/projects/:id/export', async (req: Request, res: Response) => {
    const { id } = req.params;

    // Helper to format date as local time in project timezone: 2025-12-03T14:30
    const formatLocalDateTime = (date: Date | null, timezone: string): string | null => {
        if (!date) return null;
        const formatted = date.toLocaleString('sv-SE', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        // sv-SE locale gives us "2025-12-03 14:30", convert space to T
        return formatted.replace(' ', 'T');
    };

    // Helper to convert dayOfWeek number to English name
    const dayOfWeekNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const getDayName = (dayOfWeek: number): string => dayOfWeekNames[dayOfWeek] || `day${dayOfWeek}`;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                timeSections: true,
                tags: true,
                courses: {
                    include: {
                        occurrences: true,
                        tags: true,
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Build export structure (excluding students, enrollments, submissions)
        const exportData = {
            name: project.name,
            description: project.description,
            timezone: project.timezone,
            submissionStart: formatLocalDateTime(project.submissionStart, project.timezone),
            submissionEnd: formatLocalDateTime(project.submissionEnd, project.timezone),
            timeSections: project.timeSections.map((section) => ({
                label: section.label,
                startTime: section.startTime,
                endTime: section.endTime,
            })),
            tags: project.tags.map((tag) => {
                // Only include non-null properties
                const tagData: Record<string, string | number> = { name: tag.name };
                if (tag.color !== null) tagData.color = tag.color;
                if (tag.minRequired !== null) tagData.minRequired = tag.minRequired;
                if (tag.maxAllowed !== null) tagData.maxAllowed = tag.maxAllowed;
                return tagData;
            }),
            courses: project.courses.map((course) => ({
                name: course.name,
                description: course.description,
                capacity: course.capacity,
                tags: course.tags.map((t) => t.name),
                occurrences: course.occurrences.map((occ) => {
                    const section = project.timeSections.find((s) => s.id === occ.sectionId);
                    return {
                        dayOfWeek: getDayName(occ.dayOfWeek),
                        section: section?.label || occ.sectionId,
                    };
                }),
            })),
        };

        const yaml = yamlStringify(exportData);
        const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.yml`;

        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(yaml);
    } catch (error) {
        console.error('Error exporting project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
