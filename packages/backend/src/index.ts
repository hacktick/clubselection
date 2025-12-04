import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.js';
import enrollRoutes from './routes/enroll.js';
import adminRoutes from './routes/admin.js';
import projectsRoutes from './routes/projects.js';
import coursesRoutes from './routes/courses.js';
import sectionsRoutes from './routes/sections.js';
import studentsRoutes from './routes/students.js';
import settingsRoutes from './routes/settings.js';
import embedRoutes from './routes/embed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
// Swagger API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Club Selection API Documentation',
}));

// OpenAPI JSON endpoint
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder routes
app.get('/api', (req, res) => {
    res.json({ message: 'Club Selection API Server' });
});

// Public student routes (must come before protected routes)
app.use('/api', studentsRoutes);
app.use('/api', enrollRoutes);
app.use('/api', settingsRoutes);
app.use('/api', embedRoutes);

// Protected routes
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', projectsRoutes);
app.use('/api', coursesRoutes);
app.use('/api', sectionsRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
