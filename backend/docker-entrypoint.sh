#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Basit bekleme - depends_on zaten database'in hazır olmasını bekliyor
# Sadece kısa bir süre bekleyelim
sleep 5

echo "Checking for failed migrations..."
# Failed migration'ları önce kontrol et ve resolve et
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
if echo "$MIGRATION_STATUS" | grep -q "failed migrations"; then
  echo "Warning: Failed migrations detected. Attempting to resolve..."
  # Failed migration ismini bul
  FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep -oE "The \`[^`]+\`" | sed "s/The \`//" | sed "s/\`//" | head -1)
  if [ -z "$FAILED_MIGRATION" ]; then
    # Fallback: bilinen failed migration
    FAILED_MIGRATION="20250118000000_comprehensive_notification_system"
  fi
  echo "Resolving failed migration: $FAILED_MIGRATION"
  npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>/dev/null || {
    echo "Could not resolve migration automatically. Please resolve manually."
  }
fi

echo "Running migrations..."
# Migration'ları deploy et
npx prisma migrate deploy || {
  echo "Migration failed. Attempting to resolve and retry..."
  # Tekrar failed migration kontrolü
  MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
  if echo "$MIGRATION_STATUS" | grep -q "failed migrations"; then
    FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep -oE "The \`[^`]+\`" | sed "s/The \`//" | sed "s/\`//" | head -1)
    if [ -z "$FAILED_MIGRATION" ]; then
      FAILED_MIGRATION="20250118000000_comprehensive_notification_system"
    fi
    echo "Resolving failed migration: $FAILED_MIGRATION"
    npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>/dev/null || true
    # Tekrar dene
    echo "Retrying migrations..."
    npx prisma migrate deploy
  else
    echo "Migration error occurred. Please check the logs."
    exit 1
  fi
}

echo "Migrations completed. Starting application..."
exec "$@"

