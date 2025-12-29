-- AlterTable
ALTER TABLE "Branch" DROP CONSTRAINT IF EXISTS "Branch_provinceId_fkey";
ALTER TABLE "Branch" DROP CONSTRAINT IF EXISTS "Branch_districtId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Branch_provinceId_idx";
DROP INDEX IF EXISTS "Branch_districtId_idx";

-- AlterTable
ALTER TABLE "Branch" DROP COLUMN IF EXISTS "provinceId";
ALTER TABLE "Branch" DROP COLUMN IF EXISTS "districtId";

