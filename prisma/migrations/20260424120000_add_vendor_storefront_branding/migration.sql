-- Add vendor-level storefront branding fields (take.app-style subdomain storefront)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "storefrontLogoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "storefrontHeroUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "storefrontTagline" TEXT,
  ADD COLUMN IF NOT EXISTS "storefrontAccentColor" TEXT,
  ADD COLUMN IF NOT EXISTS "storefrontWhatsappPhone" TEXT;
