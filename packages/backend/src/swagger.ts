import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Club Selection API',
      version: '1.0.0',
      description: 'API documentation for the Club Selection Management System. This API provides endpoints for managing projects, courses, students, and enrollments.',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'GitHub Repository',
        url: 'https://github.com/hacktick/clubselection',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'Admin authentication' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Courses', description: 'Course management' },
      { name: 'Time Sections', description: 'Time section management' },
      { name: 'Tags', description: 'Tag/category management' },
      { name: 'Students', description: 'Student management' },
      { name: 'Enrollment', description: 'Student enrollment' },
      { name: 'Settings', description: 'System settings' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns the API health status',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/projects': {
        get: {
          tags: ['Projects'],
          summary: 'List all projects',
          description: 'Retrieves all projects with submission counts',
          responses: {
            '200': {
              description: 'List of projects',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      projects: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Projects'],
          summary: 'Create a new project',
          description: 'Creates a new project with the specified details',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Fall 2024 Club Selection' },
                    description: { type: 'string', example: 'Choose your clubs for Fall semester' },
                    timezone: { type: 'string', example: 'Europe/Berlin' },
                    submissionStart: { type: 'string', format: 'date-time' },
                    submissionEnd: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Project created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      project: { $ref: '#/components/schemas/Project' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/admin/projects/{id}': {
        get: {
          tags: ['Projects'],
          summary: 'Get project details',
          description: 'Retrieves detailed project information including courses, tags, and students',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'Project details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      project: { $ref: '#/components/schemas/Project' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Project not found' },
          },
        },
        put: {
          tags: ['Projects'],
          summary: 'Update a project',
          description: 'Updates an existing project. Cannot update if enrollments exist.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    timezone: { type: 'string' },
                    submissionStart: { type: 'string', format: 'date-time' },
                    submissionEnd: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Project updated successfully' },
            '400': { description: 'Validation error or project has submissions' },
            '404': { description: 'Project not found' },
          },
        },
        delete: {
          tags: ['Projects'],
          summary: 'Delete a project',
          description: 'Deletes a project and all associated data (courses, enrollments, tags, time sections)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'Project deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Project not found' },
          },
        },
      },
      '/admin/projects/{id}/export': {
        get: {
          tags: ['Projects'],
          summary: 'Export project as YAML',
          description: 'Exports project configuration including courses, tags, and time sections as YAML file',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'YAML file download',
              content: {
                'application/x-yaml': {
                  schema: { type: 'string' },
                },
              },
            },
            '404': { description: 'Project not found' },
          },
        },
      },
      '/admin/projects/{id}/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses for a project',
          description: 'Retrieves all courses with their tags and occurrences',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of courses',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      courses: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Course' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Courses'],
          summary: 'Create a new course',
          description: 'Creates a new course with optional meeting times and tags',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Basketball' },
                    description: { type: 'string', example: 'Competitive basketball team' },
                    capacity: { type: 'integer', example: 20 },
                    tagIds: { type: 'array', items: { type: 'string' } },
                    occurrences: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
                          sectionId: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Course created successfully' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/admin/projects/{id}/sections': {
        get: {
          tags: ['Time Sections'],
          summary: 'List time sections for a project',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of time sections',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sections: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TimeSection' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Time Sections'],
          summary: 'Create a new time section',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['label', 'startTime', 'endTime', 'order'],
                  properties: {
                    label: { type: 'string', example: 'Period 1' },
                    startTime: { type: 'string', example: '09:00' },
                    endTime: { type: 'string', example: '10:00' },
                    order: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Time section created successfully' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/admin/projects/{id}/tags': {
        get: {
          tags: ['Tags'],
          summary: 'List tags for a project',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of tags',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tags: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Tag' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Tags'],
          summary: 'Create a new tag',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Sports' },
                    color: { type: 'string', example: '#FF5733' },
                    minRequired: { type: 'integer', example: 1 },
                    maxAllowed: { type: 'integer', example: 2, nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Tag created successfully' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/admin/projects/{id}/students': {
        get: {
          tags: ['Students'],
          summary: 'List students in a project',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of students',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      students: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Student' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Students'],
          summary: 'Bulk add students to a project',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Project ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['students'],
                  properties: {
                    students: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          identifier: { type: 'string', example: 'student@example.com' },
                          name: { type: 'string', example: 'John Doe' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Students added successfully' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/students/validate-token': {
        post: {
          tags: ['Students'],
          summary: 'Validate student token',
          description: 'Validates a student identifier and returns the hashed token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['identifier'],
                  properties: {
                    identifier: { type: 'string', example: 'student@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token validated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      student: { $ref: '#/components/schemas/Student' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Student not found' },
          },
        },
      },
      '/settings/site_title': {
        get: {
          tags: ['Settings'],
          summary: 'Get site title',
          description: 'Retrieves the current site title setting',
          responses: {
            '200': {
              description: 'Site title setting',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      setting: { $ref: '#/components/schemas/Setting' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/settings/site_title': {
        put: {
          tags: ['Settings'],
          summary: 'Update site title',
          description: 'Updates the site title setting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['value'],
                  properties: {
                    value: { type: 'string', example: 'My Club Selection' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Setting updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      setting: { $ref: '#/components/schemas/Setting' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            token: { type: 'string' },
            name: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            timezone: { type: 'string' },
            submissionStart: { type: 'string', format: 'date-time', nullable: true },
            submissionEnd: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            capacity: { type: 'integer', nullable: true },
            projectId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            tags: {
              type: 'array',
              items: { $ref: '#/components/schemas/Tag' },
            },
            occurrences: {
              type: 'array',
              items: { $ref: '#/components/schemas/CourseOccurrence' },
            },
          },
        },
        CourseOccurrence: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            courseId: { type: 'string' },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            sectionId: { type: 'string' },
            section: { $ref: '#/components/schemas/TimeSection' },
          },
        },
        TimeSection: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            projectId: { type: 'string' },
            label: { type: 'string' },
            startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            order: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            color: { type: 'string' },
            minRequired: { type: 'integer' },
            maxAllowed: { type: 'integer', nullable: true },
            projectId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            studentId: { type: 'string' },
            courseId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Setting: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
