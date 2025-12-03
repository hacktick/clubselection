import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// Helper function to hash identifier (same as in projects.ts)
function hashIdentifier(input: string): string {
    const normalized = input.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return hash.substring(0, 12);
}

// POST /api/students/validate-token - Validate student identifier  
router.post('/students/validate-token', async (req: Request, res: Response) => {
    const { token: identifier } = req.body;  // 'token' is actually the plain identifier

    if (!identifier) {
        return res.status(400).json({ error: 'Identifier is required' });
    }

    try {
        // Hash the identifier to get the token
        const hashedToken = hashIdentifier(identifier);

        const student = await prisma.student.findUnique({
            where: { token: hashedToken },
            include: {
                projects: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });

        if (!student) {
            return res.status(404).json({ error: 'Invalid identifier' });
        }

        // Generate JWT token for student
        const jwtToken = generateToken({
            id: student.id,
            role: 'student',
            token: hashedToken
        });

        return res.json({
            success: true,
            token: jwtToken,
            student: {
                id: student.id,
                name: student.name,
                token: hashedToken,  // Send back the hashed token for storage
            },
            projects: student.projects,
        });
    } catch (error) {
        console.error('Error validating identifier:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/students/:token/projects - Get student's enrolled projects
// Note: :token here is the already-hashed token, not the plain identifier
router.get('/students/:token/projects', async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
        const student = await prisma.student.findUnique({
            where: { token },
            include: {
                projects: {
                    include: {
                        courses: {
                            include: {
                                enrollments: {
                                    where: {
                                        studentId: '', // Will be updated after we get student.id
                                    },
                                },
                            },
                        },
                    },
                },
                submissions: true,
            },
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get projects with enrollment and submission status
        const projectsWithStatus = student.projects.map((project) => {
            // Check if student has any enrollment in this project's courses
            const hasEnrollment = project.courses.some(
                (course) => course.enrollments.some(e => e.studentId === student.id)
            );

            // Check if student has submitted for this project
            const hasSubmitted = student.submissions.some(
                (submission) => submission.projectId === project.id
            );

            return {
                id: project.id,
                name: project.name,
                description: project.description,
                timezone: project.timezone,
                submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
                submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
                hasEnrollment,
                hasSubmitted,
            };
        });

        return res.json({
            student: {
                id: student.id,
                name: student.name,
            },
            projects: projectsWithStatus,
        });
    } catch (error) {
        console.error('Error fetching student projects:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/students/:token/projects/:projectId - Get project details for student
router.get('/students/:token/projects/:projectId', async (req: Request, res: Response) => {
    const { token, projectId } = req.params;

    try {
        // First, find the student to get their ID
        const student = await prisma.student.findUnique({
            where: { token },
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Now fetch the project with enrollments filtered by the actual student ID
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                students: {
                    some: {
                        id: student.id,
                    },
                },
            },
            include: {
                timeSections: {
                    orderBy: { order: 'asc' },
                },
                tags: true,
                courses: {
                    include: {
                        occurrences: {
                            include: {
                                section: true,
                            },
                        },
                        tags: true,
                        enrollments: {
                            where: {
                                studentId: student.id,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or not assigned to student' });
        }

        // Check if student has submitted
        const submission = await prisma.submission.findUnique({
            where: {
                studentId_projectId: {
                    studentId: student.id,
                    projectId: projectId,
                },
            },
        });

        // Format the response
        const formattedProject = {
            id: project.id,
            name: project.name,
            description: project.description,
            timezone: project.timezone,
            submissionStart: project.submissionStart ? project.submissionStart.toISOString() : null,
            submissionEnd: project.submissionEnd ? project.submissionEnd.toISOString() : null,
            timeSections: project.timeSections,
            tags: project.tags,
            courses: project.courses.map((course) => ({
                id: course.id,
                name: course.name,
                description: course.description,
                capacity: course.capacity,
                occurrences: course.occurrences,
                tags: course.tags,
                isEnrolled: course.enrollments.length > 0,
            })),
            hasSubmitted: !!submission,
        };

        return res.json({
            success: true,
            project: formattedProject,
        });
    } catch (error) {
        console.error('Error fetching student project details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/students/:token/enroll - Enroll student in a course
router.post('/students/:token/enroll', async (req: Request, res: Response) => {
    const { token } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        // Find student by token
        const student = await prisma.student.findUnique({
            where: { token },
            include: {
                enrollments: {
                    include: {
                        course: true,
                    },
                },
            },
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: true,
                project: {
                    include: {
                        students: {
                            where: { id: student.id },
                        },
                    },
                },
            },
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Verify student is enrolled in this project
        if (course.project.students.length === 0) {
            return res.status(403).json({ error: 'You are not enrolled in this project' });
        }

        // Check if student is already enrolled in this course
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: student.id,
                    courseId: courseId,
                },
            },
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'You are already enrolled in this course' });
        }

        // Check course capacity
        const currentEnrollments = course.enrollments.filter(e => e.status === 'CONFIRMED').length;
        if (course.capacity && currentEnrollments >= course.capacity) {
            return res.status(400).json({ error: 'This course is full' });
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                studentId: student.id,
                courseId: courseId,
                status: 'CONFIRMED',
            },
        });

        return res.json({
            success: true,
            enrollment: {
                id: enrollment.id,
                courseId: enrollment.courseId,
                status: enrollment.status,
                createdAt: enrollment.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error enrolling student:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/students/:token/enroll/:courseId - Unenroll student from a course
router.delete('/students/:token/enroll/:courseId', async (req: Request, res: Response) => {
    const { token, courseId } = req.params;

    try {
        // Find student by token
        const student = await prisma.student.findUnique({
            where: { token },
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find the enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: student.id,
                    courseId: courseId,
                },
            },
            include: {
                course: {
                    include: {
                        project: {
                            include: {
                                students: {
                                    where: { id: student.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        // Verify student is enrolled in this project
        if (enrollment.course.project.students.length === 0) {
            return res.status(403).json({ error: 'You are not enrolled in this project' });
        }

        // Delete the enrollment
        await prisma.enrollment.delete({
            where: {
                studentId_courseId: {
                    studentId: student.id,
                    courseId: courseId,
                },
            },
        });

        return res.json({
            success: true,
            message: 'Successfully unenrolled from course',
        });
    } catch (error) {
        console.error('Error unenrolling student:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/students/:token/projects/:projectId/submit - Submit enrollment selections
router.post('/students/:token/projects/:projectId/submit', async (req: Request, res: Response) => {
    const { token, projectId } = req.params;

    try {
        // Find student by token
        const student = await prisma.student.findUnique({
            where: { token },
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Fetch the project with all needed data
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                students: {
                    some: {
                        id: student.id,
                    },
                },
            },
            include: {
                tags: true,
                courses: {
                    include: {
                        tags: true,
                        enrollments: {
                            where: {
                                studentId: student.id,
                                status: 'CONFIRMED',
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found or not assigned to student' });
        }

        // Get all enrolled courses for this student in this project
        const enrolledCourses = project.courses.filter(course => course.enrollments.length > 0);

        // Validate tag requirements
        for (const tag of project.tags) {
            const coursesWithTag = enrolledCourses.filter(course =>
                course.tags.some(t => t.id === tag.id)
            );

            if (coursesWithTag.length < tag.minRequired) {
                return res.status(400).json({
                    error: `You must select at least ${tag.minRequired} course(s) from "${tag.name}"`,
                });
            }

            if (tag.maxAllowed !== null && coursesWithTag.length > tag.maxAllowed) {
                return res.status(400).json({
                    error: `You can select at most ${tag.maxAllowed} course(s) from "${tag.name}"`,
                });
            }
        }

        // Check if submission already exists
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                studentId_projectId: {
                    studentId: student.id,
                    projectId: projectId,
                },
            },
        });

        if (existingSubmission) {
            return res.status(400).json({ error: 'You have already submitted your selections for this project' });
        }

        // Create submission
        const submission = await prisma.submission.create({
            data: {
                studentId: student.id,
                projectId: projectId,
            },
        });

        return res.json({
            success: true,
            submission: {
                id: submission.id,
                submittedAt: submission.submittedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error submitting enrollment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
