#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Basit bekleme - depends_on zaten database'in hazır olmasını bekliyor
# Sadece kısa bir süre bekleyelim
sleep 5

echo "Checking for failed migrations..."
# Bilinen problemli migration'ları önce applied olarak işaretle (atla)
# Bu repo'da bazı eski (2025-01) migration'lar, daha sonra oluşturulan tablolara ALTER/UPDATE atıyor.
# Fresh DB kurulumunda bu durum relation does not exist hatasına sebep olabiliyor.
#
# Çözüm: Problemli 202501* migration'larını applied işaretle (skip) + ayrıca bilinen bazı migration'ları liste halinde tut.
# ÖNEMLİ: 20250120000000_add_role_scope_system migration'ı skip edilmemeli çünkü CustomRoleScope ve PanelUserApplicationScope tablolarını oluşturuyor.
#
# Not: Bu yaklaşım, migration geçmişi karışmış projelerde production deploy'u unblock etmek içindir.

# 1) Otomatik: tüm 202501* migration'ları applied olarak işaretle (20250120000000 hariç)
if [ -d "prisma/migrations" ]; then
  for MIGRATION in $(ls -1 prisma/migrations 2>/dev/null | grep -E '^202501' || true); do
    # 20250120000000_add_role_scope_system migration'ını skip etme (CustomRoleScope tablosunu oluşturuyor)
    if [ "$MIGRATION" = "20250120000000_add_role_scope_system" ]; then
      echo "Skipping auto-skip for critical migration: $MIGRATION"
      continue
    fi
    echo "Auto-skipping migration (mark as applied): $MIGRATION"
    npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || true
  done
fi

# 2) Manuel liste: ek problemli migration'lar
PROBLEM_MIGRATIONS="20251228230102_remove_contracted_institutions_feature 20251229000706_remove_workplace_feature"
for MIGRATION in $PROBLEM_MIGRATIONS; do
  echo "Attempting to mark migration as applied: $MIGRATION"
  npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || echo "Migration $MIGRATION already resolved or not found, continuing..."
done

echo "Adding APPROVED to MemberStatus enum if needed..."
# APPROVED enum değerini ekle (eğer yoksa)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const check = await prisma.\$queryRaw\`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumlabel = 'APPROVED' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberStatus')
    \`;
    if (check.length === 0) {
      await prisma.\$executeRaw\`ALTER TYPE \"MemberStatus\" ADD VALUE 'APPROVED'\`;
      console.log('✅ Added APPROVED to MemberStatus enum');
    } else {
      console.log('✓ APPROVED already exists in MemberStatus enum');
    }
  } catch (e) {
    console.error('⚠️  Error checking/adding APPROVED enum:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️  Could not add APPROVED enum (may already exist)"

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

