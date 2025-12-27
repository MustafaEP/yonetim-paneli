# VPS Debug Rehberi - 502 Bad Gateway Hatası

## Hızlı Kontrol Komutları

### 1. Container Durumunu Kontrol Edin

```bash
# Tüm container'ların durumunu görüntüle
docker compose ps

# Backend container'ın durumunu kontrol et
docker compose ps backend

# Frontend container'ın durumunu kontrol et
docker compose ps frontend
```

### 2. Backend Loglarını Kontrol Edin

```bash
# Backend loglarını görüntüle
docker compose logs backend

# Son 50 satırı görüntüle
docker compose logs --tail=50 backend

# Real-time logları izle
docker compose logs -f backend
```

### 3. Backend Container'ın Çalışıp Çalışmadığını Test Edin

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Container içinde backend'e istek gönder
wget -O- http://localhost:3000/health

# Veya curl kullan
curl http://localhost:3000/health
```

### 4. Network Bağlantısını Test Edin

```bash
# Frontend container'dan backend'e bağlantıyı test et
docker compose exec frontend wget -O- http://backend:3000/health

# Veya curl kullan
docker compose exec frontend curl http://backend:3000/health
```

### 5. Nginx Config'i Kontrol Edin

```bash
# Nginx config'i görüntüle
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Nginx config'i test et
docker compose exec frontend nginx -t

# Nginx'i yeniden yükle
docker compose exec frontend nginx -s reload
```

### 6. Backend Health Check'i Kontrol Edin

```bash
# Backend health endpoint'ini test et
docker compose exec backend node -e "require('http').get('http://localhost:3000/health', (r) => {console.log('Status:', r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## Yaygın Sorunlar ve Çözümleri

### Sorun 1: Backend Container Çalışmıyor

**Kontrol:**
```bash
docker compose ps backend
```

**Çözüm:**
```bash
# Backend'i yeniden başlat
docker compose restart backend

# Veya logları kontrol et
docker compose logs backend
```

### Sorun 2: Backend Henüz Hazır Değil (Database Migration)

**Kontrol:**
```bash
docker compose logs backend | grep -i "migration\|error\|database"
```

**Çözüm:**
```bash
# Backend loglarını izle ve migration'ların tamamlanmasını bekle
docker compose logs -f backend

# Migration'ları manuel çalıştır
docker compose exec backend npx prisma migrate deploy
```

### Sorun 3: Network Bağlantısı Yok

**Kontrol:**
```bash
# Network'ü kontrol et
docker network inspect yonetim-paneli_yonetim-network

# Frontend'ten backend'e ping
docker compose exec frontend ping -c 3 backend
```

**Çözüm:**
```bash
# Container'ları yeniden başlat
docker compose down
docker compose up -d
```

### Sorun 4: Backend Port'u Yanlış

**Kontrol:**
```bash
# Backend'in hangi port'ta dinlediğini kontrol et
docker compose exec backend netstat -tulpn | grep 3000
```

**Çözüm:**
- `docker-compose.yml`'de `PORT: 3000` olduğundan emin olun
- Backend'in `main.ts`'de doğru port'ta dinlediğini kontrol edin

### Sorun 5: Nginx Proxy Config Hatası

**Kontrol:**
```bash
# Nginx error loglarını kontrol et
docker compose exec frontend cat /var/log/nginx/error.log
```

**Çözüm:**
- `nginx.conf` dosyasını kontrol edin
- `proxy_pass` direktifinin doğru olduğundan emin olun
- Nginx'i yeniden yükleyin: `docker compose restart frontend`

## Tam Debug Süreci

```bash
# 1. Tüm container'ları durdur
docker compose down

# 2. Logları temizle (opsiyonel)
docker compose logs --clear

# 3. Container'ları yeniden başlat
docker compose up -d

# 4. Backend loglarını izle
docker compose logs -f backend

# 5. Başka bir terminal'de frontend loglarını izle
docker compose logs -f frontend

# 6. Backend health check
docker compose exec backend curl http://localhost:3000/health

# 7. Frontend'ten backend'e test
docker compose exec frontend curl http://backend:3000/health
```

## Backend Başlatma Sorunları

Eğer backend başlamıyorsa:

```bash
# 1. Database bağlantısını kontrol et
docker compose exec postgres psql -U postgres -d yonetim_paneli -c "SELECT 1;"

# 2. Redis bağlantısını kontrol et
docker compose exec redis redis-cli ping

# 3. Environment variable'ları kontrol et
docker compose exec backend env | grep -E "DATABASE_URL|REDIS|JWT"

# 4. Backend'i manuel başlat (debug için)
docker compose exec backend sh
cd /app
node dist/main
```

## Nginx Proxy Debug

```bash
# Nginx access loglarını görüntüle
docker compose exec frontend tail -f /var/log/nginx/access.log

# Nginx error loglarını görüntüle
docker compose exec frontend tail -f /var/log/nginx/error.log

# Nginx config'i test et
docker compose exec frontend nginx -t

# Nginx'i yeniden başlat
docker compose restart frontend
```

