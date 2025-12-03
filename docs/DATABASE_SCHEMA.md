# Database Schema Documentation

## Overview

The Club Selection system uses **SQLite** as the database with **Prisma ORM** for data modeling and migrations.

**Database Location**: `packages/backend/prisma/dev.db`
**Schema Definition**: `packages/backend/prisma/schema.prisma`

## Database Design Principles

- **Normalized schema** with proper relationships
- **UUID-based primary keys** (cuid format)
- **Cascading deletes** for dependent data
- **Unique constraints** to prevent duplicates
- **Timestamp tracking** for all records (createdAt, updatedAt)
- **UTC storage** with timezone support at the project level

## Entity Relationship Diagram

```
┌─────────────┐
│    Admin    │
└─────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Student   │──────<│  Enrollment  │>──────│   Course    │
└──────┬──────┘       └──────────────┘       └──────┬──────┘
       │                                             │
       │              ┌──────────────┐              │
       └─────────────<│   Project    │>─────────────┘
                      └──────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌───▼────┐    ┌────▼─────┐
         │   Tag   │    │TimeSection│  │ Course   │
         └─────────┘    └──────┬────┘  └──────────┘
                               │
                        ┌──────▼──────────┐
                        │CourseOccurrence │
                        └─────────────────┘

         ┌──────────────┐
         │EnrollmentRule│
         └──────────────┘
```

## Models

### Admin

Represents system administrators with full access.

**Table**: `Admin`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| username | String | UNIQUE, NOT NULL | Login username |
| password | String | NOT NULL | Bcrypt hashed password |
| name | String | NOT NULL | Display name |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes**:
- `username` (unique)

**Password Hashing**:
- Uses bcrypt with 10 salt rounds
- Hashed in `packages/backend/prisma/seed.ts`

**Default Credentials**:
- Username: `admin`
- Password: `admin` (hashed)

---

### Student

Represents participants who can enroll in courses.

**Table**: `Student`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| token | String | UNIQUE, NOT NULL | SHA-256 hash of identifier (first 12 chars) |
| name | String? | NULLABLE | Student's display name |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `enrollments` → `Enrollment[]` - Course enrollments
- `projects` → `Project[]` - Projects student is enrolled in

**Indexes**:
- `token` (unique)

**Token Generation**:
```javascript
// Pseudo-code from packages/backend/src/routes/students.ts
const normalizedIdentifier = identifier.toLowerCase().trim();
const hash = crypto.createHash('sha256').update(normalizedIdentifier).digest('hex');
const token = hash.substring(0, 12);
```

**Notes**:
- Token-based authentication (no password required)
- One-way hash ensures privacy
- Token is generated from email, student ID, or other unique identifier

---

### Project

The main organizational container for a selection period.

**Table**: `Project`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| name | String | NOT NULL | Project name |
| description | String? | NULLABLE | Project description |
| timezone | String | @default("UTC") | IANA timezone (e.g., "America/New_York") |
| submissionStart | DateTime? | NULLABLE | When students can start submitting |
| submissionEnd | DateTime? | NULLABLE | Submission deadline |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `courses` → `Course[]` - Available courses
- `tags` → `Tag[]` - Course categorization tags
- `students` → `Student[]` - Enrolled students (many-to-many)
- `timeSections` → `TimeSection[]` - Available time slots

**Business Rules**:
- Cannot update project if enrollments exist
- Submission window is optional
- All timestamps stored in UTC, displayed in project's timezone

**Example**:
```json
{
  "id": "clxxx...",
  "name": "Fall 2024 Club Selection",
  "description": "Choose your clubs for Fall semester",
  "timezone": "America/New_York",
  "submissionStart": "2024-08-01T00:00:00.000Z",
  "submissionEnd": "2024-08-15T23:59:59.999Z"
}
```

---

### Course

Individual club, class, or activity offering.

**Table**: `Course`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| name | String | NOT NULL | Course name |
| description | String? | NULLABLE | Course description |
| capacity | Int? | NULLABLE | Maximum enrollments (null = unlimited) |
| projectId | String | FOREIGN KEY | Parent project |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `project` → `Project` - Parent project
- `enrollments` → `Enrollment[]` - Student enrollments
- `rules` → `EnrollmentRule[]` - Enrollment constraints
- `occurrences` → `CourseOccurrence[]` - Meeting times
- `tags` → `Tag[]` - Category tags (many-to-many)

**Cascade Behavior**:
- Deleting a course deletes all enrollments and occurrences

**Example**:
```json
{
  "id": "clxxx...",
  "name": "Basketball",
  "description": "Competitive basketball team",
  "capacity": 20,
  "projectId": "clxxx...",
  "tags": [
    {"id": "tag1", "name": "Sports"}
  ],
  "occurrences": [
    {"dayOfWeek": 1, "sectionId": "section1"}
  ]
}
```

---

### CourseOccurrence

Defines when a course meets (day and time).

**Table**: `CourseOccurrence`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| courseId | String | FOREIGN KEY | Parent course |
| dayOfWeek | Int | NOT NULL | 0=Monday, 1=Tuesday, ..., 6=Sunday |
| sectionId | String | FOREIGN KEY | Time section reference |
| createdAt | DateTime | @default(now()) | Record creation timestamp |

