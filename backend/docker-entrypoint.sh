#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Basit bekleme - depends_on zaten database'in hazır olmasını bekliyor
# Sadece kısa bir süre bekleyelim
sleep 5

echo "Checking for failed migrations..."
# Bilinen problemli migration'ı önce applied olarak işaretle (atla)
PROBLEM_MIGRATION="20250118000000_comprehensive_notification_system"
echo "Attempting to mark migration as applied: $PROBLEM_MIGRATION"
npx prisma migrate resolve --applied "$PROBLEM_MIGRATION" 2>/dev/null || echo "Migration already resolved or not found, continuing..."

echo "Running migrations..."
# Migration'ları deploy et
npx prisma migrate deploy || {
  echo "Migration failed. Attempting to resolve and retry..."
  # Problemli migration'ı applied olarak işaretle
  npx prisma migrate resolve --applied "$PROBLEM_MIGRATION" 2>/dev/null || true
  # Tekrar dene
  echo "Retrying migrations..."
  npx prisma migrate deploy || {
    echo "Migration error occurred. Please check the logs and resolve manually."
    echo "To resolve manually, run: npx prisma migrate resolve --applied $PROBLEM_MIGRATION"
    exit 1
  }
}

echo "Migrations completed. Starting application..."
exec "$@"

