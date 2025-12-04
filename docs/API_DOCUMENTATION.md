# API Documentation

**Repository**: [https://github.com/hacktick/clubselection](https://github.com/hacktick/clubselection)

## Base URL

```
http://localhost:3001/api
```

All API endpoints are prefixed with `/api`. The frontend development server (Vite) proxies these requests to the backend server.

## Response Format

All successful responses return JSON data. Error responses include an appropriate HTTP status code and error message.

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

## Authentication

### Admin Authentication
Admin endpoints require authentication (currently stored in localStorage, JWT implementation planned).

### Student Authentication
Students use token-based authentication with their unique identifier hash.

---

## Health Check Endpoints

### Get API Status
**GET** `/api`

Returns a welcome message confirming the API is running.

**Response**
```json
{
  "message": "Club Selection API"
}
```

### Health Check
**GET** `/api/health`

Returns server health status.

**Response**
```json
{
  "status": "ok"
}
```

---

## Authentication Endpoints

### Admin Login
**POST** `/api/login`

Authenticates an administrator with username and password.

**Request Body**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response**
```json
{
  "id": "clxxx...",
  "username": "admin",
  "name": "System Administrator"
}
```

**Validation**
- `username`: Required, non-empty string
- `password`: Required, minimum 6 characters

**Error Responses**
- `400`: Validation errors
- `401`: Invalid credentials
- `500`: Server error

---

## Student Endpoints

### Validate Student Token
**POST** `/api/students/validate-token`

Validates a student identifier and returns the hashed token.

**Request Body**
```json
{
  "identifier": "student@example.com"
}
```

**Response**
```json
{
  "valid": true,
  "student": {
    "id": "clxxx...",
    "token": "abc123def456",
    "name": "John Doe"
  }
}
```

**Validation**
- `identifier`: Required, non-empty string

**Error Responses**
- `400`: Validation errors
- `404`: Student not found
- `500`: Server error

### Get Student Projects
**GET** `/api/students/:identifier/projects`

Retrieves all projects a student is enrolled in.

**URL Parameters**
- `identifier`: Student's unique identifier (email, ID, etc.)

**Response**
```json
[
  {
    "id": "clxxx...",
    "name": "Fall 2024 Club Selection",
    "description": "Choose your clubs for Fall semester",
    "timezone": "America/New_York",
    "submissionStart": "2024-08-01T00:00:00Z",
    "submissionEnd": "2024-08-15T23:59:59Z",
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z"
  }
]
```

**Error Responses**
- `404`: Student not found
- `500`: Server error

---

## Enrollment Endpoints

### Get Enrollment Information
**GET** `/api/enroll?token={token}`

Retrieves enrollment information for a student including available courses.

**Query Parameters**
- `token`: Student's hashed token

**Response**
```json
{
  "student": {
    "id": "clxxx...",
    "token": "abc123def456",
    "name": "John Doe"
  },
  "projects": [
    {
      "id": "clxxx...",
      "name": "Fall 2024 Club Selection",
      "courses": [
        {
          "id": "clxxx...",
          "name": "Basketball",
          "description": "Competitive basketball team",
          "capacity": 20,
          "enrolled": 15
        }
      ]
    }
  ]
}
```

**Error Responses**
- `400`: Token parameter missing
- `404`: Student not found
- `500`: Server error

---

## Admin Project Endpoints

### List All Projects
**GET** `/api/admin/projects`

Retrieves all projects with submission counts.

**Response**
```json
[
  {
    "id": "clxxx...",
    "name": "Fall 2024 Club Selection",
    "description": "Choose your clubs for Fall semester",
    "timezone": "America/New_York",
    "submissionStart": "2024-08-01T00:00:00Z",
    "submissionEnd": "2024-08-15T23:59:59Z",
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z",
    "_count": {
      "students": 150,
      "courses": 25
    }
  }
]
```

### Create Project
**POST** `/api/admin/projects`

Creates a new project.

**Request Body**
```json
{
  "name": "Fall 2024 Club Selection",
  "description": "Choose your clubs for Fall semester",
  "timezone": "America/New_York",
  "submissionStart": "2024-08-01T00:00:00.000Z",
  "submissionEnd": "2024-08-15T23:59:59.999Z"
}
```

**Response**
```json
{
  "id": "clxxx...",
  "name": "Fall 2024 Club Selection",
  "description": "Choose your clubs for Fall semester",
  "timezone": "America/New_York",
  "submissionStart": "2024-08-01T00:00:00Z",
  "submissionEnd": "2024-08-15T23:59:59Z",
  "createdAt": "2024-07-01T10:00:00Z",
  "updatedAt": "2024-07-01T10:00:00Z"
}
```

**Validation**
- `name`: Required, 1-200 characters
- `description`: Optional string
- `timezone`: Optional, valid IANA timezone (default: UTC)
- `submissionStart`: Optional ISO 8601 datetime
- `submissionEnd`: Optional ISO 8601 datetime

### Get Project Details
**GET** `/api/admin/projects/:id`

Retrieves detailed project information including all related data.

**URL Parameters**
- `id`: Project ID

**Response**
```json
{
  "id": "clxxx...",
  "name": "Fall 2024 Club Selection",
  "description": "Choose your clubs for Fall semester",
  "timezone": "America/New_York",
  "submissionStart": "2024-08-01T00:00:00Z",
  "submissionEnd": "2024-08-15T23:59:59Z",
  "createdAt": "2024-07-01T10:00:00Z",
  "updatedAt": "2024-07-01T10:00:00Z",
  "courses": [...],
  "students": [...],
  "tags": [...],
  "timeSections": [...],
  "_count": {
    "courses": 25,
    "students": 150
  }
}
```

**Error Responses**
- `404`: Project not found
- `500`: Server error

### Update Project
**PUT** `/api/admin/projects/:id`

Updates an existing project. Only allowed if no submissions exist.

**URL Parameters**
- `id`: Project ID

**Request Body**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "timezone": "America/Los_Angeles",
  "submissionStart": "2024-08-01T00:00:00.000Z",
  "submissionEnd": "2024-08-31T23:59:59.999Z"
}
```

**Response**
```json
{
  "id": "clxxx...",
  "name": "Updated Project Name",
  ...
}
```

**Validation**
- Same as Create Project
- Cannot update if enrollments exist (returns 400 error)

**Error Responses**
- `400`: Validation errors or project has submissions
- `404`: Project not found
- `500`: Server error

### Delete Project Submissions
**DELETE** `/api/admin/projects/:id/submissions`

Deletes all enrollments for a project, effectively resetting it.

**URL Parameters**
- `id`: Project ID

**Response**
```json
{
  "message": "All submissions deleted",
  "count": 45
}
```

**Error Responses**
- `404`: Project not found
- `500`: Server error

### Delete Project
**DELETE** `/api/admin/projects/:id`

Deletes a project and all associated data (courses, enrollments, tags, time sections, submissions).

**URL Parameters**
- `id`: Project ID

**Response**
```json
{
  "success": true,
  "message": "Project and all related data deleted successfully"
}
```

**Cascade Deletion Order**:
1. Enrollments (for courses in this project)
2. Submissions
3. Course occurrences
4. Courses
5. Tags
6. Time sections
7. Student associations (disconnects, doesn't delete students)
8. Project

**Error Responses**
- `404`: Project not found
- `500`: Server error

### Export Project
**GET** `/api/admin/projects/:id/export`

Exports project configuration as YAML file.

**URL Parameters**
- `id`: Project ID

**Response**
- Content-Type: `application/x-yaml`
- Content-Disposition: `attachment; filename="project-name-export.yml"`

**YAML Structure**:
```yaml
name: "Project Name"
description: "Project description"
timezone: "Europe/Berlin"
submissionStart: "2024-01-01T00:00:00.000Z"
submissionEnd: "2024-01-31T23:59:59.999Z"
timeSections:
  - label: "Period 1"
    startTime: "08:00"
    endTime: "09:00"
    order: 1
