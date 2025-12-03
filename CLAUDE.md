# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Club Selection Management System** - a full-stack TypeScript monorepo for managing student course/club enrollments. The system features a dual authentication model: traditional username/password for admins and token-based (QR code) authentication for students.

## Development Environment

**CRITICAL**: Development happens on **Windows**, deployment to **Linux**.

### Windows Command Line Compatibility Rules

**NEVER use `&&` for command chaining** - it's not reliable across Windows shells.

**Correct patterns**:
```bash
# Use separate commands
cd packages/backend
npm run db:migrate

# Use npm scripts with cross-platform tools (concurrently, npm-run-all)
# Example in package.json: "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""

# Use semicolons for PowerShell/CMD if needed (but prefer separate commands)
cd packages/backend ; npm run db:migrate
```

**Incorrect patterns**:
```bash
# DON'T USE - unreliable on Windows
cd packages/backend && npm run db:migrate
git add . && git commit -m "message" && git push
```

### Path Separators
- Use forward slashes `/` in cross-platform code (Node.js handles this)
- Use `path.join()` or `path.resolve()` in Node.js code for OS compatibility
- Package.json scripts should use `/` for paths

## Monorepo Structure

This is an **npm workspaces** monorepo with two packages:

- `packages/backend` - Express.js API server with Prisma ORM
- `packages/frontend` - Vue 3 SPA with Vite

**Important**: Always use workspace commands from the root, not individual package directories.

## Common Commands

### Development
```bash
# Start both frontend and backend with hot reload
npm run dev

# Start only backend (port 3001)
npm run dev:backend

# Start only frontend (port 5173)
npm run dev:frontend
```

### Database Operations

**From root directory** (using workspace commands):
```bash
# Generate Prisma Client after schema changes
npm run db:generate --workspace=backend

# Push schema changes without migration (dev only)
npm run db:push --workspace=backend

# Create and apply a migration
npm run db:migrate --workspace=backend

# Open Prisma Studio (visual database browser)
npm run db:studio --workspace=backend

# Seed database with default admin (username: admin, password: admin)
npm run db:seed --workspace=backend
```

**Alternative** (from backend directory):
```bash
cd packages/backend
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed
```

### Build
```bash
# Build both packages
npm run build

# Build individual packages
npm run build:backend
npm run build:frontend
```

## Architecture Essentials

### Dual Authentication System

**Critical Design Pattern**: This system has two completely separate authentication models:

1. **Admin Authentication** (`Admin` model)
   - Username/password with bcrypt hashing (10 salt rounds)
   - Stored in localStorage (JWT implementation pending)
   - Full system access for managing projects, courses, students

2. **Student Authentication** (`Student` model)
   - Token-based, no password required
   - Token is SHA-256 hash of identifier (email/ID), first 12 chars
   - Implementation: `crypto.createHash('sha256').update(identifier.toLowerCase().trim()).digest('hex').substring(0, 12)`
   - Supports QR code generation for easy student access

**Never mix these authentication models**. Students use tokens, admins use passwords.

### Database Schema - Key Relationships

The schema is highly relational. Understanding these relationships is critical:

```
Project (container for a selection period)
  ├─→ Course[] (clubs/classes offered)
  │    ├─→ CourseOccurrence[] (when courses meet: dayOfWeek + TimeSection)
  │    ├─→ Tag[] (many-to-many: categories with min/max constraints)
  │    └─→ Enrollment[] (student selections with status)
  ├─→ TimeSection[] (configurable time slots like "Period 1: 9:00-10:00")
  ├─→ Tag[] (course categories with enrollment rules)
  └─→ Student[] (many-to-many: enrolled students)

Student
  └─→ Enrollment[] (course selections)

Enrollment (junction table with status)
  ├─→ Student
  ├─→ Course
  └─→ status: PENDING | CONFIRMED | CANCELLED
```

**Key Business Rules**:
- Projects cannot be edited if enrollments exist (soft lock)
- TimeSection cannot be deleted if referenced by CourseOccurrence
- Enrollment has unique constraint on `[studentId, courseId]`
- All timestamps stored in UTC, displayed in project's timezone

### API Route Organization

Backend routes are modular by domain in `packages/backend/src/routes/`:

- `auth.ts` - Admin login (`POST /api/login`)
- `projects.ts` - Project CRUD (`/api/admin/projects/*`)
- `courses.ts` - Course management (`/api/admin/projects/:id/courses/*`)
- `sections.ts` - Time section management (`/api/admin/projects/:id/sections/*`)
- `students.ts` - Student token validation, bulk import (`/api/students/*`, `/api/admin/projects/:id/students`)
- `enroll.ts` - Student enrollment interface (`GET /api/enroll?token=xyz`)

All routes are mounted in `packages/backend/src/index.ts` with `/api` prefix.

**Pattern**: Routes use express-validator for input validation, then try-catch with consistent error responses (400 for validation, 404 for not found, 500 for errors).

**Security Requirements**:

