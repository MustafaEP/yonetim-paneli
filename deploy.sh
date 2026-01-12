#!/bin/bash

# Yönetim Paneli VPS Deployment Script
# Bu script, projeyi VPS'de deploy etmek için kullanılır

set -e  # Hata durumunda dur

echo "🚀 Yönetim Paneli Deployment Başlatılıyor..."

# Renkli çıktı için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Proje dizini
PROJECT_DIR="/opt/yonetim"
PROXY_DIR="/opt/proxy"

# 1. Proje dizinine git
echo -e "${YELLOW}📁 Proje dizinine gidiliyor...${NC}"
cd "$PROJECT_DIR" || exit 1

# 2. .env dosyasını kontrol et
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env dosyası bulunamadı!${NC}"
    echo -e "${YELLOW}💡 env.example dosyasını .env olarak kopyalayın ve düzenleyin.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env dosyası bulundu${NC}"

# 3. Docker Compose ile container'ları build et ve başlat
echo -e "${YELLOW}🔨 Container'lar build ediliyor...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}🚀 Container'lar başlatılıyor...${NC}"
docker-compose up -d

# 4. Container'ların başlamasını bekle
echo -e "${YELLOW}⏳ Container'ların başlaması bekleniyor...${NC}"
sleep 10

# 5. Database migration'ları çalıştır
echo -e "${YELLOW}🗄️  Database migration'ları çalıştırılıyor...${NC}"
docker-compose exec -T backend npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migration hatası, manuel olarak çalıştırılabilir:${NC}"
    echo "docker-compose exec backend npx prisma migrate deploy"
}

# 6. Container durumunu kontrol et
echo -e "${YELLOW}📊 Container durumu kontrol ediliyor...${NC}"
docker-compose ps

# 7. Health check
echo -e "${YELLOW}🏥 Health check yapılıyor...${NC}"
sleep 5

# Backend health check
if docker-compose exec -T backend node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
    echo -e "${GREEN}✅ Backend sağlıklı${NC}"
else
    echo -e "${RED}❌ Backend health check başarısız${NC}"
fi

# Frontend health check
if docker-compose exec -T frontend wget --no-verbose --tries=1 --spider http://localhost/ 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend sağlıklı${NC}"
else
    echo -e "${RED}❌ Frontend health check başarısız${NC}"
fi

# 8. Network bağlantısını kontrol et
echo -e "${YELLOW}🌐 Network bağlantısı kontrol ediliyor...${NC}"
NETWORK_NAME=$(docker-compose config | grep -A 2 "networks:" | tail -1 | awk '{print $1}' | tr -d ':')
if [ -n "$NETWORK_NAME" ]; then
    echo -e "${GREEN}✅ Network: $NETWORK_NAME${NC}"
    
    # Proxy container'ını network'e bağla (eğer bağlı değilse)
    PROXY_CONTAINER=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1)
    if [ -n "$PROXY_CONTAINER" ]; then
        if docker network inspect "$NETWORK_NAME" | grep -q "$PROXY_CONTAINER"; then
            echo -e "${GREEN}✅ Proxy container zaten network'te${NC}"
        else
            echo -e "${YELLOW}🔗 Proxy container network'e bağlanıyor...${NC}"
            docker network connect "$NETWORK_NAME" "$PROXY_CONTAINER" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Proxy container manuel olarak bağlanabilir:${NC}"
                echo "docker network connect $NETWORK_NAME $PROXY_CONTAINER"
            }
        fi
    fi
fi

# 9. Logları göster
echo -e "${YELLOW}📋 Son loglar:${NC}"
echo -e "${GREEN}=== Backend Logs ===${NC}"
docker-compose logs --tail=20 backend
echo -e "${GREEN}=== Frontend Logs ===${NC}"
docker-compose logs --tail=20 frontend

echo ""
echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo -e "${YELLOW}🌐 Site: https://yonetim.mustafaerhanportakal.com${NC}"
echo -e "${YELLOW}📊 Durum kontrolü: docker-compose ps${NC}"
echo -e "${YELLOW}📋 Loglar: docker-compose logs -f${NC}"


