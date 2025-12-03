# Architecture Documentation

## System Architecture

The Club Selection system is built as a **full-stack TypeScript monorepo** with clear separation between frontend and backend.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Vue 3 SPA (Port 5173)                    │  │
│  │  - Vue Router (Hash Mode)                         │  │
│  │  - Pinia State Management                         │  │
│  │  - TypeScript Components                          │  │
│  └────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────┘
                          │ HTTP/JSON
                          │ /api/* → proxy
┌─────────────────────────▼──────────────────────────────┐
│              Express API Server (Port 3001)             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes                                         │   │
│  │  - /api/login (auth)                            │   │
│  │  - /api/admin/* (admin operations)              │   │
│  │  - /api/students/* (student operations)         │   │
│  │  - /api/enroll (enrollment)                     │   │
│  └───────────────────┬─────────────────────────────┘   │
│                      │                                   │
│  ┌───────────────────▼─────────────────────────────┐   │
│  │         Prisma ORM Client                       │   │
│  └───────────────────┬─────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│              SQLite Database (dev.db)                   │
│  - Admins, Students, Projects, Courses                  │
│  - Enrollments, Tags, TimeSections, etc.                │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend Stack

#### Runtime & Framework
- **Node.js** 18+ (ES Modules)
- **Express.js** 4.18 - Fast, minimalist web framework
- **TypeScript** 5.3 - Type-safe development

#### Database & ORM
- **SQLite** - Embedded relational database (development)
- **Prisma ORM** 5.7 - Type-safe database client with migrations
  - Schema definition in `schema.prisma`
  - Auto-generated TypeScript client
  - Migration management

#### Authentication & Security
- **bcrypt** 6.0 - Password hashing (10 salt rounds)
- **crypto** (Node.js built-in) - SHA-256 for student tokens
- **cors** 2.8 - Cross-Origin Resource Sharing
- **express-validator** 7.3 - Request validation

#### Development Tools
- **tsx** 4.7 - TypeScript execution and watch mode
- **dotenv** 16.3 - Environment variable management
- **Prisma Studio** - Visual database browser

#### Package Structure
```json
{
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "migrate": "prisma migrate dev",
    "seed": "tsx prisma/seed.ts",
    "studio": "prisma studio"
  }
}
```

---

### Frontend Stack

#### Framework & Build
- **Vue 3** 3.3.11 - Progressive JavaScript framework
  - Composition API with `<script setup>`
  - Reactivity system (ref, reactive, computed)
  - Single File Components (SFC)
- **Vite** 4.5 - Lightning-fast build tool and dev server
  - Hot Module Replacement (HMR)
  - Optimized builds with code splitting
  - TypeScript support

#### Routing & State
- **Vue Router** 4.2 - Official routing library
  - Hash-based history mode
  - Dynamic route matching
  - Navigation guards (planned)
- **Pinia** 2.1 - Official state management
  - Type-safe stores
  - DevTools integration
  - Plugin support

#### Language & Typing
- **TypeScript** 5.3 - Strict type checking
  - Interfaces for API responses
  - Type-safe component props
  - Auto-completion in IDE

#### Development Tools
- **vue-tsc** 1.8 - Vue TypeScript type checker
- **@vitejs/plugin-vue** 4.4 - Vite plugin for Vue SFC

#### Package Structure
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## Project Structure

### Monorepo Layout

```
clubselection/
├── package.json                    # Root workspace config
├── tsconfig.json                   # Shared TypeScript config
├── README.md                       # Quick start guide
├── .gitignore                      # Git ignore patterns
│
├── docs/                           # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── SETUP_GUIDE.md
│   └── AUTHENTICATION.md
│
└── packages/                       # Workspace packages
    │
    ├── backend/                    # Node.js API server
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .env.example
    │   ├── .env
    │   │
    │   ├── prisma/
    │   │   ├── schema.prisma       # Database schema
    │   │   ├── seed.ts             # Seed script
    │   │   ├── dev.db              # SQLite database
    │   │   └── migrations/         # Migration history
    │   │
    │   └── src/
    │       ├── index.ts            # Server entry point
    │       ├── db.ts               # Prisma client export
    │       └── routes/             # API route handlers
    │           ├── auth.ts
    │           ├── admin.ts
    │           ├── projects.ts
    │           ├── courses.ts
    │           ├── sections.ts
    │           ├── students.ts
    │           └── enroll.ts
    │
    └── frontend/                   # Vue 3 SPA
        ├── package.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── vite.config.ts
        ├── index.html              # HTML entry point
        │
        └── src/
            ├── main.ts             # App entry point
            ├── App.vue             # Root component
            │
            ├── router/
            │   └── index.ts        # Route definitions
            │
            ├── stores/
            │   └── auth.ts         # Auth state (Pinia)
            │
            ├── views/              # Page components
            │   ├── Home.vue
            │   ├── Login.vue
            │   ├── AdminDashboard.vue
            │   ├── ProjectDetail.vue
            │   ├── ProjectForm.vue
            │   ├── Enroll.vue
            │   └── StudentProjects.vue
            │
            ├── components/         # Reusable components
            │   └── (shared UI components)
            │
            ├── types/              # TypeScript interfaces
            │   └── index.ts
            │
            └── styles/             # Global styles
                └── main.css
```

---

## Backend Architecture

### Entry Point

**File**: `packages/backend/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRouter);
app.use('/api/enroll', enrollRouter);
app.use('/api/admin', adminRouter);
// ... more routes

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Route Organization

Each route file handles a specific domain:

**Authentication Routes** (`routes/auth.ts`)
- `POST /api/login` - Admin login

**Admin Routes** (`routes/admin.ts`)
- Generic admin operations

**Project Routes** (`routes/projects.ts`)
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `GET /api/admin/projects/:id`
- `PUT /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id/submissions`

**Course Routes** (`routes/courses.ts`)
- Full CRUD for courses
- Handles course occurrences

**Section Routes** (`routes/sections.ts`)
- Time section management

**Student Routes** (`routes/students.ts`)
- Token validation
- Student-project association
- Bulk student import

**Enrollment Routes** (`routes/enroll.ts`)
- Student enrollment interface

### Database Layer

**File**: `packages/backend/src/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

All routes import this shared Prisma client for database operations.

### Error Handling Pattern

Consistent error handling across all routes:

```typescript
router.post('/endpoint', async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Business logic
    const result = await prisma.model.create({ ... });

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Validation Strategy

Uses `express-validator` for input validation:

```typescript
import { body, param, validationResult } from 'express-validator';

router.post('/projects',
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('timezone').optional().isString(),
  body('submissionStart').optional().isISO8601(),
  body('submissionEnd').optional().isISO8601(),
  async (req, res) => {
    // Handle request
  }
);
```

---

## Frontend Architecture

### Entry Point

**File**: `packages/frontend/src/main.ts`

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');
```

### Router Configuration

**File**: `packages/frontend/src/router/index.ts`

```typescript
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboard.vue')
    },
    // ... more routes
  ]
});

export default router;
```

**Routing Mode**: Hash-based (`#/route`)
- No server configuration needed
- Works with static hosting

### State Management

**File**: `packages/frontend/src/stores/auth.ts`

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const admin = ref(null);
  const student = ref(null);

  // Load from localStorage on init
  const storedAdmin = localStorage.getItem('admin');
  if (storedAdmin) {
    admin.value = JSON.parse(storedAdmin);
  }

  function setAdmin(adminData) {
    admin.value = adminData;
    localStorage.setItem('admin', JSON.stringify(adminData));
  }

  function logout() {
    admin.value = null;
    localStorage.removeItem('admin');
  }

  return { admin, student, setAdmin, logout };
});
```

**Persistence**: Uses localStorage for admin session

### Component Architecture

**Composition API Pattern** (`<script setup>`):

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Project } from '@/types';

// Reactive state
const projects = ref<Project[]>([]);
const loading = ref(false);

// Methods
async function fetchProjects() {
  loading.value = true;
  const response = await fetch('/api/admin/projects');
  projects.value = await response.json();
  loading.value = false;
}

// Lifecycle
onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else>
    <div v-for="project in projects" :key="project.id">
      {{ project.name }}
    </div>
  </div>
</template>

<style scoped>
/* Component styles */
</style>
```

### View Components

**Page-level components** in `src/views/`:

- **Home.vue** - Landing page, health check
- **Login.vue** - Admin authentication
- **AdminDashboard.vue** - Project list for admins
- **ProjectDetail.vue** - Detailed project view with tabs
- **ProjectForm.vue** - Create/edit project
- **Enroll.vue** - Student token entry
- **StudentProjects.vue** - Student project selection

### API Communication

**Direct fetch calls** (no centralized API client):

```typescript
// GET request
const response = await fetch('/api/admin/projects');
const projects = await response.json();

