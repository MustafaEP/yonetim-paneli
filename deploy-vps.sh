#!/bin/bash
# VPS Deployment Script - Hızlı Güncelleme
# Kullanım: ./deploy-vps.sh

set -e

echo "🚀 VPS Deployment Başlatılıyor..."

# 1. Git'ten son değişiklikleri çek
echo "📥 Git'ten güncellemeler çekiliyor..."
git pull origin main || git pull origin master

# 2. Docker container'ları durdur (sadece backend ve frontend)
echo "🛑 Mevcut container'lar durduruluyor..."
docker-compose stop backend frontend || true

# 3. Backend ve Frontend'i yeniden build et
echo "🔨 Backend ve Frontend yeniden build ediliyor..."
docker-compose build --no-cache backend frontend

# 4. Container'ları başlat (migration'lar otomatik çalışacak)
echo "▶️  Container'lar başlatılıyor..."
docker-compose up -d backend frontend

# 5. Logları göster
echo "📋 Backend logları:"
docker-compose logs --tail=50 backend

echo ""
echo "✅ Deployment tamamlandı!"
echo "📊 Tüm loglar için: docker-compose logs -f"
echo "🔍 Backend logları için: docker-compose logs -f backend"

