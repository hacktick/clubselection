#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

# Check if admin user exists, if not seed the database
ADMIN_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM Admin;" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$ADMIN_COUNT" = "0" ] || [ -z "$ADMIN_COUNT" ]; then
  echo "No admin user found, seeding database..."
  npx prisma db seed
else
  echo "Admin user already exists, skipping seed."
fi

echo "Starting application..."
exec node dist/index.js
