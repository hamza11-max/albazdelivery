-- Vendor-controlled dispatch availability for connected drivers
ALTER TABLE "DriverVendorConnection"
ADD COLUMN "availableForDispatch" BOOLEAN NOT NULL DEFAULT true;
