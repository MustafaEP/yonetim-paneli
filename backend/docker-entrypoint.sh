#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Simple wait loop - Prisma migrate will handle connection retries
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if npx prisma migrate status > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Database connection attempt $attempt/$max_attempts - waiting..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "Warning: Could not verify database connection, proceeding anyway..."
fi

echo "Running migrations..."
npx prisma migrate deploy

echo "Migrations completed. Starting application..."
exec "$@"

