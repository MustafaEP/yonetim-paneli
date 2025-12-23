-- AlterEnum
-- This migration adds new categories to SystemSettingCategory enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "SystemSettingCategory" ADD VALUE IF NOT EXISTS 'MEMBERSHIP';
ALTER TYPE "SystemSettingCategory" ADD VALUE IF NOT EXISTS 'DUES';
ALTER TYPE "SystemSettingCategory" ADD VALUE IF NOT EXISTS 'SECURITY';
ALTER TYPE "SystemSettingCategory" ADD VALUE IF NOT EXISTS 'NOTIFICATION';
ALTER TYPE "SystemSettingCategory" ADD VALUE IF NOT EXISTS 'UI';

