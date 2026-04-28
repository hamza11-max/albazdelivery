-- Phase 1: vendor staff server linkage + Stripe refund id on Refund

CREATE TYPE "VendorStaffRole" AS ENUM ('MANAGER', 'CASHIER');

CREATE TABLE "VendorStaffMember" (
    "id" TEXT NOT NULL,
    "vendorOwnerId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "role" "VendorStaffRole" NOT NULL DEFAULT 'CASHIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorStaffMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorStaffMember_staffUserId_key" ON "VendorStaffMember"("staffUserId");

CREATE UNIQUE INDEX "VendorStaffMember_vendorOwnerId_staffUserId_key" ON "VendorStaffMember"("vendorOwnerId", "staffUserId");

CREATE INDEX "VendorStaffMember_vendorOwnerId_idx" ON "VendorStaffMember"("vendorOwnerId");

ALTER TABLE "VendorStaffMember" ADD CONSTRAINT "VendorStaffMember_vendorOwnerId_fkey" FOREIGN KEY ("vendorOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorStaffMember" ADD CONSTRAINT "VendorStaffMember_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Refund" ADD COLUMN "stripeRefundId" TEXT;

CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");
