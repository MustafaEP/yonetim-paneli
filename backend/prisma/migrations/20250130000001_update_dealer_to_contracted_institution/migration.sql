-- Update MemberSource enum: DEALER -> CONTRACTED_INSTITUTION
-- First, add the new enum value
ALTER TYPE "MemberSource" ADD VALUE IF NOT EXISTS 'CONTRACTED_INSTITUTION';

-- Update existing data from DEALER to CONTRACTED_INSTITUTION
UPDATE "Member" SET "source" = 'CONTRACTED_INSTITUTION' WHERE "source" = 'DEALER';

-- Note: We cannot remove the old DEALER value from enum in PostgreSQL
-- It will remain in the enum but won't be used

