-- Who initiated a driver-vendor connection (vendor UI vs driver app).
CREATE TYPE "DriverVendorConnectionSource" AS ENUM ('DRIVER_REQUESTED', 'VENDOR_INVITED');

ALTER TABLE "DriverVendorConnection"
ADD COLUMN "connectionSource" "DriverVendorConnectionSource" NOT NULL DEFAULT 'DRIVER_REQUESTED';
