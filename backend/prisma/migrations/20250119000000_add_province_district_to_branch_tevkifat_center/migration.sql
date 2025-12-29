-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "provinceId" TEXT,
ADD COLUMN     "districtId" TEXT;

-- AlterTable
ALTER TABLE "TevkifatCenter" ADD COLUMN     "provinceId" TEXT,
ADD COLUMN     "districtId" TEXT;

-- CreateIndex
CREATE INDEX "Branch_provinceId_idx" ON "Branch"("provinceId");

-- CreateIndex
CREATE INDEX "Branch_districtId_idx" ON "Branch"("districtId");

-- CreateIndex
CREATE INDEX "TevkifatCenter_provinceId_idx" ON "TevkifatCenter"("provinceId");

-- CreateIndex
CREATE INDEX "TevkifatCenter_districtId_idx" ON "TevkifatCenter"("districtId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