**Relationships**:
- `course` → `Course` - Parent course
- `section` → `TimeSection` - Time slot

**Cascade Behavior**:
- Deleted when parent course is deleted

**Day of Week Mapping**:
```
0 = Monday
1 = Tuesday
2 = Wednesday
3 = Thursday
4 = Friday
5 = Saturday
6 = Sunday
```

**Example**:
A course that meets on Monday and Wednesday during Period 1:
```json
[
  {
    "courseId": "course1",
    "dayOfWeek": 0,
    "sectionId": "section1"
  },
  {
    "courseId": "course1",
    "dayOfWeek": 2,
    "sectionId": "section1"
  }
]
```

---

### TimeSection

Configurable time slots for scheduling courses.

**Table**: `TimeSection`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| projectId | String | FOREIGN KEY | Parent project |
| label | String | NOT NULL | Display name (e.g., "Period 1") |
| startTime | String | NOT NULL | HH:mm format (e.g., "09:00") |
| endTime | String | NOT NULL | HH:mm format (e.g., "10:00") |
| order | Int | NOT NULL | Display order (for sorting) |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `project` → `Project` - Parent project
- `occurrences` → `CourseOccurrence[]` - Courses using this time

**Business Rules**:
- Cannot delete if referenced by any course occurrence
- Times stored as strings in 24-hour format
- Order determines display sequence

**Example**:
```json
{
  "id": "clxxx...",
  "projectId": "project1",
  "label": "Period 1",
  "startTime": "09:00",
  "endTime": "10:00",
  "order": 1
}
```

**Common Usage**:
```json
[
  {"label": "Period 1", "startTime": "08:00", "endTime": "09:00", "order": 1},
  {"label": "Period 2", "startTime": "09:15", "endTime": "10:15", "order": 2},
  {"label": "Period 3", "startTime": "10:30", "endTime": "11:30", "order": 3},
  {"label": "Lunch", "startTime": "11:30", "endTime": "12:15", "order": 4},
  {"label": "Period 4", "startTime": "12:15", "endTime": "13:15", "order": 5}
]
```

---

### Tag

Categories for courses with optional enrollment constraints.

**Table**: `Tag`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| name | String | NOT NULL | Tag name |
| color | String | @default("#667eea") | Hex color code |
| minRequired | Int | @default(0) | Minimum courses student must select |
| maxAllowed | Int? | NULLABLE | Maximum courses allowed (null = unlimited) |
| projectId | String | FOREIGN KEY | Parent project |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `project` → `Project` - Parent project
- `courses` → `Course[]` - Tagged courses (many-to-many)

**Business Rules**:
- `minRequired` must be ≥ 0
- `maxAllowed` must be > 0 or null
- If `maxAllowed` is null, unlimited selections allowed

**Example Use Cases**:

**Sports Tag** (require 1-2 sports):
```json
{
  "name": "Sports",
  "color": "#FF5733",
  "minRequired": 1,
  "maxAllowed": 2
}
```

**Arts Tag** (optional, unlimited):
```json
{
  "name": "Arts",
  "color": "#9C27B0",
  "minRequired": 0,
  "maxAllowed": null
}
```

**Core Tag** (require exactly 3):
```json
{
  "name": "Core Subjects",
  "color": "#2196F3",
  "minRequired": 3,
  "maxAllowed": 3
}
```

---

### Enrollment

Student course selections with status tracking.

**Table**: `Enrollment`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| studentId | String | FOREIGN KEY | Student reference |
| courseId | String | FOREIGN KEY | Course reference |
| status | String | @default("PENDING") | PENDING, CONFIRMED, or CANCELLED |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `student` → `Student` - Enrolled student
- `course` → `Course` - Selected course

**Indexes**:
- `[studentId, courseId]` (unique composite) - Prevents duplicate enrollments

**Cascade Behavior**:
- Deleted when parent course is deleted
- Deleted when parent student is deleted

**Status Values**:
- `PENDING`: Initial selection, awaiting confirmation
- `CONFIRMED`: Approved enrollment
- `CANCELLED`: Withdrawn or rejected enrollment

**Business Rules**:
- Student cannot enroll in the same course twice
- Enrollment counts toward course capacity

**Example**:
```json
{
  "id": "clxxx...",
  "studentId": "student1",
  "courseId": "course1",
  "status": "PENDING",
  "createdAt": "2024-08-01T10:00:00.000Z"
}
```

---

### EnrollmentRule

Constraints and requirements for course enrollment.

**Table**: `EnrollmentRule`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PRIMARY KEY, @default(cuid()) | Unique identifier |
| courseId | String | FOREIGN KEY | Parent course |
| ruleType | String | NOT NULL | TIME_CONSTRAINT, CAPACITY_LIMIT, or PREREQUISITE |
| startTime | DateTime? | NULLABLE | Rule effective start time |
| endTime | DateTime? | NULLABLE | Rule effective end time |
| maxEnrollments | Int? | NULLABLE | Maximum allowed enrollments |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- `course` → `Course` - Parent course

