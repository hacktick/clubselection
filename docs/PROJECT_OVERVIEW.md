# Project Overview

## Club Selection Management System

A comprehensive course/club selection and enrollment management system built with modern TypeScript and designed for educational institutions to manage student course selections and enrollments.

## Purpose

This system enables educational institutions to:
- Manage multiple selection projects (e.g., club selection, elective courses, workshop signups)
- Allow students to browse and enroll in courses/clubs
- Configure scheduling constraints and capacity limits
- Track enrollments and manage submission windows
- Provide both administrative control and student self-service

## Key Concepts

### Projects
The main organizational unit. Each project represents a distinct selection period (e.g., "Fall 2024 Club Selection" or "Spring Electives"). Projects have:
- Name and description
- Timezone settings
- Submission windows (start/end dates)
- Associated courses, students, time sections, and tags

### Courses
Individual club or class offerings within a project. Each course has:
- Name and description
- Capacity limits
- Multiple meeting times (occurrences)
- Tags for categorization
- Enrollment tracking

### Students
Participants who can enroll in courses. Students:
- Use token-based authentication (no passwords)
- Can be enrolled in multiple projects
- Submit course selections during open submission windows

### Time Sections
Configurable time slots that define when courses meet (e.g., "Period 1: 9:00-10:00 AM"). These are project-specific and used for scheduling courses.

### Tags
Categories for courses with optional enrollment constraints:
- Visual organization (color-coded)
- Minimum required enrollments per tag
- Maximum allowed enrollments per tag
- Example: "Sports" tag requiring students to select 1-2 sports courses

### Enrollments
Student course selections with status tracking:
- PENDING: Initial selection
- CONFIRMED: Approved enrollment
- CANCELLED: Withdrawn enrollment

## User Roles

### Administrators
Full system access with capabilities to:
- Create and manage projects
- Configure courses, time sections, and tags
- Add students to projects
- View all enrollments and submissions
- Modify submission windows
- Reset project data

### Students
Limited access for enrollment purposes:
- View projects they're enrolled in
- Browse available courses
- Submit course selections
- Check enrollment status

## Workflow

### Admin Setup Workflow
1. Create a new project with timezone and submission dates
2. Define time sections (e.g., periods, blocks)
3. Create tags with enrollment rules (optional)
4. Add courses with meeting times and capacity
5. Bulk import students with identifiers
6. Open submission window

### Student Enrollment Workflow
1. Access system using unique token/identifier
2. Select project to participate in
3. Browse available courses filtered by tags/time
4. Submit course selections
5. Receive confirmation of enrollment status

## Technology Foundation

Built as a modern TypeScript monorepo:
- **Backend**: Node.js REST API with Express and Prisma ORM
- **Frontend**: Vue 3 single-page application with Vite
- **Database**: SQLite with comprehensive relational schema
- **Development**: Hot-reload development environment for both frontend and backend

## Project Status

### ✅ Implemented Features
- Complete admin CRUD operations for all entities
- Dual authentication system (admin/student)
- Project management with timezone support
- Course scheduling with multiple occurrences
- Time section configuration
- Tag-based categorization with constraints
- Bulk student import
- Enrollment tracking
- Submission window management

### 🚧 Planned Enhancements
- Authentication guards and route protection
- JWT token implementation for sessions
- QR code generation for student tokens
- Complete enrollment workflow with status transitions
- Email notifications
- Conflict detection (time/capacity)
- Enrollment approval workflow
- Reporting and analytics
- Data export functionality

## Repository Structure

```
clubselection/
├── packages/
│   ├── backend/              # API server
│   └── frontend/             # Vue application
├── docs/                     # Documentation
├── package.json              # Workspace configuration
└── README.md                # Quick start guide
```

## Documentation Index

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Installation and configuration instructions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and tech stack
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Complete database schema documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - REST API endpoint reference
- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Authentication system details

## License

[License information to be added]

## Contributing

[Contributing guidelines to be added]

## Support

For issues, questions, or contributions, please refer to the project repository.
