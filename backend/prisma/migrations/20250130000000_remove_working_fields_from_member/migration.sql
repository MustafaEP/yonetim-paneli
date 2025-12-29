-- AlterTable: Remove workingProvinceId, workingDistrictId, positionTitle, institutionRegNo, workUnit, workUnitAddress from Member
ALTER TABLE "Member" DROP COLUMN IF EXISTS "workingProvinceId";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "workingDistrictId";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "positionTitle";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "institutionRegNo";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "workUnit";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "workUnitAddress";

