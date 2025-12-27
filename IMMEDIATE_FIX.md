# Acil Çözüm - VPS'te Şimdi Çalıştırın

## Sorun
Backend database connection check'inde takılıyor ve failed migration var.

## Hemen Çalıştırın (Manuel Düzeltme)

VPS'te şu komutları sırayla çalıştırın:

```bash
# 1. Backend container'a bağlan
docker compose exec backend sh

# 2. Failed migration'ı resolve et
npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system

# 3. Migration durumunu kontrol et
npx prisma migrate status

# 4. Migration'ları deploy et
npx prisma migrate deploy

# 5. Container'tan çık
exit

# 6. Backend'i yeniden başlat
docker compose restart backend

# 7. Logları kontrol et (backend başlamalı)
docker compose logs -f backend
```

## Alternatif: Database'den Direkt Düzeltme

Eğer yukarıdaki komutlar çalışmazsa:

```bash
# 1. PostgreSQL'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli

# 2. Failed migration kaydını kontrol et
SELECT migration_name, started_at, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20250118000000_comprehensive_notification_system';

# 3. Failed migration'ı rolled_back olarak işaretle
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW(), finished_at = NOW()
WHERE migration_name = '20250118000000_comprehensive_notification_system' 
  AND finished_at IS NULL;

# 4. Tüm failed migration'ları kontrol et
SELECT migration_name, started_at, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
WHERE finished_at IS NULL;

# 5. Eğer başka failed migration varsa, onları da düzelt
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW(), finished_at = NOW()
WHERE finished_at IS NULL;

# 6. PostgreSQL'den çık
\q

# 7. Backend'i yeniden başlat
docker compose restart backend

# 8. Logları kontrol et
docker compose logs -f backend
```

## docker-entrypoint.sh Güncellendi

Yeni script failed migration'ları otomatik resolve edecek. Güncellemek için:

```bash
cd /var/www/yonetim-paneli

# Git'ten çek (eğer commit ettiyseniz)
git pull

# Veya dosyayı manuel güncelleyin

# Backend'i yeniden build et
docker compose build --no-cache backend

# Backend'i başlat
docker compose up -d backend

# Logları izle
docker compose logs -f backend
```

## Beklenen Sonuç

Backend başladığında şu mesajları görmelisiniz:
```
Migrations completed. Starting application...
🚀 Application is running on: http://localhost:3000
```

Ardından health check çalışmalı:
```bash
docker compose exec backend curl http://localhost:3000/health
```

Response:
```json
{"status":"ok","timestamp":"...","service":"yonetim-paneli-backend"}
```

