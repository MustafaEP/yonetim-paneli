# Notification Enum'ları ve Kolonları Ekleme

## Sorun
`NotificationCategory` ve diğer enum'lar yok. Önce enum'ları oluşturmamız, sonra kolonları eklememiz gerekiyor.

## Çözüm: VPS'te Çalıştırın

```bash
# PostgreSQL'e bağlan
docker compose exec postgres psql -U postgres -d yonetim_paneli
```

Sonra şu SQL komutlarını sırayla çalıştırın:

```sql
-- 1. NotificationCategory enum'unu oluştur
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationCategory') THEN
    CREATE TYPE "NotificationCategory" AS ENUM ('SYSTEM', 'FINANCIAL', 'ANNOUNCEMENT', 'REMINDER');
  END IF;
END $$;

-- 2. NotificationTypeCategory enum'unu oluştur
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationTypeCategory') THEN
    CREATE TYPE "NotificationTypeCategory" AS ENUM (
      'MEMBER_APPLICATION_NEW',
      'MEMBER_APPLICATION_APPROVED',
      'MEMBER_APPLICATION_REJECTED',
      'ROLE_CHANGED',
      'SCOPE_ASSIGNED',
      'PASSWORD_RESET',
      'ACCOUNT_ACTIVATED',
      'ACCOUNT_DEACTIVATED',
      'DUES_PAYMENT_RECEIVED',
      'DUES_OVERDUE',
      'DUES_BULK_REPORT_READY',
      'ACCOUNTING_APPROVAL_PENDING',
      'ANNOUNCEMENT_GENERAL',
      'ANNOUNCEMENT_REGIONAL',
      'ANNOUNCEMENT_WORKPLACE',
      'ANNOUNCEMENT_ELECTION',
      'REMINDER_DUES_PAYMENT',
      'REMINDER_DOCUMENT_MISSING',
      'REMINDER_REPRESENTATIVE_TERM_EXPIRING',
      'REMINDER_PENDING_APPROVAL'
    );
  END IF;
END $$;

-- 3. NotificationChannel enum'unu oluştur (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');
  END IF;
END $$;

-- 4. Notification tablosuna kolonları ekle
DO $$ 
BEGIN
  -- category kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'category') THEN
    ALTER TABLE "Notification" ADD COLUMN "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM';
  END IF;
  
  -- typeCategory kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'typeCategory') THEN
    ALTER TABLE "Notification" ADD COLUMN "typeCategory" "NotificationTypeCategory";
  END IF;
  
  -- channels kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'channels') THEN
    ALTER TABLE "Notification" ADD COLUMN "channels" "NotificationChannel"[] NOT NULL DEFAULT ARRAY['IN_APP']::"NotificationChannel"[];
  END IF;
  
  -- targetRole kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'targetRole') THEN
    ALTER TABLE "Notification" ADD COLUMN "targetRole" TEXT;
  END IF;
  
  -- scheduledFor kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'scheduledFor') THEN
    ALTER TABLE "Notification" ADD COLUMN "scheduledFor" TIMESTAMP(3);
  END IF;
  
  -- actionUrl kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'actionUrl') THEN
    ALTER TABLE "Notification" ADD COLUMN "actionUrl" TEXT;
  END IF;
  
  -- actionLabel kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'actionLabel') THEN
    ALTER TABLE "Notification" ADD COLUMN "actionLabel" TEXT;
  END IF;
  
  -- metadata kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'metadata') THEN
    ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB;
  END IF;
  
  -- updatedAt kolonu (eğer yoksa)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notification' AND column_name = 'updatedAt') THEN
    ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 5. Index'leri ekle
CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "Notification"("category");
CREATE INDEX IF NOT EXISTS "Notification_typeCategory_idx" ON "Notification"("typeCategory");
CREATE INDEX IF NOT EXISTS "Notification_scheduledFor_idx" ON "Notification"("scheduledFor");
```

PostgreSQL'den çıkın:
```sql
\q
```

## Sonra Seed'i Tekrar Çalıştır

```bash
docker compose exec backend node dist/prisma/seed.js
```

