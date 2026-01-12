-- Fix PanelUserApplicationScope table
-- This table should have been created after PanelUserApplication, but the migration
-- was created earlier. This migration ensures the table exists with correct constraints.

-- Create PanelUserApplicationScope table if it doesn't exist
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_applicationId_idx" ON "PanelUserApplicationScope"("applicationId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_provinceId_idx" ON "PanelUserApplicationScope"("provinceId");
CREATE INDEX IF NOT EXISTS "PanelUserApplicationScope_districtId_idx" ON "PanelUserApplicationScope"("districtId");

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_applicationId_provinceId_districtId_key'
    ) THEN
        CREATE UNIQUE INDEX "PanelUserApplicationScope_applicationId_provinceId_districtId_key" 
        ON "PanelUserApplicationScope"("applicationId", "provinceId", "districtId");
    END IF;
END $$;

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_applicationId_fkey'
    ) THEN
        ALTER TABLE "PanelUserApplicationScope" 
        ADD CONSTRAINT "PanelUserApplicationScope_applicationId_fkey" 
        FOREIGN KEY ("applicationId") REFERENCES "PanelUserApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_provinceId_fkey'
    ) THEN
        ALTER TABLE "PanelUserApplicationScope" 
        ADD CONSTRAINT "PanelUserApplicationScope_provinceId_fkey" 
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PanelUserApplicationScope_districtId_fkey'
    ) THEN
        ALTER TABLE "PanelUserApplicationScope" 
        ADD CONSTRAINT "PanelUserApplicationScope_districtId_fkey" 
        FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

