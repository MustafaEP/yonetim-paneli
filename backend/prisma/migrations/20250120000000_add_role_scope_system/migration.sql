-- Add hasScopeRestriction to CustomRole
ALTER TABLE "CustomRole" ADD COLUMN IF NOT EXISTS "hasScopeRestriction" BOOLEAN NOT NULL DEFAULT false;

-- Create CustomRoleScope table
CREATE TABLE IF NOT EXISTS "CustomRoleScope" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "provinceId" TEXT,
    "districtId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRoleScope_pkey" PRIMARY KEY ("id")
);

-- Create PanelUserApplicationScope table
CREATE TABLE IF NOT EXISTS "PanelUserApplicationScope" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "provinceId" TEXT,
    "districtId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelUserApplicationScope_pkey" PRIMARY KEY ("id")
);

-- Migrate existing provinceId/districtId from CustomRole to CustomRoleScope
-- If a role has provinceId or districtId, create a CustomRoleScope entry and set hasScopeRestriction to true
-- Note: Using a simple ID generation approach. For production, you might want to use a proper cuid generator.
INSERT INTO "CustomRoleScope" ("id", "roleId", "provinceId", "districtId", "createdAt", "updatedAt")
SELECT 
    ('crs_' || substr(md5(random()::text || clock_timestamp()::text), 1, 25)) as "id",
    "id" as "roleId",
    "provinceId",
    "districtId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "CustomRole"
WHERE ("provinceId" IS NOT NULL OR "districtId" IS NOT NULL);

-- Update hasScopeRestriction for roles that had provinceId or districtId
UPDATE "CustomRole"
SET "hasScopeRestriction" = true
WHERE "provinceId" IS NOT NULL OR "districtId" IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "CustomRoleScope_roleId_idx" ON "CustomRoleScope"("roleId");
CREATE INDEX IF NOT EXISTS "CustomRoleScope_provinceId_idx" ON "CustomRoleScope"("provinceId");
CREATE INDEX IF NOT EXISTS "CustomRoleScope_districtId_idx" ON "CustomRoleScope"("districtId");
CREATE UNIQUE INDEX IF NOT EXISTS "CustomRoleScope_roleId_provinceId_districtId_key" ON "CustomRoleScope"("roleId", "provinceId", "districtId");

CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_applicationId_idx" ON "PanelUserApplicationScope"("applicationId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_provinceId_idx" ON "PanelUserApplicationScope"("provinceId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_districtId_idx" ON "PanelUserApplicationScope"("districtId");
CREATE UNIQUE INDEX IF NOT EXISTS "PanelUserApplicationScope_applicationId_provinceId_districtId_key" ON "PanelUserApplicationScope"("applicationId", "provinceId", "districtId");

-- Add foreign keys
ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRoleScope" ADD CONSTRAINT "CustomRoleScope_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PanelUserApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PanelUserApplicationScope" ADD CONSTRAINT "PanelUserApplicationScope_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old columns from CustomRole (after migration)
ALTER TABLE "CustomRole" DROP CONSTRAINT IF EXISTS "CustomRole_provinceId_fkey";
ALTER TABLE "CustomRole" DROP CONSTRAINT IF EXISTS "CustomRole_districtId_fkey";
ALTER TABLE "CustomRole" DROP COLUMN IF EXISTS "provinceId";
ALTER TABLE "CustomRole" DROP COLUMN IF EXISTS "districtId";

