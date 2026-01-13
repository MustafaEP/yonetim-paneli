-- Make Member.branchId optional so that branch can be left empty on member application.
-- This is safe for existing data because we only relax the NOT NULL constraint.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Member'
      AND column_name = 'branchId'
  ) THEN
    EXECUTE 'ALTER TABLE "Member" ALTER COLUMN "branchId" DROP NOT NULL';
  END IF;
END $$;



