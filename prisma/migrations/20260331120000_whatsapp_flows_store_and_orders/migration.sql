-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('APP', 'WHATSAPP');

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN "allowedSources" JSONB;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "whatsappPhoneNumberId" TEXT;
ALTER TABLE "Store" ADD COLUMN "whatsappBusinessAccountId" TEXT;
ALTER TABLE "Store" ADD COLUMN "whatsappAccessToken" TEXT;
ALTER TABLE "Store" ADD COLUMN "whatsappOnboardingStatus" TEXT;

CREATE UNIQUE INDEX "Store_whatsappPhoneNumberId_key" ON "Store"("whatsappPhoneNumberId");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderSource" "OrderSource" NOT NULL DEFAULT 'APP';

CREATE INDEX "Order_orderSource_idx" ON "Order"("orderSource");

-- CreateTable
CREATE TABLE "WhatsAppWebhookEvent" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppWebhookEvent_messageId_key" ON "WhatsAppWebhookEvent"("messageId");
