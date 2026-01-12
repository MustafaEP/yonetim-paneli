#!/bin/bash

# Migration fix script - VPS üzerinde çalıştırın
# Kullanım: ./fix-migration.sh

set -e

echo "🔍 Migration durumu kontrol ediliyor..."

# PostgreSQL container'ına bağlan ve durumu kontrol et
docker compose exec -T postgres psql -U postgres -d yonetim_paneli <<EOF
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'hasScopeRestriction'
        ) THEN '✓ hasScopeRestriction kolonu mevcut'
        ELSE '✗ hasScopeRestriction kolonu YOK'
    END as check_hasScopeRestriction;
EOF

echo ""
echo "🔧 Migration düzeltiliyor..."

# Fix script'ini çalıştır
docker compose exec -T postgres psql -U postgres -d yonetim_paneli < backend/scripts/fix-migration.sql

echo ""
echo "✅ Migration fix tamamlandı!"
echo ""
echo "📝 Şimdi Prisma'ya migration'ın tamamlandığını bildirin:"
echo "   docker compose exec backend npx prisma migrate resolve --applied 20250120000000_add_role_scope_system"
echo ""
echo "📝 Sonra yeni migration'ları uygulayın:"
echo "   docker compose exec backend npx prisma migrate deploy"

