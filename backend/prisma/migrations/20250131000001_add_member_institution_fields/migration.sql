-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profession_name_key" ON "Profession"("name");

-- CreateIndex
CREATE INDEX "Profession_isActive_idx" ON "Profession"("isActive");

-- AlterTable
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "dutyUnit" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "institutionAddress" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "institutionProvinceId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "institutionDistrictId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "professionId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "institutionRegNo" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "staffTitleCode" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Member_professionId_idx" ON "Member"("professionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Member_institutionProvinceId_idx" ON "Member"("institutionProvinceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Member_institutionDistrictId_idx" ON "Member"("institutionDistrictId");

-- AddForeignKey (IF NOT EXISTS constraint için DO block kullanıyoruz)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Member_professionId_fkey'
    ) THEN
        ALTER TABLE "Member" ADD CONSTRAINT "Member_professionId_fkey" 
        FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Member_institutionProvinceId_fkey'
    ) THEN
        ALTER TABLE "Member" ADD CONSTRAINT "Member_institutionProvinceId_fkey" 
        FOREIGN KEY ("institutionProvinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Member_institutionDistrictId_fkey'
    ) THEN
        ALTER TABLE "Member" ADD CONSTRAINT "Member_institutionDistrictId_fkey" 
        FOREIGN KEY ("institutionDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

