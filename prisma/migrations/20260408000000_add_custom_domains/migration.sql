-- 1) Enum
DO $$ BEGIN
  CREATE TYPE "DomainStatus" AS ENUM ('PENDING','VERIFIED','FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) User columns (vendor-level)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "vendorSubdomain" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorCustomDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorDomainStatus" "DomainStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "vendorDomainVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorDomainVerifiedAt" TIMESTAMP(3);

-- 3) Store columns (store-level)
ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS "subdomain" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "domainStatus" "DomainStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "domainVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "domainVerifiedAt" TIMESTAMP(3);

-- 4) Uniques
CREATE UNIQUE INDEX IF NOT EXISTS "User_vendorSubdomain_key" ON "User"("vendorSubdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "User_vendorCustomDomain_key" ON "User"("vendorCustomDomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_subdomain_key" ON "Store"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_customDomain_key" ON "Store"("customDomain");

-- 5) Lookup indexes
CREATE INDEX IF NOT EXISTS "User_vendorCustomDomain_idx" ON "User"("vendorCustomDomain");
CREATE INDEX IF NOT EXISTS "User_vendorSubdomain_idx" ON "User"("vendorSubdomain");
CREATE INDEX IF NOT EXISTS "Store_customDomain_idx" ON "Store"("customDomain");
CREATE INDEX IF NOT EXISTS "Store_subdomain_idx" ON "Store"("subdomain");
