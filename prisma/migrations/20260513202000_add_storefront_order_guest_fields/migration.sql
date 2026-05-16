-- Storefront guest checkout contact fields.
-- These keep client-provided details typed instead of packing notes into deliveryAddress.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "clientName" TEXT,
  ADD COLUMN IF NOT EXISTS "clientPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "clientAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;
