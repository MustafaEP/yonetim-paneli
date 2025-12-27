# Docker Sorun Giderme Rehberi

## ERR_CONNECTION_TIMED_OUT Hatası

Bu hata genellikle frontend'te JavaScript dosyalarının yüklenememesi durumunda oluşur.

### 1. Container Loglarını Kontrol Edin

```bash
# Frontend container logları
docker-compose logs frontend

# Backend container logları
docker-compose logs backend

# Tüm loglar
docker-compose logs
```

### 2. Container İçinde Dosyaları Kontrol Edin

```bash
# Frontend container'a bağlan
docker-compose exec frontend sh

# Container içinde dosyaları kontrol et
ls -la /usr/share/nginx/html
ls -la /usr/share/nginx/html/assets

# index.html'i kontrol et
cat /usr/share/nginx/html/index.html | grep -i "index-"
```

### 3. Nginx Config'i Kontrol Edin

```bash
# Nginx config'i görüntüle
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Nginx config'i test et
docker-compose exec frontend nginx -t
```

### 4. Container'ı Yeniden Build Edin

```bash
# Frontend'i yeniden build et
docker-compose build --no-cache frontend

# Container'ları yeniden başlat
docker-compose up -d
```

### 5. Network Bağlantısını Kontrol Edin

```bash
# Container'ların network'te olduğunu kontrol et
docker network inspect yonetim-paneli_yonetim-network

# Frontend'ten backend'e bağlantıyı test et
docker-compose exec frontend wget -O- http://backend:3000/health
```

### 6. Port Kullanımını Kontrol Edin

```bash
# Port 80'in kullanımda olup olmadığını kontrol et
sudo netstat -tulpn | grep :80
# veya
sudo ss -tulpn | grep :80
```

### 7. Browser Console'u Kontrol Edin

Browser'da F12'ye basıp Console ve Network sekmesini kontrol edin:
- Hangi dosyalar yüklenemiyor?
- Hangi URL'ler timeout veriyor?
- HTTP status kodları nedir?

### 8. Nginx Error Loglarını Kontrol Edin

```bash
# Nginx error loglarını görüntüle
docker-compose exec frontend cat /var/log/nginx/error.log

# Veya real-time logları izle
docker-compose exec frontend tail -f /var/log/nginx/error.log
```

### 9. Build Çıktısını Kontrol Edin

```bash
# Build sırasında hata var mı kontrol et
docker-compose build frontend 2>&1 | tee build.log

# Build loglarını incele
cat build.log | grep -i error
```

### 10. Environment Variables'ı Kontrol Edin

```bash
# Frontend build arg'larını kontrol et
docker-compose config | grep -A 5 frontend

# .env dosyasını kontrol et
cat .env | grep VITE_API_BASE_URL
```

## Yaygın Çözümler

### Çözüm 1: Container'ı Tamamen Yeniden Build Et

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Çözüm 2: Volume'ları Temizle (DİKKAT: Veri kaybı olabilir)

```bash
docker-compose down -v
docker-compose up -d --build
```

### Çözüm 3: Nginx Config'i Yeniden Yükle

```bash
docker-compose restart frontend
```

### Çözüm 4: Build Çıktısını Manuel Kontrol Et

```bash
# Build'i local'de test et
cd panele
npm install
npm run build
ls -la dist/
ls -la dist/assets/
```

## Hata Mesajları ve Çözümleri

### "index-XXXXX.js:1 Failed to load resource: net::ERR_CONNECTION_TIMED_OUT"

**Olası Nedenler:**
1. Nginx static dosyaları serve edemiyor
2. Dosya path'leri yanlış
3. Network sorunu

**Çözüm:**
```bash
# Nginx config'i kontrol et ve düzelt
docker-compose exec frontend nginx -t
docker-compose restart frontend
```

### "502 Bad Gateway"

**Olası Nedenler:**
1. Backend çalışmıyor
2. Network bağlantısı yok

**Çözüm:**
```bash
# Backend durumunu kontrol et
docker-compose ps backend
docker-compose logs backend

# Backend'i yeniden başlat
docker-compose restart backend
```

### "404 Not Found" (JavaScript dosyaları için)

**Olası Nedenler:**
1. Build çıktısı eksik
2. Nginx root path yanlış

**Çözüm:**
```bash
# Container içinde dosyaları kontrol et
docker-compose exec frontend ls -la /usr/share/nginx/html

# Yeniden build et
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

