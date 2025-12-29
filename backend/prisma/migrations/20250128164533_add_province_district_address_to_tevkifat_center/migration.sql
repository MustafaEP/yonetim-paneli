-- AlterTable
ALTER TABLE "TevkifatCenter" ADD COLUMN "provinceId" TEXT;
ALTER TABLE "TevkifatCenter" ADD COLUMN "districtId" TEXT;
ALTER TABLE "TevkifatCenter" ADD COLUMN "address" TEXT;

-- CreateIndex
CREATE INDEX "TevkifatCenter_provinceId_idx" ON "TevkifatCenter"("provinceId");
CREATE INDEX "TevkifatCenter_districtId_idx" ON "TevkifatCenter"("districtId");

-- AddForeignKey
ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TevkifatCenter" ADD CONSTRAINT "TevkifatCenter_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

