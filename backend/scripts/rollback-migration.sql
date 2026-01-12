-- Migration'ı geri almak için script (sadece gerekirse kullanın)
-- DİKKAT: Bu script migration'ı tamamen geri alır!

BEGIN;

-- 1. CustomRoleScope tablosundaki verileri geri taşı (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CustomRoleScope') THEN
        -- Önce CustomRole'a kolonları geri ekle (eğer yoksa)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
        ) THEN
            ALTER TABLE "CustomRole" ADD COLUMN "provinceId" TEXT;
            ALTER TABLE "CustomRole" ADD COLUMN "districtId" TEXT;
        END IF;
        
        -- Verileri geri taşı (her role için ilk scope'u al)
        UPDATE "CustomRole" cr
        SET 
            "provinceId" = crs."provinceId",
            "districtId" = crs."districtId"
        FROM (
            SELECT DISTINCT ON ("roleId") 
                "roleId", "provinceId", "districtId"
            FROM "CustomRoleScope"
            WHERE "deletedAt" IS NULL
            ORDER BY "roleId", "createdAt" DESC
        ) crs
        WHERE cr."id" = crs."roleId";
        
        RAISE NOTICE 'Veriler CustomRole tablosuna geri taşındı';
    END IF;
END $$;

-- 2. Foreign key'leri sil
ALTER TABLE "CustomRoleScope" DROP CONSTRAINT IF EXISTS "CustomRoleScope_roleId_fkey";
ALTER TABLE "CustomRoleScope" DROP CONSTRAINT IF EXISTS "CustomRoleScope_provinceId_fkey";
ALTER TABLE "CustomRoleScope" DROP CONSTRAINT IF EXISTS "CustomRoleScope_districtId_fkey";
ALTER TABLE "PanelUserApplicationScope" DROP CONSTRAINT IF EXISTS "PanelUserApplicationScope_applicationId_fkey";
ALTER TABLE "PanelUserApplicationScope" DROP CONSTRAINT IF EXISTS "PanelUserApplicationScope_provinceId_fkey";
ALTER TABLE "PanelUserApplicationScope" DROP CONSTRAINT IF EXISTS "PanelUserApplicationScope_districtId_fkey";

-- 3. Index'leri sil
DROP INDEX IF EXISTS "CustomRoleScope_roleId_provinceId_districtId_key";
DROP INDEX IF EXISTS "CustomRoleScope_roleId_idx";
DROP INDEX IF EXISTS "CustomRoleScope_provinceId_idx";
DROP INDEX IF EXISTS "CustomRoleScope_districtId_idx";
DROP INDEX IF EXISTS "PanelUserApplicationScope_applicationId_provinceId_districtId_key";
DROP INDEX IF EXISTS "PanelUserApplicationScope_applicationId_idx";
DROP INDEX IF EXISTS "PanelUserApplicationScope_provinceId_idx";
DROP INDEX IF EXISTS "PanelUserApplicationScope_districtId_idx";

-- 4. Tabloları sil
DROP TABLE IF EXISTS "CustomRoleScope";
DROP TABLE IF EXISTS "PanelUserApplicationScope";

-- 5. hasScopeRestriction kolonunu sil
ALTER TABLE "CustomRole" DROP COLUMN IF EXISTS "hasScopeRestriction";

-- 6. Eski foreign key'leri geri ekle (eğer Province ve District tabloları varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Province') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
        ) THEN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRole_provinceId_fkey') THEN
                ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_provinceId_fkey" 
                FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'District') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'districtId'
        ) THEN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRole_districtId_fkey') THEN
                ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_districtId_fkey" 
                FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

COMMIT;

SELECT 'Rollback tamamlandı!' as status;

