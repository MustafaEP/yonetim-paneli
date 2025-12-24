-- Migration: Add AUDIT category to SystemSettingCategory enum
-- This migration adds the AUDIT category to the SystemSettingCategory enum

-- Add AUDIT value to SystemSettingCategory enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'AUDIT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SystemSettingCategory')
  ) THEN
    ALTER TYPE "SystemSettingCategory" ADD VALUE 'AUDIT';
  END IF;
END $$;

