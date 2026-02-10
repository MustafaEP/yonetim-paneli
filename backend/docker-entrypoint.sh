#!/bin/sh
set -e

echo "========================================="
echo "  Backend Entrypoint - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# ─── 1. Veritabanı Hazırlık Kontrolü ───
echo "[1/3] Veritabanı bağlantısı kontrol ediliyor..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const p = new PrismaClient();
        p.\$connect().then(() => { p.\$disconnect(); process.exit(0); })
          .catch(() => process.exit(1));
    " 2>/dev/null; then
        echo "✅ Veritabanı bağlantısı başarılı"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Veritabanına $MAX_RETRIES denemede bağlanılamadı!"
        exit 1
    fi

    echo "   Bekleniyor... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# ─── 2. Migration'ları Çalıştır ───
echo "[2/3] Migration'lar çalıştırılıyor..."

# Bilinen problemli migration'ları skip et (migration geçmişi karışmış olanlar)
if [ -d "prisma/migrations" ]; then
    # 202501* serisi migration'lar (20250120000000 hariç - CustomRoleScope tablosunu oluşturuyor)
    for MIGRATION in $(ls -1 prisma/migrations 2>/dev/null | grep -E '^202501' || true); do
        if [ "$MIGRATION" = "20250120000000_add_role_scope_system" ]; then
            continue
        fi
        npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || true
    done

    # Ek problemli migration'lar
    for MIGRATION in \
        "20251228230102_remove_contracted_institutions_feature" \
        "20251229000706_remove_workplace_feature"; do
        npx prisma migrate resolve --applied "$MIGRATION" 2>/dev/null || true
    done
fi

# Migration'ları deploy et
npx prisma migrate deploy || {
    echo "⚠️  İlk migration denemesi başarısız, tekrar deneniyor..."
    sleep 3
    npx prisma migrate deploy || {
        echo "❌ Migration hatası! Logları kontrol edin."
        echo "   Manuel çözüm: npx prisma migrate resolve --applied <migration_name>"
        exit 1
    }
}

echo "✅ Migration'lar tamamlandı"

# ─── 3. Uygulamayı Başlat ───
echo "[3/3] Uygulama başlatılıyor..."
echo "========================================="
exec "$@"
