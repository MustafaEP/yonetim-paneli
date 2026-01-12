-- Migration'ı tamamlamak veya düzeltmek için script
-- Bu script migration'ın kaldığı yerden devam eder veya hataları düzeltir

BEGIN;

-- 1. hasScopeRestriction kolonunu ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CustomRole' AND column_name = 'hasScopeRestriction'
    ) THEN
        ALTER TABLE "CustomRole" ADD COLUMN "hasScopeRestriction" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'hasScopeRestriction kolonu eklendi';
    ELSE
        RAISE NOTICE 'hasScopeRestriction kolonu zaten mevcut';
    END IF;
END $$;

-- 2. CustomRoleScope tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS "CustomRoleScope" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "provinceId" TEXT,
    "districtId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomRoleScope_pkey" PRIMARY KEY ("id")
);

-- 3. PanelUserApplicationScope tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS "PanelUserApplicationScope" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "provinceId" TEXT,
    "districtId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PanelUserApplicationScope_pkey" PRIMARY KEY ("id")
);

-- 4. Index'leri oluştur (eğer yoksa)
CREATE INDEX IF NOT EXISTS "CustomRoleScope_roleId_idx" ON "CustomRoleScope"("roleId");
CREATE INDEX IF NOT EXISTS "CustomRoleScope_provinceId_idx" ON "CustomRoleScope"("provinceId");
CREATE INDEX IF NOT EXISTS "CustomRoleScope_districtId_idx" ON "CustomRoleScope"("districtId");

CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_applicationId_idx" ON "PanelUserApplicationScope"("applicationId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_provinceId_idx" ON "PanelUserApplicationScope"("provinceId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_districtId_idx" ON "PanelUserApplicationScope"("districtId");

-- 5. Unique index'leri oluştur (eğer yoksa ve duplicate yoksa)
-- Önce duplicate'leri temizle
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- CustomRoleScope için duplicate'leri kontrol et ve temizle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CustomRoleScope') THEN
        -- Duplicate kayıtları bul ve sadece birini tut
        WITH duplicates AS (
            SELECT "id",
                   ROW_NUMBER() OVER (
                       PARTITION BY "roleId", "provinceId", "districtId" 
                       ORDER BY "createdAt" DESC
                   ) as rn
            FROM "CustomRoleScope"
        )
        DELETE FROM "CustomRoleScope"
        WHERE "id" IN (
            SELECT "id" FROM duplicates WHERE rn > 1
        );
        
        GET DIAGNOSTICS duplicate_count = ROW_COUNT;
        IF duplicate_count > 0 THEN
            RAISE NOTICE '% duplicate CustomRoleScope kaydı silindi', duplicate_count;
        END IF;
    END IF;
END $$;

-- Unique index'leri oluştur (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'CustomRoleScope_roleId_provinceId_districtId_key'
    ) THEN
        CREATE UNIQUE INDEX "CustomRoleScope_roleId_provinceId_districtId_key" 
        ON "CustomRoleScope"("roleId", "provinceId", "districtId");
        RAISE NOTICE 'CustomRoleScope unique index oluşturuldu';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'PanelUserApplicationScope_applicationId_provinceId_districtId_key'
    ) THEN
        CREATE UNIQUE INDEX "PanelUserApplicationScope_applicationId_provinceId_districtId_key" 
        ON "PanelUserApplicationScope"("applicationId", "provinceId", "districtId");
        RAISE NOTICE 'PanelUserApplicationScope unique index oluşturuldu';
    END IF;
END $$;

-- 6. Veri migration'ı (sadece eski kolonlar varsa ve daha önce migrate edilmemişse)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
    ) THEN
        -- Sadece daha önce migrate edilmemiş kayıtları migrate et
        INSERT INTO "CustomRoleScope" ("id", "roleId", "provinceId", "districtId", "createdAt", "updatedAt")
        SELECT 
            ('crs_' || substr(md5(random()::text || clock_timestamp()::text), 1, 25)) as "id",
            cr."id" as "roleId",
            cr."provinceId",
            cr."districtId",
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM "CustomRole" cr
        WHERE (cr."provinceId" IS NOT NULL OR cr."districtId" IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM "CustomRoleScope" crs
              WHERE crs."roleId" = cr."id"
                AND (crs."provinceId" = cr."provinceId" OR (crs."provinceId" IS NULL AND cr."provinceId" IS NULL))
                AND (crs."districtId" = cr."districtId" OR (crs."districtId" IS NULL AND cr."districtId" IS NULL))
          )
        ON CONFLICT DO NOTHING;
        
        -- hasScopeRestriction'ı güncelle
        UPDATE "CustomRole"
        SET "hasScopeRestriction" = true
        WHERE ("provinceId" IS NOT NULL OR "districtId" IS NOT NULL)
          AND "hasScopeRestriction" = false;
        
        RAISE NOTICE 'Veri migration tamamlandı';
    ELSE
        RAISE NOTICE 'Eski kolonlar zaten silinmiş, veri migration gerekmiyor';
    END IF;
END $$;

-- 7. Foreign key'leri ekle
DO $$
BEGIN
    -- CustomRoleScope foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRoleScope_roleId_fkey') THEN
        ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_roleId_fkey" 
        FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'CustomRoleScope_roleId_fkey eklendi';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRoleScope_provinceId_fkey') THEN
        ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'CustomRoleScope_provinceId_fkey eklendi';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomRoleScope_districtId_fkey') THEN
        ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'CustomRoleScope_districtId_fkey eklendi';
    END IF;

    -- PanelUserApplicationScope foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PanelUserApplication') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_applicationId_fkey') THEN
            ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_applicationId_fkey" 
            FOREIGN KEY ("applicationId") REFERENCES "PanelUserApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            RAISE NOTICE 'PanelUserApplicationScope_applicationId_fkey eklendi';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_provinceId_fkey') THEN
        ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'PanelUserApplicationScope_provinceId_fkey eklendi';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_districtId_fkey') THEN
        ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'PanelUserApplicationScope_districtId_fkey eklendi';
    END IF;
END $$;

-- 8. Eski kolonları ve constraint'leri sil (sadece veri migration tamamlandıysa)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
    ) THEN
        -- Önce constraint'leri sil
        ALTER TABLE "CustomRole" DROP CONSTRAINT IF EXISTS "CustomRole_provinceId_fkey";
        ALTER TABLE "CustomRole" DROP CONSTRAINT IF EXISTS "CustomRole_districtId_fkey";
        
        -- Sonra kolonları sil
        ALTER TABLE "CustomRole" DROP COLUMN IF EXISTS "provinceId";
        ALTER TABLE "CustomRole" DROP COLUMN IF EXISTS "districtId";
        
        RAISE NOTICE 'Eski kolonlar silindi';
    ELSE
        RAISE NOTICE 'Eski kolonlar zaten silinmiş';
    END IF;
END $$;

COMMIT;

-- Sonuçları göster
SELECT 'Migration fix scripti tamamlandı!' as status;

