#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Basit bekleme - depends_on zaten database'in hazır olmasını bekliyor
# Sadece kısa bir süre bekleyelim
sleep 5

echo "Checking for failed migrations..."
# Failed migration'ları önce kontrol et ve resolve et
# Bilinen failed migration'ı direkt resolve et
FAILED_MIGRATION="20250118000000_comprehensive_notification_system"
echo "Attempting to resolve failed migration: $FAILED_MIGRATION"
npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>/dev/null || echo "Migration already resolved or not found, continuing..."

echo "Running migrations..."
# Migration'ları deploy et
npx prisma migrate deploy || {
  echo "Migration failed. Attempting to resolve and retry..."
  # Bilinen failed migration'ı tekrar resolve et
  npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>/dev/null || true
  # Tekrar dene
  echo "Retrying migrations..."
  npx prisma migrate deploy || {
    echo "Migration error occurred. Please check the logs and resolve manually."
    echo "To resolve manually, run: npx prisma migrate resolve --rolled-back $FAILED_MIGRATION"
    exit 1
  }
}

echo "Migrations completed. Starting application..."
exec "$@"

