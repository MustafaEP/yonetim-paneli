#!/bin/bash
# VPS Deployment Script - Hızlı Güncelleme
# Kullanım: ./deploy-vps.sh
# Not: Bu script deploy.sh'ın kısa versiyonudur.
#      Detaylı deploy için: ./deploy.sh

set -e

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🚀 VPS Hızlı Deployment Başlatılıyor..."

# 1. Git'ten son değişiklikleri çek
echo "📥 Git'ten güncellemeler çekiliyor..."
git pull origin main || git pull origin master

# 2. Docker container'ları durdur (sadece backend ve frontend)
echo "🛑 Mevcut container'lar durduruluyor..."
docker compose stop backend frontend || true

# 3. Backend ve Frontend'i yeniden build et (cache ile - hızlı!)
echo "🔨 Backend ve Frontend yeniden build ediliyor..."
docker compose build --parallel backend frontend

# 4. Container'ları başlat (entrypoint migration'ları otomatik çalıştırır)
echo "▶️  Container'lar başlatılıyor..."
docker compose up -d backend frontend

# 5. Backend hazır olana kadar bekle
echo "⏳ Backend başlatılıyor..."
for i in $(seq 1 30); do
    if docker compose exec -T backend node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" 2>/dev/null; then
        echo "✅ Backend hazır!"
        break
    fi
    [ $i -eq 30 ] && echo "⚠️  Backend 30 saniyede hazır olmadı. Logları kontrol edin."
    sleep 1
done

# 6. Logları göster
echo ""
echo "📋 Backend logları (son 30 satır):"
docker compose logs --tail=30 backend

echo ""
echo "✅ Deployment tamamlandı!"
echo "📊 Tüm loglar için: docker compose logs -f"
