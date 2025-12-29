-- AlterTable
ALTER TABLE "TevkifatCenter" ADD COLUMN IF NOT EXISTS "provinceId" TEXT;
ALTER TABLE "TevkifatCenter" ADD COLUMN IF NOT EXISTS "districtId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TevkifatCenter_provinceId_idx" ON "TevkifatCenter"("provinceId");
CREATE INDEX IF NOT EXISTS "TevkifatCenter_districtId_idx" ON "TevkifatCenter"("districtId");

-- AddForeignKey (IF NOT EXISTS constraint için DO block kullanıyoruz)
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

