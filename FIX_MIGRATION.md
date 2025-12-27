# Migration Hatası Çözümü - VPS

## Sorun
```
Error: P3009
migrate found failed migrations in the target database
The `20250118000000_comprehensive_notification_system` migration started at 2025-12-27 18:15:53.150348 UTC failed
```

## Çözüm Adımları

### Adım 1: Failed Migration'ı Resolve Et

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Migration durumunu kontrol et
npx prisma migrate status

# Failed migration'ı resolve et (rollback yap)
npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system

# Veya migration'ı applied olarak işaretle (eğer migration aslında başarılı olduysa)
npx prisma migrate resolve --applied 20250118000000_comprehensive_notification_system

# Migration'ları tekrar çalıştır
npx prisma migrate deploy

# Container'tan çık
exit
```

### Adım 2: Eğer Migration Gerçekten Başarısız Olduysa

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Migration'ı rolled-back olarak işaretle
npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system

# Migration'ları tekrar deploy et
npx prisma migrate deploy

# Container'tan çık
exit
```

### Adım 3: Database Connection Check'i Düzelt

Database connection check çalışmıyor. `docker-entrypoint.sh` dosyasını güncellemek gerekiyor.

### Adım 4: Backend'i Yeniden Başlat

```bash
docker compose restart backend
docker compose logs -f backend
```

## Alternatif: Database'i Sıfırla (DİKKAT: Tüm veri silinir!)

Eğer production'da değilseniz ve veri kaybı sorun değilse:

```bash
# Tüm container'ları durdur
docker compose down

# Volume'ları sil (DİKKAT: Tüm veri silinir!)
docker compose down -v

# Container'ları yeniden başlat
docker compose up -d

# Migration'lar otomatik çalışacak
docker compose logs -f backend
```

## Production İçin Güvenli Çözüm

```bash
# 1. Database'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli

# 2. Migration tablosunu kontrol et
SELECT * FROM "_prisma_migrations" WHERE migration_name = '20250118000000_comprehensive_notification_system';

# 3. Failed migration'ı kontrol et
SELECT * FROM "_prisma_migrations" WHERE finished_at IS NULL;

# 4. Eğer migration gerçekten başarısız olduysa, rolled_back olarak işaretle
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW(), finished_at = NOW()
WHERE migration_name = '20250118000000_comprehensive_notification_system' AND finished_at IS NULL;

# 5. PostgreSQL'den çık
\q

# 6. Backend'i yeniden başlat
docker compose restart backend
```

