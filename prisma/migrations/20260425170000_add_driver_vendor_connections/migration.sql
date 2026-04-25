-- Add driver-vendor connection requests used by driver/vendor APIs.
CREATE TABLE "DriverVendorConnection" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DriverVendorConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DriverVendorConnection_driverId_vendorId_key" ON "DriverVendorConnection"("driverId", "vendorId");
CREATE INDEX "DriverVendorConnection_driverId_idx" ON "DriverVendorConnection"("driverId");
CREATE INDEX "DriverVendorConnection_vendorId_idx" ON "DriverVendorConnection"("vendorId");
CREATE INDEX "DriverVendorConnection_status_idx" ON "DriverVendorConnection"("status");

ALTER TABLE "DriverVendorConnection"
  ADD CONSTRAINT "DriverVendorConnection_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DriverVendorConnection"
  ADD CONSTRAINT "DriverVendorConnection_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Store"
  ADD CONSTRAINT "Store_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
