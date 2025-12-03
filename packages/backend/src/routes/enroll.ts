import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import prisma from '../db.js';

const router = Router();

// GET /api/enroll?token=xyz - Student enrollment page
router.get(
    '/enroll',
    [
        query('token').trim().notEmpty().withMessage('Token is required'),
    ],
    async (req: Request, res: Response) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Token is required',
                details: errors.array()
            });
        }

        const { token } = req.query as { token: string };

        try {
            // Find student by token
            const student = await prisma.student.findUnique({
                where: { token },
                include: {
                    projects: {
                        include: {
                            courses: {
                                include: {
                                    enrollments: {
                                        where: {
                                            studentId: '',  // Will be updated below
                                        },
                                    },
                                    rules: {
                                        where: {
                                            ruleType: 'TIME_CONSTRAINT',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!student) {
                return res.status(404).json({
                    error: 'Invalid token. This token is not associated with any projects.'
                });
            }

            // Update the query to use the actual student ID
            const studentWithProjects = await prisma.student.findUnique({
                where: { token },
                include: {
                    projects: {
                        include: {
                            courses: {
                                include: {
                                    enrollments: {
                                        where: {
                                            studentId: student.id,
                                        },
                                    },
                                    rules: {
                                        where: {
                                            ruleType: 'TIME_CONSTRAINT',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!studentWithProjects || studentWithProjects.projects.length === 0) {
                return res.status(404).json({
                    error: 'No projects found for this token.'
                });
            }

            // Format the response
            const projectsData = studentWithProjects.projects.map((project) => {
                // Check if student has any enrollment in this project's courses
                const hasEnrollment = project.courses.some(
                    (course) => course.enrollments.length > 0
                );

                // Find the earliest submission window end time from all courses
                let submissionWindowEnd: Date | null = null;
                for (const course of project.courses) {
                    for (const rule of course.rules) {
                        if (rule.endTime) {
                            if (!submissionWindowEnd || rule.endTime < submissionWindowEnd) {
                                submissionWindowEnd = rule.endTime;
                            }
                        }
                    }
                }

                return {
                    projectId: project.id,
                    projectName: project.name,
                    projectDescription: project.description,
                    hasSubmittedEnrollment: hasEnrollment,
                    submissionWindowEnd: submissionWindowEnd?.toISOString() ?? null,
                    coursesCount: project.courses.length,
                };
            });

            return res.json({
                success: true,
                student: {
                    id: student.id,
                    name: student.name,
                    token: student.token,
                },
                projects: projectsData,
            });
        } catch (error) {
            console.error('Enrollment error:', error);
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
);

export default router;
