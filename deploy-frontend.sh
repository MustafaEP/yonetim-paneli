#!/bin/bash

# Frontend Deployment Script
# Bu script, sadece frontend servisini deploy etmek için kullanılır
# Kullanım: ./deploy-frontend.sh [--full]
#
# Varsayılan: cache ile hızlı build
# --full: Tüm cache'i sıfırla ve sıfırdan build et

set -e

echo "=============================="
echo "  Frontend Deployment"
echo "=============================="

# Renkli çıktı
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Zaman ölçümü
START_TIME=$(date +%s)

# Argüman işleme
FULL_BUILD=false

for arg in "$@"; do
  case $arg in
    --full) FULL_BUILD=true ;;
    -h|--help)
      echo "Kullanım: ./deploy-frontend.sh [--full]"
      echo ""
      echo "  --full    Tüm cache'i sıfırla, sıfırdan build"
      exit 0
      ;;
  esac
done

# Proje dizini
PROJECT_DIR="/opt/yonetim"

# Docker BuildKit'i etkinleştir (hızlı layer caching)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 1. Proje dizinine git
echo -e "${YELLOW}📁 Proje dizinine gidiliyor...${NC}"
cd "$PROJECT_DIR" || exit 1

# 2. .env dosyasını kontrol et
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env dosyası bulunamadı!${NC}"
    echo -e "${YELLOW}💡 env.example dosyasını .env olarak kopyalayın ve düzenleyin:${NC}"
    echo "   cp env.example .env && nano .env"
    exit 1
fi
echo -e "${GREEN}✅ .env dosyası bulundu${NC}"

# 3. Git'ten son değişiklikleri çek
echo -e "${YELLOW}📥 Git'ten güncellemeler çekiliyor...${NC}"
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Git pull başarısız. Manuel olarak pull yapabilirsiniz.${NC}"
}

# 4. Frontend container'ını durdur
echo -e "${YELLOW}🛑 Frontend servisi durduruluyor...${NC}"
docker compose stop frontend 2>/dev/null || true

# 5. Docker Compose ile build et
if $FULL_BUILD; then
    echo -e "${YELLOW}🔨 FULL BUILD - Tüm cache sıfırlanıyor...${NC}"
    docker compose build --no-cache frontend
else
    echo -e "${YELLOW}🔨 BUILD (cache ile, hızlı)...${NC}"
    docker compose build frontend
fi

BUILD_TIME=$(date +%s)
echo -e "${CYAN}⏱  Build süresi: $(( BUILD_TIME - START_TIME )) saniye${NC}"

# 6. Container'ı başlat
echo -e "${YELLOW}🚀 Frontend container başlatılıyor...${NC}"
docker compose up -d frontend

# 7. Health check
echo -e "${YELLOW}🏥 Health check yapılıyor...${NC}"
HEALTH_OK=false

echo -n "  Frontend: "
for i in $(seq 1 15); do
    if docker compose exec -T frontend wget --no-verbose --tries=1 --spider http://localhost/ 2>/dev/null; then
        echo -e "${GREEN}✅ Sağlıklı${NC}"
        HEALTH_OK=true
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}❌ Başarısız${NC}"
    fi
    sleep 1
done

# 8. Proxy network bağlantısını kontrol et
echo -e "${YELLOW}🌐 Network bağlantısı kontrol ediliyor...${NC}"
PROXY_CONTAINER=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1)
if [ -n "$PROXY_CONTAINER" ]; then
    NETWORK_NAME="edge"
    if docker network inspect "$NETWORK_NAME" | grep -q "$PROXY_CONTAINER" 2>/dev/null; then
        echo -e "${GREEN}✅ Proxy container network'te${NC}"
    else
        docker network connect "$NETWORK_NAME" "$PROXY_CONTAINER" 2>/dev/null && \
            echo -e "${GREEN}✅ Proxy container network'e bağlandı${NC}" || \
            echo -e "${YELLOW}⚠️  Proxy container bağlanamadı (manuel: docker network connect $NETWORK_NAME $PROXY_CONTAINER)${NC}"
    fi
fi

# 9. Reverse proxy'yi yeniden başlat (502 hatasını önlemek için)
echo -e "${YELLOW}🔄 Reverse proxy yeniden başlatılıyor...${NC}"
docker restart reverse-proxy 2>/dev/null && echo -e "${GREEN}✅ Reverse proxy yeniden başlatıldı${NC}" || echo -e "${YELLOW}⚠️  reverse-proxy container bulunamadı veya yeniden başlatılamadı${NC}"

# 10. Sonuç ve durum
END_TIME=$(date +%s)
TOTAL_TIME=$(( END_TIME - START_TIME ))

echo ""
echo "=============================="
if [ "$HEALTH_OK" = true ]; then
    echo -e "${GREEN}✅ Frontend deployment tamamlandı! (${TOTAL_TIME} saniye)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend deployment tamamlandı ama health check başarısız (${TOTAL_TIME} saniye)${NC}"
fi
echo "=============================="
echo ""

# Container durumu
docker compose ps frontend

echo ""
echo -e "${CYAN}🌐 Site: https://yonetim.mustafaerhanportakal.com${NC}"
echo -e "${CYAN}📊 Durum: docker compose ps frontend${NC}"
echo -e "${CYAN}📋 Loglar: docker compose logs -f frontend${NC}"

# Health check başarısız olduysa son logları göster
if [ "$HEALTH_OK" != true ]; then
    echo ""
    echo -e "${YELLOW}📋 Son frontend logları:${NC}"
    docker compose logs --tail=30 frontend
fi
