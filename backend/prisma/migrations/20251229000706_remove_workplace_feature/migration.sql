-- AlterEnum: Remove WORKPLACE from MemberSource enum
-- First, update existing records that use WORKPLACE to DIRECT
UPDATE "Member" SET "source" = 'DIRECT' WHERE "source" = 'WORKPLACE';

-- AlterEnum requires creating new enum type without WORKPLACE
CREATE TYPE "MemberSource_new" AS ENUM ('DIRECT', 'OTHER');
ALTER TABLE "Member" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "Member" ALTER COLUMN "source" TYPE "MemberSource_new" USING ("source"::text::"MemberSource_new");
ALTER TYPE "MemberSource" RENAME TO "MemberSource_old";
ALTER TYPE "MemberSource_new" RENAME TO "MemberSource";
DROP TYPE "MemberSource_old";
ALTER TABLE "Member" ALTER COLUMN "source" SET DEFAULT 'DIRECT';

-- AlterEnum: Remove ISYERI_TEMSILCISI from Role enum
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'MODERATOR', 'GENEL_BASKAN', 'GENEL_BASKAN_YRD', 'GENEL_SEKRETER', 'IL_BASKANI', 'ILCE_TEMSILCISI', 'UYE');
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- AlterEnum: Remove ANNOUNCEMENT_WORKPLACE from NotificationTypeCategory enum
CREATE TYPE "NotificationTypeCategory_new" AS ENUM (
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
  'ANNOUNCEMENT_ELECTION',
  'REMINDER_DUES_PAYMENT',
  'REMINDER_DOCUMENT_MISSING',
  'REMINDER_REPRESENTATIVE_TERM_EXPIRING',
  'REMINDER_PENDING_APPROVAL'
);

-- Update any existing records that use ANNOUNCEMENT_WORKPLACE
UPDATE "Notification" SET "typeCategory" = 'ANNOUNCEMENT_GENERAL' WHERE "typeCategory" = 'ANNOUNCEMENT_WORKPLACE';

ALTER TABLE "Notification" ALTER COLUMN "typeCategory" DROP DEFAULT;
ALTER TABLE "Notification" ALTER COLUMN "typeCategory" TYPE "NotificationTypeCategory_new" USING ("typeCategory"::text::"NotificationTypeCategory_new");
ALTER TYPE "NotificationTypeCategory" RENAME TO "NotificationTypeCategory_old";
ALTER TYPE "NotificationTypeCategory_new" RENAME TO "NotificationTypeCategory";
DROP TYPE "NotificationTypeCategory_old";

-- DropForeignKey: Remove workplace foreign key from UserScope
ALTER TABLE "UserScope" DROP CONSTRAINT IF EXISTS "UserScope_workplaceId_fkey";

-- AlterTable: Remove workplaceId from UserScope
ALTER TABLE "UserScope" DROP COLUMN IF EXISTS "workplaceId";

-- DropTable: Drop Workplace table
DROP TABLE IF EXISTS "Workplace" CASCADE;

