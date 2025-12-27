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
# Failed migration'ları kontrol et ve resolve et
if npx prisma migrate status 2>&1 | grep -q "failed migrations"; then
  echo "Warning: Failed migrations detected. Attempting to resolve..."
  # Failed migration'ı rolled-back olarak işaretle (güvenli varsayılan)
  npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system 2>/dev/null || true
fi

# Migration'ları deploy et
npx prisma migrate deploy || {
  echo "Migration failed. Attempting to resolve failed migrations..."
  # Tüm failed migration'ları resolve et
  npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system 2>/dev/null || true
  # Tekrar dene
  npx prisma migrate deploy
}

echo "Migrations completed. Starting application..."
exec "$@"