// POST request
const response = await fetch('/api/admin/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(projectData)
});
const newProject = await response.json();
```

**Vite Proxy Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

---

## TypeScript Configuration

### Root Config

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler"
  }
}
```

### Backend Config

**File**: `packages/backend/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

### Frontend Config

**File**: `packages/frontend/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

---

## Development Workflow

### Concurrent Development

**Root package.json scripts**:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
    "build": "npm run build -w backend && npm run build -w frontend"
  }
}
```

**Single command starts both servers**:
```bash
npm run dev
```

### Hot Reload

**Backend**: `tsx watch` monitors file changes
**Frontend**: Vite HMR updates instantly

### Development Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Prisma Studio: `http://localhost:5555`

---

## Build and Deployment

### Production Build

```bash
# Build everything
npm run build

# Backend output: packages/backend/dist/
# Frontend output: packages/frontend/dist/
```

### Backend Build
```bash
cd packages/backend
npm run build  # TypeScript → JavaScript
node dist/index.js
```

### Frontend Build
```bash
cd packages/frontend
npm run build  # Vite production build
npm run preview  # Preview production build
```

### Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

**Frontend**: Uses Vite environment variables
- `VITE_*` prefix for public variables
- Access via `import.meta.env.VITE_*`

---

## Security Architecture

### Password Security
- **Bcrypt hashing** with 10 salt rounds
- Passwords never stored in plain text
- Comparison using `bcrypt.compare()`

