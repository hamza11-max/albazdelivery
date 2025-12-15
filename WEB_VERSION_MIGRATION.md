# Web Version Migration Guide

This document tracks the migration of new features from `apps/vendor/` (Electron) to `app/vendor/` (Web).

## Files to Copy

### Utility Files (utils/)
- [x] backupUtils.ts
- [x] cloudSyncUtils.ts  
- [x] emailUtils.ts
- [x] permissionsUtils.ts
- [x] loyaltyUtils.ts
- [x] inventoryAlertsUtils.ts
- [x] inventoryAlertsChecker.ts

### Tab Components (components/tabs/)
- [x] ReportsTab.tsx
- [x] CouponsTab.tsx
- [x] BackupTab.tsx
- [x] CloudSyncTab.tsx
- [x] EmailTab.tsx
- [x] PermissionsTab.tsx
- [x] LoyaltyTab.tsx
- [x] InventoryAlertsTab.tsx

### Dialog Components (components/dialogs/)
- [x] CouponDialog.tsx
- [x] StaffDialog.tsx

### Other Components (components/)
- [x] DayHoursInput.tsx
- [x] InvoiceView.tsx

## Import Path Changes

When copying files, adjust imports:
- `@/root/hooks/use-toast` → `@/hooks/use-toast`
- `../../utils/...` → `@/utils/...`
- `@/root/components/ui/...` → Keep as is (already correct)

## Integration Steps

1. Copy all utility files to `utils/`
2. Copy all tab components to `components/tabs/`
3. Copy dialog components to `components/dialogs/`
4. Copy other components to `components/`
5. Update `app/vendor/page.tsx` to import and use new tabs
6. Update `components/VendorSidebar.tsx` to add new menu items
7. Update `utils/saleUtils.ts` to include loyalty points integration

## Status

Migration in progress...

