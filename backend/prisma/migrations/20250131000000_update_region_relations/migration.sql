-- AlterTable: Institution - Make provinceId nullable and update foreign key constraint names
ALTER TABLE "Institution" ALTER COLUMN "provinceId" DROP NOT NULL;

-- Drop existing foreign key constraints for Institution
ALTER TABLE "Institution" DROP CONSTRAINT IF EXISTS "Institution_provinceId_fkey";
ALTER TABLE "Institution" DROP CONSTRAINT IF EXISTS "Institution_districtId_fkey";

-- Add new foreign key constraints with updated relation names
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Institution_provinceId_fkey'
    ) THEN
        ALTER TABLE "Institution" ADD CONSTRAINT "Institution_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Institution_districtId_fkey'
    ) THEN
        ALTER TABLE "Institution" ADD CONSTRAINT "Institution_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: Branch - Add provinceId and districtId columns
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "provinceId" TEXT;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "districtId" TEXT;

-- CreateIndex: Branch - Add indexes for provinceId and districtId
CREATE INDEX IF NOT EXISTS "Branch_provinceId_idx" ON "Branch"("provinceId");
CREATE INDEX IF NOT EXISTS "Branch_districtId_idx" ON "Branch"("districtId");

-- AddForeignKey: Branch - Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Branch_provinceId_fkey'
    ) THEN
        ALTER TABLE "Branch" ADD CONSTRAINT "Branch_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Branch_districtId_fkey'
    ) THEN
        ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: TevkifatCenter - Update foreign key constraint names
ALTER TABLE "TevkifatCenter" DROP CONSTRAINT IF EXISTS "TevkifatCenter_provinceId_fkey";
ALTER TABLE "TevkifatCenter" DROP CONSTRAINT IF EXISTS "TevkifatCenter_districtId_fkey";

-- AddForeignKey: TevkifatCenter - Add foreign key constraints with updated relation names
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'TevkifatCenter_provinceId_fkey'
    ) THEN
        ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'TevkifatCenter_districtId_fkey'
    ) THEN
        ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