### Token Security
- **SHA-256 hashing** for student tokens
- One-way hash (non-reversible)
- First 12 characters used as token
- Normalized input (lowercase, trim)

### CORS Configuration
```typescript
app.use(cors()); // Allow all origins in dev
```

**Production**: Restrict to specific origins
```typescript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### Input Validation
- All user input validated with `express-validator`
- Type checking in TypeScript
- Sanitization (trim, escape)

### SQL Injection Prevention
- Prisma ORM handles query sanitization
- Prepared statements automatically
- No raw SQL queries

---

## Design Patterns

### Backend Patterns
- **Router pattern**: Modular route organization
- **Repository pattern**: Prisma as data access layer
- **Middleware pattern**: CORS, JSON parsing, validation
- **Error handling**: Try-catch with consistent responses

### Frontend Patterns
- **Composition API**: Reusable logic composition
- **Single File Components**: Encapsulated component logic
- **Store pattern**: Centralized state with Pinia
- **Route-level code splitting**: Lazy-loaded views

---

## Performance Considerations

### Backend
- Connection pooling (Prisma default)
- Efficient database queries with `include` and `select`
- Minimal middleware stack
- Fast JSON parsing

### Frontend
- Code splitting by route
- Lazy component loading
- Vite's optimized builds
- Tree shaking for unused code

### Database
- Indexed foreign keys
- Unique constraints for fast lookups
- Efficient relationship queries
- SQLite for low latency in dev

---

## Testing Strategy (Planned)

### Backend Testing
- **Unit tests**: Jest or Vitest
- **Integration tests**: Supertest for API routes
- **Database tests**: In-memory SQLite

### Frontend Testing
- **Unit tests**: Vitest + Vue Test Utils
- **Component tests**: Testing Library
- **E2E tests**: Playwright or Cypress

---

## Monitoring and Logging (Planned)

### Backend
- Request logging middleware
- Error tracking (Sentry)
- Performance monitoring
- Database query logging

### Frontend
- Error boundary components
- Analytics integration
- User session tracking
- Performance metrics

---

## Scalability Considerations

### Current Limitations
- SQLite (single file database)
- No caching layer
- No load balancing
- LocalStorage sessions

### Future Improvements
1. **Database**: Migrate to PostgreSQL
2. **Caching**: Redis for sessions and frequent queries
3. **Authentication**: JWT tokens with refresh
4. **File storage**: S3 for file uploads
5. **CDN**: Static asset delivery
6. **Horizontal scaling**: Multiple API instances
7. **Message queue**: Background job processing

---

## Documentation Standards

### Code Documentation
- JSDoc comments for functions
- Inline comments for complex logic
- README files in each package
- Architecture decision records (ADRs)

### API Documentation
- OpenAPI/Swagger specification (planned)
- Request/response examples
- Error code reference
- Authentication guide

---

## Version Control

### Git Workflow
- Main branch for stable code
- Feature branches for development
- Pull requests for review
- Semantic versioning

### .gitignore
```gitignore
node_modules/
dist/
*.db
.env
.DS_Store
```

---

## Dependency Management

### Version Strategy
- Locked versions in `package-lock.json`
- Periodic dependency updates
- Security audit: `npm audit`
- Outdated check: `npm outdated`

### Critical Dependencies
- Prisma: Database schema changes
- Vue: Framework updates
- Express: Security patches
- TypeScript: Language features
