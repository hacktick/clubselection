# Setup Guide

Complete installation and configuration guide for the Club Selection Management System.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Node.js** | 18.0.0 | 20.x LTS | JavaScript runtime |
| **npm** | 9.0.0 | Latest | Package manager |
| **Git** | 2.x | Latest | Version control |

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check Git version
git --version
# Should output: git version 2.x.x
```

### Operating System Support

- **Windows** 10/11
- **macOS** 10.15+
- **Linux** Ubuntu 20.04+, Debian 10+, Fedora 35+

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd clubselection
```

### 2. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm install
```

This command installs dependencies for:
- Root workspace
- Backend package
- Frontend package

### 3. Configure Environment

```bash
# Copy the example environment file
cd packages/backend
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Configuration](#environment-configuration)).

### 4. Initialize Database

```bash
# Run database migrations
cd packages/backend
npm run migrate

# Seed initial data (creates admin user)
npm run seed
```

### 5. Start Development Servers

```bash
# Return to root directory
cd ../..

# Start both frontend and backend
npm run dev
```

This starts:
- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:5173

### 6. Access the Application

Open your browser and navigate to:
- **Application**: http://localhost:5173
- **API Health Check**: http://localhost:3001/api/health
- **Prisma Studio** (optional): Run `npm run studio` in `packages/backend`

### Default Credentials

- **Username**: `admin`
- **Password**: `admin`

**IMPORTANT**: Change the default password after first login (feature to be implemented).

---

## Detailed Installation

### Step-by-Step Setup

#### 1. Project Structure

After cloning, your directory should look like:
```
clubselection/
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
├── docs/
└── packages/
    ├── backend/
    └── frontend/
```

#### 2. Install Root Dependencies

```bash
# From project root
npm install
```

This installs:
- `concurrently` - For running multiple dev servers

#### 3. Install Backend Dependencies

```bash
cd packages/backend
npm install
```

Backend dependencies include:
- `express` - Web framework
- `@prisma/client` - Database ORM
- `bcrypt` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `express-validator` - Input validation

#### 4. Install Frontend Dependencies

```bash
cd packages/frontend
npm install
```

Frontend dependencies include:
- `vue` - Frontend framework
- `vue-router` - Routing
- `pinia` - State management
- `vite` - Build tool

#### 5. Backend Configuration

**Environment Variables** (`.env`):

```bash
cd packages/backend

# Copy example file
cp .env.example .env

# Edit .env
nano .env  # or use your preferred editor
```

**Required variables**:
```env
# Database connection string
DATABASE_URL="file:./dev.db"

# Server port (default: 3001)
PORT=3001

# Node environment
NODE_ENV=development
```

#### 6. Database Setup

**Run Prisma Migrations**:
```bash
cd packages/backend
npm run migrate
```

This command:
- Creates the SQLite database file (`prisma/dev.db`)
- Applies all migrations from `prisma/migrations/`
- Generates the Prisma Client

**Seed Initial Data**:
```bash
npm run seed
```

This creates:
- Admin user with username `admin` and password `admin`

**Verify Database**:
```bash
# Open Prisma Studio
npm run studio
```

Navigate to http://localhost:5555 to browse the database.

#### 7. Frontend Configuration

**Vite Configuration** (`vite.config.ts`):

The frontend is pre-configured to proxy API requests to the backend:

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

**No additional configuration needed** unless you change the backend port.

---

## Environment Configuration

### Backend Environment Variables

**File**: `packages/backend/.env`

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# SQLite database file path (relative to prisma folder)
DATABASE_URL="file:./dev.db"

# For PostgreSQL (production):
# DATABASE_URL="postgresql://user:password@localhost:5432/clubselection?schema=public"

# For MySQL (production):
# DATABASE_URL="mysql://user:password@localhost:3306/clubselection"


# ============================================
# SERVER CONFIGURATION
# ============================================

# Port for the API server
PORT=3001

# Node environment (development, production, test)
NODE_ENV=development


# ============================================
# SECURITY (Optional - for future use)
# ============================================

# JWT secret key (when JWT is implemented)
# JWT_SECRET="your-secret-key-here"

# Session secret (when sessions are implemented)
# SESSION_SECRET="your-session-secret-here"

# Token expiration time
# TOKEN_EXPIRY="7d"


# ============================================
# CORS CONFIGURATION (Optional)
# ============================================

# Allowed origins (comma-separated)
# CORS_ORIGIN="http://localhost:5173,https://your-domain.com"


# ============================================
# LOGGING (Optional)
# ============================================

# Log level (error, warn, info, debug)
# LOG_LEVEL="info"
```

### Frontend Environment Variables

**File**: `packages/frontend/.env` (optional)

```env
# API base URL (if different from proxy)
# VITE_API_BASE_URL="http://localhost:3001/api"

# Application name
# VITE_APP_NAME="Club Selection"

# Environment
# VITE_ENV="development"
```

**Note**: Vite environment variables must be prefixed with `VITE_`.

---

## Development Workflow

### Running Development Servers

#### Option 1: Run Both Servers Concurrently (Recommended)

```bash
# From project root
npm run dev
```

This starts:
- Backend on port 3001 (with hot reload)
- Frontend on port 5173 (with HMR)

#### Option 2: Run Servers Separately

**Terminal 1 - Backend**:
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd packages/frontend
npm run dev
```

#### Option 3: Run Individual Workspaces from Root

```bash
# Backend only
npm run dev -w backend

# Frontend only
npm run dev -w frontend
```

### Common Development Tasks

#### Database Management

**Create a new migration**:
```bash
cd packages/backend
npx prisma migrate dev --name migration_description
```

**Reset database** (deletes all data):
```bash
npx prisma migrate reset
```

**Generate Prisma Client** (after schema changes):
```bash
npx prisma generate
```

**Open Prisma Studio**:
```bash
npm run studio
```

#### Code Changes

**Backend changes**:
- Files in `packages/backend/src/` auto-reload via `tsx watch`
- API endpoints immediately reflect changes
- No manual restart needed

**Frontend changes**:
- Files in `packages/frontend/src/` use Vite HMR
- Changes appear instantly in browser
- State is preserved when possible

#### TypeScript Type Checking

**Backend**:
```bash
cd packages/backend
npx tsc --noEmit
```

**Frontend**:
```bash
cd packages/frontend
npm run build  # Includes type checking
```

---

## Building for Production

### Full Build

```bash
# From project root
npm run build
```

This builds both packages:
- Backend: TypeScript → JavaScript in `packages/backend/dist/`
- Frontend: Optimized bundle in `packages/frontend/dist/`

### Backend Build

```bash
cd packages/backend
npm run build
```

Output: `dist/` folder with compiled JavaScript.

**Run production build**:
```bash
node dist/index.js
```

**Environment**:
```env
NODE_ENV=production
```

### Frontend Build

```bash
cd packages/frontend
npm run build
```

Output: `dist/` folder with optimized assets.

**Preview production build**:
```bash
npm run preview
```

**Deploy**: Upload `dist/` folder to your hosting provider (Netlify, Vercel, etc.)

---

## Database Migration Guide

### Production Database Setup

#### PostgreSQL (Recommended for Production)

**1. Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt install postgresql

# macOS
brew install postgresql
```

**2. Create Database**:
```sql
CREATE DATABASE clubselection;
CREATE USER clubuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE clubselection TO clubuser;
```

**3. Update Prisma Schema** (`schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**4. Update Environment** (`.env`):
```env
DATABASE_URL="postgresql://clubuser:your_secure_password@localhost:5432/clubselection?schema=public"
```

**5. Run Migrations**:
```bash
npx prisma migrate deploy
```

#### MySQL/MariaDB

**Update schema.prisma**:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**Update .env**:
```env
DATABASE_URL="mysql://user:password@localhost:3306/clubselection"
```

### Backup and Restore

#### SQLite Backup
```bash
# Backup
cp packages/backend/prisma/dev.db packages/backend/prisma/backup.db

# Restore
cp packages/backend/prisma/backup.db packages/backend/prisma/dev.db
```

#### PostgreSQL Backup
```bash
# Backup
pg_dump clubselection > backup.sql

# Restore
psql clubselection < backup.sql
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -ti:3001

# Kill process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

**Or change port** in `packages/backend/.env`:
```env
PORT=3002
```

#### 2. Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:
- Verify `DATABASE_URL` in `.env`
- Check database file exists: `packages/backend/prisma/dev.db`
- Run migrations: `npm run migrate`
- Check file permissions

#### 3. Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
cd packages/backend
npx prisma generate
```

#### 4. Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or clean install
npm ci
```

#### 5. TypeScript Compilation Errors

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Rebuild
npm run build
```

#### 6. CORS Errors in Browser

**Error**: `Access to fetch blocked by CORS policy`

**Solution**:
- Verify backend is running on port 3001
- Check Vite proxy configuration
- Ensure CORS is enabled in backend

#### 7. Hot Reload Not Working

**Frontend**:
```bash
# Clear Vite cache
cd packages/frontend
rm -rf node_modules/.vite
npm run dev
```

**Backend**:
```bash
# Restart tsx watch
cd packages/backend
npm run dev
```

### Debug Mode

**Backend logging**:
```typescript
// Add to packages/backend/src/index.ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Frontend debug**:
```typescript
// Enable Vue DevTools
import { createApp } from 'vue';
const app = createApp(App);
app.config.performance = true;
```

---

## IDE Setup

### Visual Studio Code (Recommended)

**Recommended Extensions**:
- **Vue Language Features (Volar)** - Vue 3 support
- **TypeScript Vue Plugin (Volar)** - TypeScript in Vue files
- **Prisma** - Prisma schema syntax highlighting
- **ESLint** - Code linting
- **Prettier** - Code formatting

**Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### WebStorm / IntelliJ IDEA

- Enable TypeScript support
- Configure Prisma plugin
- Set Node.js interpreter to version 18+

---

## Testing Setup (Future)

### Unit Testing

**Install dependencies**:
```bash
npm install -D vitest @vue/test-utils jsdom
```

**Configure Vitest** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});
```

### E2E Testing

**Install Playwright**:
```bash
npm init playwright@latest
```

**Run tests**:
```bash
npx playwright test
```

---

## Deployment

### Backend Deployment

**Recommended Platforms**:
- **Railway** - PostgreSQL + Node.js hosting
- **Heroku** - Free tier available
- **DigitalOcean App Platform** - Simple deployment
- **AWS Elastic Beanstalk** - Scalable infrastructure
- **Google Cloud Run** - Containerized deployment

**Environment Variables to Set**:
```env
DATABASE_URL=<production-database-url>
NODE_ENV=production
PORT=3001
```

**Build command**:
```bash
npm run build
```

**Start command**:
```bash
node dist/index.js
```

### Frontend Deployment

**Recommended Platforms**:
- **Vercel** - Optimized for Vite
- **Netlify** - Free tier with CI/CD
- **GitHub Pages** - Free static hosting
- **Cloudflare Pages** - Fast global CDN

**Build command**:
```bash
npm run build
```

**Output directory**:
```
packages/frontend/dist
```

**Environment Variables**:
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### Docker Deployment (Advanced)

**Backend Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY packages/backend/package*.json ./
RUN npm ci --production
COPY packages/backend/ ./
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY packages/frontend/package*.json ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Performance Optimization

### Backend Optimization

**Connection Pooling** (PostgreSQL):
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**Caching** (add Redis):
```bash
npm install redis
```

### Frontend Optimization

**Code Splitting**:
```typescript
// Already implemented with lazy-loaded routes
const Home = () => import('./views/Home.vue');
```

**Bundle Analysis**:
```bash
npm install -D rollup-plugin-visualizer
```

---

## Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Use strong database passwords
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS for specific origins only
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Add authentication middleware
- [ ] Implement JWT tokens
- [ ] Regular security audits: `npm audit`
- [ ] Keep dependencies updated
- [ ] Add request logging
- [ ] Implement CSRF protection
- [ ] Set secure HTTP headers

---

## Additional Resources

### Documentation
- [Vue 3 Documentation](https://vuejs.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Guide](https://vitejs.dev/)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database browser
- [Vue DevTools](https://devtools.vuejs.org/) - Vue debugging
- [Postman](https://www.postman.com/) - API testing

### Community
- [Vue Discord](https://discord.com/invite/vue)
- [Prisma Slack](https://slack.prisma.io/)

---

## Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review the [Architecture Documentation](ARCHITECTURE.md)
3. Check the [API Documentation](API_DOCUMENTATION.md)
4. Search existing issues in the repository
5. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version)
   - Error messages and logs

---

## Next Steps

After successful setup:

1. **Read the docs**: Familiarize yourself with the [Project Overview](PROJECT_OVERVIEW.md)
2. **Explore the database**: Use Prisma Studio to understand the data model
3. **Test the API**: Use the [API Documentation](API_DOCUMENTATION.md) to test endpoints
4. **Customize**: Modify the frontend to match your branding
5. **Add features**: Extend the system with new functionality

Happy coding!
