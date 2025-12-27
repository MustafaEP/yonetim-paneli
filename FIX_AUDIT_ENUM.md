# AUDIT Enum Değeri Ekleme

## Sorun
`SystemSettingCategory` enum'unda `AUDIT` değeri yok. Migration applied olarak işaretlendiği için çalıştırılmadı.

## Çözüm: VPS'te Çalıştırın

```bash
# PostgreSQL'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli

# AUDIT değerini enum'a ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'AUDIT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SystemSettingCategory')
  ) THEN
    ALTER TYPE "SystemSettingCategory" ADD VALUE 'AUDIT';
  END IF;
END $$;

# Çık
\q
```

## Alternatif: Backend Container'dan

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Prisma ile enum'a değer ekle
npx prisma db execute --stdin <<EOF
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'AUDIT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SystemSettingCategory')
  ) THEN
    ALTER TYPE "SystemSettingCategory" ADD VALUE 'AUDIT';
  END IF;
END $$;
EOF

# Çık
exit
```

## Sonra Seed'i Tekrar Çalıştır

```bash
docker compose exec backend node dist/prisma/seed.js
```