tags:
  - name: "Sports"
    color: "#FF5733"
    minRequired: 1
    maxAllowed: 2
courses:
  - name: "Basketball"
    description: "Team sport"
    capacity: 20
    tags: ["Sports"]
    occurrences:
      - dayOfWeek: 1
        section: "Period 1"
```

---

## Settings Endpoints

### Get Site Title
**GET** `/api/settings/site_title`

Retrieves the current site title setting.

**Response**
```json
{
  "setting": {
    "key": "site_title",
    "value": "Club Selection"
  }
}
```

### Update Site Title
**PUT** `/api/admin/settings/site_title`

Updates the site title.

**Request Body**
```json
{
  "value": "My School Club Selection"
}
```

**Response**
```json
{
  "setting": {
    "key": "site_title",
    "value": "My School Club Selection"
  }
}
```

---

## Course Endpoints

### List Courses
**GET** `/api/admin/projects/:id/courses`

Retrieves all courses for a project.

**URL Parameters**
- `id`: Project ID

**Response**
```json
[
  {
    "id": "clxxx...",
    "name": "Basketball",
    "description": "Competitive basketball team",
    "capacity": 20,
    "projectId": "clxxx...",
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z",
    "tags": [
      {
        "id": "clxxx...",
        "name": "Sports",
        "color": "#FF5733"
      }
    ],
    "occurrences": [
      {
        "id": "clxxx...",
        "dayOfWeek": 1,
        "sectionId": "clxxx...",
        "section": {
          "label": "Period 1",
          "startTime": "09:00",
          "endTime": "10:00"
        }
      }
    ],
    "_count": {
      "enrollments": 15
    }
  }
]
```

### Create Course
**POST** `/api/admin/projects/:id/courses`

Creates a new course with optional meeting times.

**URL Parameters**
- `id`: Project ID

**Request Body**
```json
{
  "name": "Basketball",
  "description": "Competitive basketball team",
  "capacity": 20,
  "tagIds": ["clxxx1...", "clxxx2..."],
  "occurrences": [
    {
      "dayOfWeek": 1,
      "sectionId": "clxxx..."
    },
    {
      "dayOfWeek": 3,
      "sectionId": "clxxx..."
    }
  ]
}
```

**Validation**
- `name`: Required, 1-200 characters
- `description`: Optional string
- `capacity`: Optional positive integer
- `tagIds`: Optional array of tag IDs
- `occurrences`: Optional array of meeting times
  - `dayOfWeek`: Required, 0-6 (0=Monday, 6=Sunday)
  - `sectionId`: Required, valid time section ID

**Response**
```json
{
  "id": "clxxx...",
  "name": "Basketball",
  "description": "Competitive basketball team",
  "capacity": 20,
  "projectId": "clxxx...",
  "createdAt": "2024-07-01T10:00:00Z",
  "updatedAt": "2024-07-01T10:00:00Z",
  "tags": [...],
  "occurrences": [...]
}
```

### Update Course
**PUT** `/api/admin/projects/:id/courses/:courseId`

Updates an existing course and its meeting times.

**URL Parameters**
- `id`: Project ID
- `courseId`: Course ID

**Request Body**
```json
{
  "name": "Advanced Basketball",
  "description": "Updated description",
  "capacity": 25,
  "tagIds": ["clxxx1..."],
  "occurrences": [
    {
      "dayOfWeek": 2,
      "sectionId": "clxxx..."
    }
  ]
}
```

**Response**
```json
{
  "id": "clxxx...",
  "name": "Advanced Basketball",
  ...
}
```

**Notes**
- Updates occurrences by deleting existing and creating new ones
- All fields are optional (only provided fields are updated)

**Error Responses**
- `404`: Project or course not found
- `500`: Server error

### Delete Course
**DELETE** `/api/admin/projects/:id/courses/:courseId`

Deletes a course and all related data (enrollments, occurrences).

**URL Parameters**
- `id`: Project ID
- `courseId`: Course ID

**Response**
```json
{
  "message": "Course deleted successfully"
}
```

**Error Responses**
- `404`: Project or course not found
- `500`: Server error

---

## Time Section Endpoints

### List Time Sections
**GET** `/api/admin/projects/:id/sections`

Retrieves all time sections for a project, ordered by the `order` field.

**URL Parameters**
- `id`: Project ID

**Response**
```json
[
  {
    "id": "clxxx...",
    "projectId": "clxxx...",
    "label": "Period 1",
    "startTime": "09:00",
    "endTime": "10:00",
    "order": 1,
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z"
  }
]
```

### Create Time Section
**POST** `/api/admin/projects/:id/sections`

Creates a new time section.

**URL Parameters**
- `id`: Project ID

**Request Body**
```json
{
  "label": "Period 1",
  "startTime": "09:00",
  "endTime": "10:00",
  "order": 1
}
```

**Validation**
- `label`: Required, non-empty string
- `startTime`: Required, HH:mm format (24-hour)
- `endTime`: Required, HH:mm format (24-hour)
- `order`: Required, integer

**Response**
```json
{
  "id": "clxxx...",
  "projectId": "clxxx...",
  "label": "Period 1",
  "startTime": "09:00",
  "endTime": "10:00",
  "order": 1,
  "createdAt": "2024-07-01T10:00:00Z",
  "updatedAt": "2024-07-01T10:00:00Z"
}
```

### Update Time Section
**PUT** `/api/admin/projects/:id/sections/:sectionId`

Updates an existing time section.

**URL Parameters**
- `id`: Project ID
- `sectionId`: Time section ID

**Request Body**
```json
{
  "label": "Period 1A",
  "startTime": "09:15",
  "endTime": "10:15",
  "order": 2
}
```

**Response**
```json
{
  "id": "clxxx...",
  "label": "Period 1A",
  ...
}
```

### Delete Time Section
**DELETE** `/api/admin/projects/:id/sections/:sectionId`

Deletes a time section. Only allowed if no course occurrences reference it.

**URL Parameters**
- `id`: Project ID
- `sectionId`: Time section ID

**Response**
```json
{
  "message": "Time section deleted successfully"
}
```

**Error Responses**
- `400`: Time section is in use by course occurrences
- `404`: Project or section not found
- `500`: Server error

---

## Tag Endpoints

### List Tags
**GET** `/api/admin/projects/:id/tags`

Retrieves all tags for a project.

**URL Parameters**
- `id`: Project ID

**Response**
```json
[
  {
    "id": "clxxx...",
    "name": "Sports",
    "color": "#FF5733",
    "minRequired": 1,
    "maxAllowed": 2,
    "projectId": "clxxx...",
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z",
    "_count": {
      "courses": 5
    }
  }
]
```

### Create Tag
**POST** `/api/admin/projects/:id/tags`

Creates a new tag with optional enrollment constraints.

**URL Parameters**
- `id`: Project ID

**Request Body**
```json
{
  "name": "Sports",
  "color": "#FF5733",
  "minRequired": 1,
  "maxAllowed": 2
}
```

**Validation**
- `name`: Required, non-empty string
- `color`: Optional, hex color (default: #667eea)
- `minRequired`: Optional, non-negative integer (default: 0)
- `maxAllowed`: Optional, positive integer or null (null = unlimited)

**Response**
```json
{
  "id": "clxxx...",
  "name": "Sports",
  "color": "#FF5733",
  "minRequired": 1,
  "maxAllowed": 2,
  "projectId": "clxxx...",
  "createdAt": "2024-07-01T10:00:00Z",
  "updatedAt": "2024-07-01T10:00:00Z"
}
```

### Update Tag
**PUT** `/api/admin/projects/:id/tags/:tagId`

Updates an existing tag.

**URL Parameters**
- `id`: Project ID
- `tagId`: Tag ID

**Request Body**
```json
{
  "name": "Athletics",
  "color": "#00FF00",
  "minRequired": 2,
  "maxAllowed": 3
}
```

**Response**
```json
{
  "id": "clxxx...",
  "name": "Athletics",
  ...
}
```

### Delete Tag
**DELETE** `/api/admin/projects/:id/tags/:tagId`

Deletes a tag and removes it from all associated courses.

**URL Parameters**
- `id`: Project ID
- `tagId`: Tag ID

**Response**
```json
{
  "message": "Tag deleted successfully"
}
```

**Error Responses**
- `404`: Project or tag not found
- `500`: Server error

---

## Student Management Endpoints

### List Project Students
**GET** `/api/admin/projects/:id/students`

Retrieves all students enrolled in a project.

**URL Parameters**
- `id`: Project ID

**Response**
```json
[
  {
    "id": "clxxx...",
    "token": "abc123def456",
    "name": "John Doe",
    "createdAt": "2024-07-01T10:00:00Z",
    "updatedAt": "2024-07-01T10:00:00Z"
  }
]
```

### Get Student Count
**GET** `/api/admin/projects/:id/students/count`

Retrieves the total number of students in a project.

**URL Parameters**
- `id`: Project ID

**Response**
```json
{
  "count": 150
}
```

### Bulk Add Students
**POST** `/api/admin/projects/:id/students`

Adds multiple students to a project. Creates students if they don't exist.

**URL Parameters**
- `id`: Project ID

**Request Body**
```json
{
  "students": [
    {
      "identifier": "student1@example.com",
      "name": "John Doe"
    },
    {
      "identifier": "student2@example.com",
      "name": "Jane Smith"
    }
  ]
}
```

**Validation**
- `students`: Required, non-empty array
- `identifier`: Required, non-empty string (will be hashed to create token)
- `name`: Optional string

**Response**
```json
{
  "created": 2,
  "students": [
    {
      "id": "clxxx...",
      "token": "abc123def456",
      "name": "John Doe",
      "createdAt": "2024-07-01T10:00:00Z",
      "updatedAt": "2024-07-01T10:00:00Z"
    }
  ]
}
```

**Notes**
- Automatically generates SHA-256 hash from identifier (lowercase, trimmed, first 12 chars)
- Skips students that already exist (no duplicates)
- Associates students with the project

### Remove All Students
**DELETE** `/api/admin/projects/:id/students`

Removes all student associations from a project (does not delete student records).

**URL Parameters**
- `id`: Project ID

**Response**
```json
{
  "message": "All students removed from project",
  "count": 150
}
```

**Error Responses**
- `404`: Project not found
- `500`: Server error

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation errors or business logic violations |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Unexpected server error |

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production deployment.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

## Future Endpoints (Planned)

- `POST /api/enroll/:projectId/courses/:courseId` - Submit course enrollment
- `DELETE /api/enroll/:enrollmentId` - Cancel enrollment
- `GET /api/admin/projects/:id/conflicts` - Check scheduling conflicts
- `POST /api/admin/projects/:id/export` - Export enrollment data
- `GET /api/admin/analytics/:projectId` - Get enrollment analytics
