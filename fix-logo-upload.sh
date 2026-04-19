#!/bin/bash

# Logo Yükleme 413 Hatası Düzeltme Script'i
# Bu script VPS'de çalıştırılmalıdır

set -e

echo "========================================="
echo "  Logo Yükleme Düzeltme Script'i"
echo "========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Backend container'da upload klasörlerini oluştur
echo -e "${YELLOW}[1/4] Backend container'da upload klasörleri oluşturuluyor...${NC}"
docker compose exec backend mkdir -p uploads/logos uploads/header-paper uploads/documents
# chmod bind mount üzerinde node ile çoğu zaman EPERM verir; gerekirse host'ta veya:
# docker compose exec -u root backend chown -R node:node uploads
echo -e "${GREEN}✅ Upload klasörleri oluşturuldu${NC}"

# 2. Nginx config'ini kontrol et
echo -e "${YELLOW}[2/4] Nginx config kontrol ediliyor...${NC}"
NGINX_CONTAINER=$(docker ps --filter "name=nginx" --filter "name=reverse-proxy" --format "{{.Names}}" | head -1)

if [ -z "$NGINX_CONTAINER" ]; then
    echo -e "${RED}❌ Nginx container bulunamadı!${NC}"
    echo -e "${YELLOW}💡 Reverse proxy container'ının adını kontrol edin: docker ps${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx container bulundu: $NGINX_CONTAINER${NC}"

# 3. Nginx config'de client_max_body_size olduğunu kontrol et
echo -e "${YELLOW}[3/4] Nginx client_max_body_size ayarı kontrol ediliyor...${NC}"
if docker exec "$NGINX_CONTAINER" grep -r "client_max_body_size" /etc/nginx/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ client_max_body_size ayarı mevcut${NC}"
    docker exec "$NGINX_CONTAINER" grep -r "client_max_body_size" /etc/nginx/ | head -5
else
    echo -e "${RED}❌ client_max_body_size ayarı bulunamadı!${NC}"
    echo -e "${YELLOW}💡 Nginx config dosyasına eklenmelidir:${NC}"
    echo "   client_max_body_size 20m;"
fi

# 4. Nginx'i reload et
echo -e "${YELLOW}[4/4] Nginx config'i yeniden yükleniyor...${NC}"
docker exec "$NGINX_CONTAINER" nginx -t && \
    docker exec "$NGINX_CONTAINER" nginx -s reload && \
    echo -e "${GREEN}✅ Nginx başarıyla yeniden yüklendi${NC}" || \
    echo -e "${RED}❌ Nginx reload hatası!${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}✅ Düzeltme tamamlandı!${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}Test için:${NC}"
echo "1. Sistem Ayarları sayfasına gidin"
echo "2. Logo Yükle butonuna tıklayın"
echo "3. Bir resim seçin (max 5MB)"
echo ""
echo -e "${YELLOW}Hala 413 hatası alıyorsanız:${NC}"
echo "1. nginx-proxy-config/yonetim.conf dosyasını kontrol edin"
echo "2. Reverse proxy container'ına config'i kopyalayın:"
echo "   docker cp nginx-proxy-config/yonetim.conf $NGINX_CONTAINER:/etc/nginx/conf.d/"
echo "   docker exec $NGINX_CONTAINER nginx -s reload"
