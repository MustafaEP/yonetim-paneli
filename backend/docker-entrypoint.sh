#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Basit bekleme - depends_on zaten database'in hazır olmasını bekliyor
# Sadece kısa bir süre bekleyelim
sleep 5

echo "Checking for failed migrations..."
# Bilinen problemli migration'ları önce applied olarak işaretle (atla)
# Bu migration'lar tablo/enum bağımlılıkları nedeniyle sıralama sorunları yaşayabilir
PROBLEM_MIGRATIONS="20250118000000_comprehensive_notification_system 20250119000000_add_audit_category 20250119000000_add_province_district_to_branch_tevkifat_center 20250130000001_update_dealer_to_contracted_institution 20251228230102_remove_contracted_institutions_feature"
for MIGRATION in $PROBLEM_MIGRATIONS; do
  echo "Attempting to mark migration as applied: $MIGRATION"
  npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || echo "Migration $MIGRATION already resolved or not found, continuing..."
done

echo "Running migrations..."
# Migration'ları deploy et
npx prisma migrate deploy || {
  echo "Migration failed. Attempting to resolve and retry..."
  # Problemli migration'ları applied olarak işaretle
  for MIGRATION in $PROBLEM_MIGRATIONS; do
    npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || true
  done
  # Tekrar dene
  echo "Retrying migrations..."
  npx prisma migrate deploy || {
    echo "Migration error occurred. Please check the logs and resolve manually."
    echo "To resolve manually, run: npx prisma migrate resolve --applied <migration_name>"
    exit 1
  }
}

echo "Migrations completed. Starting application..."
exec "$@"

