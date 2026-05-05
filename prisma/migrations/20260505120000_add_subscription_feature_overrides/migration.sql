-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "featureOverrides" JSONB;
