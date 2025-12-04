#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --skip-generate

# Check if admin user exists by trying to count admins
# If table doesn't exist or is empty, seed the database
echo "Checking for existing admin user..."
ADMIN_EXISTS=$(npx prisma db execute --stdin --json 2>/dev/null <<EOF
SELECT COUNT(*) as count FROM Admin;
EOF
) || ADMIN_EXISTS=""

# Extract count from JSON response
COUNT=$(echo "$ADMIN_EXISTS" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
  echo "No admin user found, seeding database..."
  npx prisma db seed
else
  echo "Admin user already exists ($COUNT found), skipping seed."
fi

echo "Starting application..."
exec node dist/index.js