*Admin Routes:* All routes under `/admin` must be protected with JWT authentication:
- JWT token must contain role `admin`
- If no valid admin role is found, return 401/403 status
- Frontend should redirect to `/` when unauthorized
- Currently NOT implemented - planned enhancement

*Student Routes:* All routes under `/student` must be protected with JWT authentication:
- JWT token must contain role `student`
- If no valid student role is found, return 401/403 status
- Frontend should redirect to `/` when unauthorized
- Student login/enrollment entry pages are exceptions (public access)
- Currently NOT implemented - planned enhancement

### Frontend Architecture

**Framework**: Vue 3 with Composition API (`<script setup>`)

**State Management**:
- Pinia store in `src/stores/auth.ts` handles admin/student authentication
- Admin persisted to localStorage, student stored in memory

**Routing**:
- Hash-based history mode (`createWebHashHistory`)
- **Security**: Protected routes require navigation guards
  - *Admin routes* (`/admin/*`): Check for valid JWT token with `admin` role
  - *Student routes* (`/student/*`): Check for valid JWT token with `student` role
  - Login/enrollment entry pages (`/login`, `/enroll`) are public
  - Redirect to `/` if unauthorized (401/403)
  - Currently NOT implemented - planned enhancement

**API Communication**:
- Direct `fetch()` calls (no centralized API client)
- Vite dev proxy forwards `/api/*` to `http://localhost:3001`

**Styling Convention**:
- Keep stylesheets separate from `.vue` files
- Use global CSS files (e.g., `src/styles/main.css`) when possible
- Avoid `<style scoped>` blocks in Vue components unless component-specific styling is absolutely necessary
- Prefer shared CSS classes for consistency

**Key Views**:
- `AdminDashboard.vue` - Project list for admins
- `ProjectDetail.vue` - Tabbed interface for managing courses, students, tags, sections
- `Enroll.vue` - Student token entry point
- `StudentProjects.vue` - Student project selection

## Important Patterns to Follow

### Code Organization

**File Size Limit**: When a file exceeds 500 lines, refactor to separate responsibilities into other files.

- Extract reusable logic into utility functions
- Split large components into smaller sub-components
- Move route handlers to separate controller files
- Create service layers for complex business logic
- Group related functions into modules

### When Working with Courses

Courses have **occurrences** (meeting times). Always handle them together:

```typescript
// Creating a course with occurrences
await prisma.course.create({
  data: {
    name: "Basketball",
    projectId: projectId,
    occurrences: {
      create: [
        { dayOfWeek: 1, sectionId: "..." }, // Monday
        { dayOfWeek: 3, sectionId: "..." }  // Wednesday
      ]
    }
  }
});

// Updating: DELETE old occurrences, CREATE new ones
await prisma.courseOccurrence.deleteMany({ where: { courseId } });
await prisma.courseOccurrence.createMany({ data: newOccurrences });
```

**dayOfWeek**: 0=Monday, 1=Tuesday, ..., 6=Sunday (not the JS standard!)

### When Working with Tags

Tags have min/max enrollment constraints:
- `minRequired`: minimum courses student must select (default 0)
- `maxAllowed`: maximum courses allowed (null = unlimited)

Tags are many-to-many with courses. When creating/updating courses, connect tags:

```typescript
tags: {
  connect: tagIds.map(id => ({ id }))
}
```

### When Working with Student Import

Students are created from identifiers (email/ID). The token generation must be consistent:

```typescript
const normalized = identifier.toLowerCase().trim();
const hash = crypto.createHash('sha256').update(normalized).digest('hex');
const token = hash.substring(0, 12);
```

Bulk import uses `upsert` pattern to avoid duplicates and associates with project via many-to-many relationship.

### Prisma Client Usage

**Import pattern**:
```typescript
import { prisma } from '../db.js';  // Note .js extension for ES modules
```

**Common query patterns**:
- Use `include` for eager loading relationships
- Use `select` with `_count` for efficient counting
- Use `orderBy` for TimeSection ordering: `{ order: 'asc' }`

## TypeScript Configuration

- **Target**: ES2022
- **Modules**: ESNext (bundler resolution for frontend, NodeNext for backend)
- **Strict mode**: Enabled
- **Backend**: Uses `.js` extensions in imports (ES modules requirement)
- **Frontend**: Path alias `@/*` maps to `src/*`

## Environment Variables

Backend requires `packages/backend/.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

**Never commit** `.env` files. Use `.env.example` as template.

## Testing Strategy (Not Yet Implemented)

No test suite currently exists. When implementing:
- Backend: Consider Vitest or Jest with Supertest for API routes
- Frontend: Vitest + Vue Test Utils for components
- Use in-memory SQLite for database tests

## Documentation

Comprehensive docs in `docs/`:
- `PROJECT_OVERVIEW.md` - High-level system overview
- `ARCHITECTURE.md` - Technical architecture details
- `DATABASE_SCHEMA.md` - Complete schema with examples
- `API_DOCUMENTATION.md` - All endpoints with request/response
- `SETUP_GUIDE.md` - Installation and configuration
- `AUTHENTICATION.md` - Dual auth system details

**Refer to these** before making architectural changes.
