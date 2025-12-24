-- Migration: Comprehensive Notification System
-- Bu migration mevcut Notification tablosunu genişletir ve yeni tablolar ekler

-- 1. NotificationStatus enum'unu oluştur (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationStatus') THEN
    CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
END $$;

-- 2. Yeni Enum'ları oluştur
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationCategory') THEN
    CREATE TYPE "NotificationCategory" AS ENUM ('SYSTEM', 'FINANCIAL', 'ANNOUNCEMENT', 'REMINDER');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationTypeCategory') THEN
    CREATE TYPE "NotificationTypeCategory" AS ENUM (
  -- Sistem Bildirimleri
  'MEMBER_APPLICATION_NEW',
  'MEMBER_APPLICATION_APPROVED',
  'MEMBER_APPLICATION_REJECTED',
  'ROLE_CHANGED',
  'SCOPE_ASSIGNED',
  'PASSWORD_RESET',
  'ACCOUNT_ACTIVATED',
  'ACCOUNT_DEACTIVATED',
  -- Mali Bildirimler
  'DUES_PAYMENT_RECEIVED',
  'DUES_OVERDUE',
  'DUES_BULK_REPORT_READY',
  'ACCOUNTING_APPROVAL_PENDING',
  -- Duyuru Bildirimleri
  'ANNOUNCEMENT_GENERAL',
  'ANNOUNCEMENT_REGIONAL',
  'ANNOUNCEMENT_WORKPLACE',
  'ANNOUNCEMENT_ELECTION',
  -- Hatırlatmalar
  'REMINDER_DUES_PAYMENT',
  'REMINDER_DOCUMENT_MISSING',
  'REMINDER_REPRESENTATIVE_TERM_EXPIRING',
  'REMINDER_PENDING_APPROVAL'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');
  END IF;
END $$;

-- 3. NotificationStatus enum'una yeni değerler ekle (eğer yoksa)
-- PostgreSQL'de enum'a değer ekleme
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SENDING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationStatus')) THEN
    ALTER TYPE "NotificationStatus" ADD VALUE 'SENDING';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PARTIALLY_SENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationStatus')) THEN
    ALTER TYPE "NotificationStatus" ADD VALUE 'PARTIALLY_SENT';
  END IF;
END $$;

-- 4. NotificationTargetType enum'unu oluştur (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationTargetType') THEN
    CREATE TYPE "NotificationTargetType" AS ENUM ('ALL_MEMBERS', 'REGION', 'SCOPE', 'USER');
  END IF;
END $$;

-- 5. NotificationTargetType enum'una ROLE ekle
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ROLE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationTargetType')) THEN
    ALTER TYPE "NotificationTargetType" ADD VALUE 'ROLE';
  END IF;
END $$;

-- 6. Notification tablosuna yeni kolonlar ekle
ALTER TABLE "Notification" 
  ADD COLUMN IF NOT EXISTS "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN IF NOT EXISTS "typeCategory" "NotificationTypeCategory",
  ADD COLUMN IF NOT EXISTS "channels" "NotificationChannel"[] NOT NULL DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
  ADD COLUMN IF NOT EXISTS "targetRole" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "actionUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "actionLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. Eski 'type' kolonundaki verileri 'channels' array'ine dönüştür
-- Eğer type = EMAIL ise channels = [EMAIL], type = SMS ise channels = [SMS] vs.
UPDATE "Notification" 
SET channels = CASE 
  WHEN "type" = 'EMAIL' THEN ARRAY['EMAIL']::"NotificationChannel"[]
  WHEN "type" = 'SMS' THEN ARRAY['SMS']::"NotificationChannel"[]
  WHEN "type" = 'WHATSAPP' THEN ARRAY['WHATSAPP']::"NotificationChannel"[]
  WHEN "type" = 'IN_APP' THEN ARRAY['IN_APP']::"NotificationChannel"[]
  ELSE ARRAY['IN_APP']::"NotificationChannel"[]
END
WHERE "type" IS NOT NULL;

-- 8. Notification tablosundan eski 'type' kolonunu kaldır (artık kullanılmıyor)
-- ÖNEMLİ: Bu adımı yapmadan önce tüm verilerin dönüştürüldüğünden emin olun
-- ALTER TABLE "Notification" DROP COLUMN IF EXISTS "type";

-- 9. Notification tablosuna index'ler ekle
CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "Notification"("category");
CREATE INDEX IF NOT EXISTS "Notification_typeCategory_idx" ON "Notification"("typeCategory");
CREATE INDEX IF NOT EXISTS "Notification_scheduledFor_idx" ON "Notification"("scheduledFor");

-- 10. NotificationRecipient tablosunu oluştur
CREATE TABLE IF NOT EXISTS "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT,
    "memberId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- 11. NotificationRecipient foreign key ve index'ler
CREATE INDEX IF NOT EXISTS "NotificationRecipient_notificationId_idx" ON "NotificationRecipient"("notificationId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_userId_idx" ON "NotificationRecipient"("userId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_memberId_idx" ON "NotificationRecipient"("memberId");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_status_idx" ON "NotificationRecipient"("status");
CREATE INDEX IF NOT EXISTS "NotificationRecipient_channel_idx" ON "NotificationRecipient"("channel");

ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" 
    FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. NotificationLog tablosunu oluştur
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "action" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "errorDetails" JSONB,
    "providerResponse" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- 13. NotificationLog foreign key ve index'ler
CREATE INDEX IF NOT EXISTS "NotificationLog_notificationId_idx" ON "NotificationLog"("notificationId");
CREATE INDEX IF NOT EXISTS "NotificationLog_recipientId_idx" ON "NotificationLog"("recipientId");
CREATE INDEX IF NOT EXISTS "NotificationLog_channel_idx" ON "NotificationLog"("channel");
CREATE INDEX IF NOT EXISTS "NotificationLog_action_idx" ON "NotificationLog"("action");
CREATE INDEX IF NOT EXISTS "NotificationLog_status_idx" ON "NotificationLog"("status");
CREATE INDEX IF NOT EXISTS "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_notificationId_fkey" 
    FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_recipientId_fkey" 
    FOREIGN KEY ("recipientId") REFERENCES "NotificationRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 14. Notification tablosuna NotificationRecipient ve NotificationLog ilişkileri için trigger eklemek gerekmez (Prisma bunları yönetir)

-- 15. UserNotification tablosunu güncelle (zaten var ama index ekleyelim)
CREATE INDEX IF NOT EXISTS "UserNotification_createdAt_idx" ON "UserNotification"("createdAt");

-- 16. UserNotificationSettings tablosunu oluştur
CREATE TABLE IF NOT EXISTS "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "systemNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "financialNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "typeCategorySettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserNotificationSettings_userId_key" UNIQUE ("userId")
);

-- 17. UserNotificationSettings foreign key ve index
CREATE INDEX IF NOT EXISTS "UserNotificationSettings_userId_idx" ON "UserNotificationSettings"("userId");

ALTER TABLE "UserNotificationSettings" ADD CONSTRAINT "UserNotificationSettings_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

