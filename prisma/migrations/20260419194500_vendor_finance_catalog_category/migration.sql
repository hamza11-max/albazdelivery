-- CreateTable
CREATE TABLE "VendorPayout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "feesAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "etaLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDispute" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "orderId" TEXT,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "iconImage" TEXT,
    "color" TEXT NOT NULL,
    "iconColor" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_slug_key" ON "CatalogCategory"("slug");

-- CreateIndex
CREATE INDEX "CatalogCategory_isActive_idx" ON "CatalogCategory"("isActive");

-- CreateIndex
CREATE INDEX "CatalogCategory_sortOrder_idx" ON "CatalogCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "VendorPayout_vendorId_idx" ON "VendorPayout"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDispute_vendorId_idx" ON "VendorDispute"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDispute_payoutId_idx" ON "VendorDispute"("payoutId");

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDispute" ADD CONSTRAINT "VendorDispute_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDispute" ADD CONSTRAINT "VendorDispute_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "VendorPayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
