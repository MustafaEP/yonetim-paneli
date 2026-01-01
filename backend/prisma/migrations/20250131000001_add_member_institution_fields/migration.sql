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
ALTER TABLE "Member" ADD COLUMN "dutyUnit" TEXT,
ADD COLUMN "institutionAddress" TEXT,
ADD COLUMN "institutionProvinceId" TEXT,
ADD COLUMN "institutionDistrictId" TEXT,
ADD COLUMN "professionId" TEXT,
ADD COLUMN "institutionRegNo" TEXT,
ADD COLUMN "staffTitleCode" TEXT;

-- CreateIndex
CREATE INDEX "Member_professionId_idx" ON "Member"("professionId");

-- CreateIndex
CREATE INDEX "Member_institutionProvinceId_idx" ON "Member"("institutionProvinceId");

-- CreateIndex
CREATE INDEX "Member_institutionDistrictId_idx" ON "Member"("institutionDistrictId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_institutionProvinceId_fkey" FOREIGN KEY ("institutionProvinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_institutionDistrictId_fkey" FOREIGN KEY ("institutionDistrictId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

