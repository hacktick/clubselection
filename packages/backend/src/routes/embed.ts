import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/embed
 * Returns project status information for iframe embedding
 * Query params:
 *   - token: student token (required)
 *   - project: project ID (optional, returns first assigned project if not specified)
 */
router.get('/embed', async (req, res) => {
    try {
        const { token, project: projectId } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Find student by token
        const student = await prisma.student.findUnique({
            where: { token },
            include: {
                projects: {
                    where: projectId ? { id: projectId as string } : undefined,
                    select: {
                        id: true,
                        name: true,
                        submissionStart: true,
                        submissionEnd: true,
                    }
                },
                submissions: {
                    where: projectId ? { projectId: projectId as string } : undefined,
                    select: {
                        projectId: true,
                        submittedAt: true,
                    }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get the project (either specified or first assigned)
        const targetProject = student.projects[0];

        if (!targetProject) {
            return res.status(404).json({ error: 'No project found for this student' });
        }

        // Check if student has submitted for this project
        const submission = student.submissions.find(s => s.projectId === targetProject.id);
        const hasSubmitted = !!submission;

        // Calculate project status
        const now = new Date();
        const start = targetProject.submissionStart ? new Date(targetProject.submissionStart) : null;
        const end = targetProject.submissionEnd ? new Date(targetProject.submissionEnd) : null;

        let status: 'waiting' | 'open' | 'closed';
        let statusMessage: string;

        if (hasSubmitted) {
            status = 'open'; // Doesn't matter for display, submission takes precedence
            statusMessage = `Submitted on ${submission!.submittedAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        } else if (start && now < start) {
            status = 'waiting';
            statusMessage = `Opens on ${start.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        } else if (end && now > end) {
            status = 'closed';
            statusMessage = `Closed on ${end.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`;
        } else {
            status = 'open';
            if (end) {
                statusMessage = `Open until ${end.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            } else {
                statusMessage = 'Open for enrollment';
            }
        }

        return res.json({
            project: {
                id: targetProject.id,
                name: targetProject.name,
            },
            hasSubmitted,
            submittedAt: submission?.submittedAt || null,
            status,
            statusMessage,
        });
    } catch (error) {
        console.error('Embed error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
