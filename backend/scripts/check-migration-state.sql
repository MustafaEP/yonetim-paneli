-- Migration durumunu kontrol etmek için script
-- Bu script'i çalıştırarak migration'ın hangi aşamada kaldığını görebilirsiniz

-- 1. CustomRole tablosunda hasScopeRestriction kolonu var mı?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'hasScopeRestriction'
        ) THEN '✓ hasScopeRestriction kolonu mevcut'
        ELSE '✗ hasScopeRestriction kolonu YOK'
    END as check_hasScopeRestriction;

-- 2. CustomRole tablosunda eski kolonlar (provinceId, districtId) var mı?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
        ) THEN '✓ provinceId kolonu HALA VAR (silinmemiş)'
        ELSE '✓ provinceId kolonu silinmiş'
    END as check_provinceId,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'districtId'
        ) THEN '✓ districtId kolonu HALA VAR (silinmemiş)'
        ELSE '✓ districtId kolonu silinmiş'
    END as check_districtId;

-- 3. CustomRoleScope tablosu var mı?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'CustomRoleScope'
        ) THEN '✓ CustomRoleScope tablosu mevcut'
        ELSE '✗ CustomRoleScope tablosu YOK'
    END as check_CustomRoleScope_table;

-- 4. PanelUserApplicationScope tablosu var mı?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'PanelUserApplicationScope'
        ) THEN '✓ PanelUserApplicationScope tablosu mevcut'
        ELSE '✗ PanelUserApplicationScope tablosu YOK'
    END as check_PanelUserApplicationScope_table;

-- 5. CustomRoleScope'da kaç kayıt var?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CustomRoleScope')
        THEN (SELECT COUNT(*)::text || ' kayıt var' FROM "CustomRoleScope")
        ELSE 'Tablo yok'
    END as CustomRoleScope_count;

-- 6. CustomRole'de migrate edilmesi gereken kayıtlar var mı?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CustomRole' AND column_name = 'provinceId'
        )
        THEN (
            SELECT COUNT(*)::text || ' CustomRole kaydı migrate edilmeyi bekliyor (provinceId veya districtId var)'
            FROM "CustomRole"
            WHERE "provinceId" IS NOT NULL OR "districtId" IS NOT NULL
        )
        ELSE 'Eski kolonlar zaten silinmiş'
    END as pending_migrations;

-- 7. Foreign key'ler var mı?
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name
FROM pg_constraint
WHERE conname IN (
    'CustomRoleScope_roleId_fkey',
    'CustomRoleScope_provinceId_fkey',
    'CustomRoleScope_districtId_fkey',
    'PanelUserApplicationScope_applicationId_fkey',
    'PanelUserApplicationScope_provinceId_fkey',
    'PanelUserApplicationScope_districtId_fkey'
)
ORDER BY conname;

