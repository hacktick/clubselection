# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

# Install all dependencies (needed for workspace)
RUN npm ci --workspace=frontend

# Copy frontend source
COPY packages/frontend ./packages/frontend

# Build frontend
RUN npm run build --workspace=frontend


# Build stage for backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install all dependencies including dev dependencies for build
RUN npm ci --workspace=backend

# Copy backend source and prisma schema
COPY packages/backend ./packages/backend

# Generate Prisma Client
RUN npm run db:generate --workspace=backend

# Build backend
RUN npm run build --workspace=backend


# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy root package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --workspace=backend --omit=dev

# Copy built backend
COPY --from=backend-builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=backend-builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=backend-builder /app/packages/backend/node_modules/.prisma ./packages/backend/node_modules/.prisma

# Copy built frontend
COPY --from=frontend-builder /app/packages/frontend/dist ./packages/frontend/dist

# Generate Prisma Client in production (for correct binary target)
WORKDIR /app/packages/backend
RUN npx prisma generate

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
