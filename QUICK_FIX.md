# Hızlı Çözüm - VPS'te Çalıştırın

## Sorun
Backend başlamıyor çünkü failed migration var: `20250118000000_comprehensive_notification_system`

## Hızlı Çözüm (Manuel)

VPS'te şu komutları çalıştırın:

```bash
# 1. Backend container'a bağlan
docker compose exec backend sh

# 2. Failed migration'ı resolve et
npx prisma migrate resolve --rolled-back 20250118000000_comprehensive_notification_system

# 3. Migration'ları deploy et
npx prisma migrate deploy

# 4. Container'tan çık
exit

# 5. Backend'i yeniden başlat
docker compose restart backend

# 6. Logları kontrol et
docker compose logs -f backend
```

## Alternatif: Database'den Manuel Düzeltme

```bash
# 1. PostgreSQL'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli

# 2. Failed migration'ı rolled_back olarak işaretle
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW(), finished_at = NOW()
WHERE migration_name = '20250118000000_comprehensive_notification_system' AND finished_at IS NULL;

# 3. Çık
\q

# 4. Backend'i yeniden başlat
docker compose restart backend
```

## Otomatik Çözüm (docker-entrypoint.sh güncellendi)

Yeni `docker-entrypoint.sh` dosyası failed migration'ları otomatik olarak resolve edecek. 

**Yapılacaklar:**
1. Değişiklikleri git'ten çekin veya dosyayı manuel güncelleyin
2. Backend'i yeniden build edin:

```bash
cd /var/www/yonetim-paneli
docker compose build --no-cache backend
docker compose up -d backend
docker compose logs -f backend
```

