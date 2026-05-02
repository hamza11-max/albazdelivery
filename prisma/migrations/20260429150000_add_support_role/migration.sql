-- AlterEnum: support-desk role (view orders + manage tickets; no financial mutations via UI/API parity)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'SUPPORT'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPPORT';
  END IF;
END $$;