**Rule Types**:

**TIME_CONSTRAINT**: Enrollment window
```json
{
  "ruleType": "TIME_CONSTRAINT",
  "startTime": "2024-08-01T00:00:00.000Z",
  "endTime": "2024-08-15T23:59:59.999Z"
}
```

**CAPACITY_LIMIT**: Maximum enrollments
```json
{
  "ruleType": "CAPACITY_LIMIT",
  "maxEnrollments": 25
}
```

**PREREQUISITE**: Course requirements (implementation pending)
```json
{
  "ruleType": "PREREQUISITE"
}
```

**Notes**:
- Currently defined but not fully implemented in the application logic
- Planned for future enforcement in enrollment workflow

---

## Database Migrations

**Migration System**: Prisma Migrate

**Commands**:
```bash
# Create a new migration
npm run migrate -- --name migration_name

# Apply migrations
npm run migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

**Migration Files**: `packages/backend/prisma/migrations/`

---

## Database Seeding

**Seed Script**: `packages/backend/prisma/seed.ts`

**What it seeds**:
- Default admin user (username: `admin`, password: `admin`)

**Run seed**:
```bash
cd packages/backend
npm run seed
```

**Seed Logic**:
```typescript
// Creates admin with hashed password
const hashedPassword = await bcrypt.hash('admin', 10);
await prisma.admin.upsert({
  where: { username: 'admin' },
  update: {},
  create: {
    username: 'admin',
    password: hashedPassword,
    name: 'System Administrator'
  }
});
```

---

## Prisma Schema File

**Location**: `packages/backend/prisma/schema.prisma`

**Key Configuration**:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Environment Variable**:
```bash
DATABASE_URL="file:./dev.db"
```

---

## Query Examples

### Get project with all related data
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    courses: {
      include: {
        tags: true,
        occurrences: {
          include: {
            section: true
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    },
    students: true,
    tags: true,
    timeSections: {
      orderBy: { order: 'asc' }
    },
    _count: {
      select: {
        courses: true,
        students: true
      }
    }
  }
});
```

### Get student enrollments with course details
```typescript
const enrollments = await prisma.enrollment.findMany({
  where: { studentId: studentId },
  include: {
    course: {
      include: {
        project: true,
        tags: true,
        occurrences: {
          include: {
            section: true
          }
        }
      }
    }
  }
});
```

### Create course with occurrences
```typescript
const course = await prisma.course.create({
  data: {
    name: "Basketball",
    description: "Competitive basketball team",
    capacity: 20,
    projectId: projectId,
    tags: {
      connect: tagIds.map(id => ({ id }))
    },
    occurrences: {
      create: [
        { dayOfWeek: 1, sectionId: "section1" },
        { dayOfWeek: 3, sectionId: "section1" }
      ]
    }
  },
  include: {
    tags: true,
    occurrences: {
      include: {
        section: true
      }
    }
  }
});
```

---

## Database Management Tools

### Prisma Studio
Visual database browser for development.

**Launch**:
```bash
cd packages/backend
npm run studio
```

**Access**: http://localhost:5555

**Features**:
- Browse all tables
- Edit records directly
- View relationships
- Execute custom queries

### SQLite CLI
Direct database access for advanced queries.

**Access**:
```bash
sqlite3 packages/backend/prisma/dev.db
```

**Useful commands**:
```sql
-- List all tables
.tables

-- Show table schema
.schema Student

-- Query data
SELECT * FROM Project;

-- Exit
.quit
```

---

## Performance Considerations

### Indexes
- Unique indexes on `Admin.username`, `Student.token`
- Composite unique index on `Enrollment(studentId, courseId)`
- Foreign key indexes automatically created by Prisma

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` strategically to avoid N+1 queries
- Consider pagination for large result sets
- Use `_count` for efficient counting

### Example: Efficient pagination
```typescript
const courses = await prisma.course.findMany({
  where: { projectId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
});
```

---

## Backup and Restore

### Backup (SQLite)
```bash
# Copy database file
cp packages/backend/prisma/dev.db packages/backend/prisma/backup.db

# Or use SQLite backup command
sqlite3 packages/backend/prisma/dev.db ".backup packages/backend/prisma/backup.db"
```

### Restore
```bash
# Replace current database with backup
cp packages/backend/prisma/backup.db packages/backend/prisma/dev.db
```

### Export to SQL
```bash
sqlite3 packages/backend/prisma/dev.db .dump > backup.sql
```

### Import from SQL
```bash
sqlite3 packages/backend/prisma/dev.db < backup.sql
```

---

## Production Considerations

For production deployment, consider:

1. **Database Migration**: SQLite → PostgreSQL or MySQL
2. **Connection Pooling**: Use Prisma connection pooling
3. **Backup Strategy**: Automated daily backups
4. **Data Validation**: Add database-level constraints
5. **Audit Logging**: Track who changed what and when
6. **Soft Deletes**: Consider soft deletes instead of hard deletes
7. **Performance Monitoring**: Monitor slow queries

**PostgreSQL Migration Example**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/clubselection?schema=public"
```

Run migrations:
```bash
npx prisma migrate dev
```
