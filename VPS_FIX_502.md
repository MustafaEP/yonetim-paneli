# 502 Bad Gateway Hatası - Hızlı Çözüm

## Adım 1: Container Durumunu Kontrol Edin

```bash
docker compose ps
```

**Beklenen çıktı:** Tüm container'lar `Up` durumunda olmalı.

## Adım 2: Backend Loglarını Kontrol Edin

```bash
docker compose logs --tail=100 backend
```

**Kontrol edilecekler:**
- ✅ "Application is running on: http://localhost:3000" mesajı var mı?
- ✅ Database migration'ları tamamlandı mı?
- ❌ Hata mesajları var mı?

## Adım 3: Backend Health Check

```bash
# Backend container içinden test
docker compose exec backend curl http://localhost:3000/health

# Frontend container'dan backend'e test
docker compose exec frontend curl http://backend:3000/health
```

**Beklenen çıktı:**
```json
{"status":"ok","timestamp":"...","service":"yonetim-paneli-backend"}
```

## Adım 4: Eğer Backend Çalışmıyorsa

### 4a. Backend'i Yeniden Başlatın

```bash
docker compose restart backend
docker compose logs -f backend
```

### 4b. Backend Migration'ları Kontrol Edin

```bash
# Migration durumunu kontrol et
docker compose exec backend npx prisma migrate status

# Migration'ları manuel çalıştır
docker compose exec backend npx prisma migrate deploy
```

### 4c. Database Bağlantısını Kontrol Edin

```bash
# PostgreSQL'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli -c "SELECT 1;"
```

## Adım 5: Frontend'i Yeniden Build Edin (nginx.conf değişti)

```bash
# Frontend'i yeniden build et (nginx.conf değişikliği için)
docker compose build --no-cache frontend
docker compose up -d frontend
```

## Adım 6: Nginx Config'i Kontrol Edin

```bash
# Nginx config'i görüntüle
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Nginx config'i test et
docker compose exec frontend nginx -t

# Nginx'i yeniden yükle (eğer config doğruysa)
docker compose exec frontend nginx -s reload
```

## Adım 7: Network Bağlantısını Test Edin

```bash
# Frontend'ten backend'e ping
docker compose exec frontend ping -c 3 backend

# Frontend'ten backend'e HTTP isteği
docker compose exec frontend wget -O- http://backend:3000/health
```

## Tam Çözüm (Tüm Adımlar)

Eğer yukarıdaki adımlar sorunu çözmediyse:

```bash
# 1. Tüm container'ları durdur
docker compose down

# 2. Frontend'i yeniden build et
docker compose build --no-cache frontend

# 3. Tüm container'ları başlat
docker compose up -d

# 4. Backend loglarını izle (migration'ların tamamlanmasını bekle)
docker compose logs -f backend

# 5. Başka bir terminal'de frontend loglarını izle
docker compose logs -f frontend

# 6. Backend health check
sleep 10
docker compose exec backend curl http://localhost:3000/health

# 7. Frontend'ten backend'e test
docker compose exec frontend curl http://backend:3000/health
```

## Yaygın Hatalar ve Çözümleri

### Hata: "Connection refused"
**Sebep:** Backend çalışmıyor veya henüz hazır değil
**Çözüm:**
```bash
docker compose logs backend
docker compose restart backend
```

### Hata: "Name or service not known"
**Sebep:** Network sorunu
**Çözüm:**
```bash
docker compose down
docker compose up -d
```

### Hata: "Database connection failed"
**Sebep:** PostgreSQL çalışmıyor veya yanlış credentials
**Çözüm:**
```bash
# PostgreSQL durumunu kontrol et
docker compose ps postgres

# .env dosyasındaki DATABASE_URL'i kontrol et
cat .env | grep DATABASE_URL
```

### Hata: "Migration failed"
**Sebep:** Database migration hatası
**Çözüm:**
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
docker compose restart backend
```

