# Build Hatası Çözümü - MODULE_NOT_FOUND: /app/dist/main

## Sorun
Backend başlatılamıyor çünkü `/app/dist/main` dosyası bulunamıyor.

## Çözüm Adımları

### 1. Backend Container'ını Kontrol Edin

```bash
# Container içinde dist klasörünü kontrol et
docker compose exec backend ls -la /app/dist/

# Veya container'a bağlan
docker compose exec backend sh
ls -la /app/dist/
exit
```

### 2. Backend'i Yeniden Build Edin

```bash
cd /var/www/yonetim-paneli

# Backend'i temiz build et
docker compose build --no-cache backend

# Build loglarını kontrol et
docker compose build backend 2>&1 | tee build.log

# Hata var mı kontrol et
grep -i error build.log
```

### 3. Build Loglarını İnceleyin

Build sırasında şu mesajları görmelisiniz:
- ✅ "Build succeeded"
- ✅ "dist/main.js" dosyası oluşturulmalı

Eğer build hatası varsa, hata mesajını paylaşın.

### 4. Manuel Build Test (Opsiyonel)

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Build'i manuel çalıştır
cd /app
npm run build

# Dist klasörünü kontrol et
ls -la dist/
ls -la dist/main.js

# Çık
exit
```

### 5. Eğer Build Başarılı Ama Dosya Yoksa

```bash
# Container'ı durdur
docker compose down backend

# Image'ı sil
docker rmi yonetim-paneli-backend

# Yeniden build et
docker compose build --no-cache backend

# Başlat
docker compose up -d backend

# Logları kontrol et
docker compose logs -f backend
```

## Beklenen Sonuç

Backend başladığında şu mesajları görmelisiniz:
```
Migrations completed. Starting application...
🚀 Application is running on: http://localhost:3000
```

## Yaygın Sorunlar

### Sorun: "Build failed - dist directory is empty"
**Sebep:** Build aşamasında hata var
**Çözüm:** Build loglarını kontrol edin ve TypeScript hatalarını düzeltin

### Sorun: "Cannot find module '/app/dist/main'"
**Sebep:** Dist klasörü kopyalanmamış veya build başarısız
**Çözüm:** Backend'i yeniden build edin

### Sorun: Build başarılı ama dosya yok
**Sebep:** Docker cache sorunu
**Çözüm:** `--no-cache` ile yeniden build edin

