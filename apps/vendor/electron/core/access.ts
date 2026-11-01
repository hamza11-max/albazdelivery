import type { ChannelName } from '../shared/ipc'

/**
 * Who may call each IPC channel (spec §8 permission matrix, vendor-staff-access names).
 * Checked in the main process before input parsing; the renderer hiding a button is only UX.
 * - public:  before sign-in (setup, PIN screen, language)
 * - user:    any signed-in user (owner, manager or cashier)
 * - manager: the owner or a manager (catalog, stock, customers' books, suppliers)
 * - owner:   the owner only (users, shop, settings, printers, credit corrections)
 * Every channel must be listed: TypeScript fails the build otherwise.
 */
export type Access = 'public' | 'user' | 'manager' | 'owner'

export const ACCESS: Record<ChannelName, Access> = {
  'app:info': 'public',
  'settings:get': 'public',
  'settings:setLanguage': 'public',
  'auth:status': 'public',
  'auth:setup': 'public',
  'auth:users': 'public',
  'auth:login': 'public',
  'auth:logout': 'user',

  'shop:get': 'user',
  'shop:save': 'owner',
  'users:list': 'owner',
  'users:save': 'owner',
  'users:setActive': 'owner',

  // Everyone can look products up; the owner and managers change the catalog (inventory.mutate).
  'catalog:categories': 'user',
  'catalog:products': 'user',
  'catalog:product': 'user',
  'catalog:findByCode': 'user',
  'catalog:variantInfo': 'user',
  'catalog:items': 'user',
  'catalog:saveItem': 'manager',
  'catalog:archiveItem': 'manager',
  'catalog:saveCategory': 'manager',
  'catalog:archiveCategory': 'manager',
  'catalog:saveProduct': 'manager',
  'catalog:archiveProduct': 'manager',
  'catalog:newBarcode': 'manager',
  'import:template': 'manager',
  'import:preview': 'manager',
  'import:commit': 'manager',
  'labels:preview': 'manager',
  'labels:print': 'manager',
  'labels:assignBarcodes': 'manager',

  // Stock: anyone sees what is low; deliveries, counts and history are inventory.mutate.
  'stock:adjust': 'manager',
  'stock:receive': 'manager',
  'stock:low': 'user',
  'stock:movements': 'manager',
  'stock:countOpen': 'manager',
  'stock:countStart': 'manager',
  'stock:countSet': 'manager',
  'stock:countFinish': 'manager',
  'stock:countCancel': 'manager',

  // Customers (customers.create / customers.view): cashiers pick or add a customer at the till
  // and take debt payments; correcting a balance by hand is the owner's.
  'customers:list': 'user',
  'customers:get': 'user',
  'customers:save': 'user',
  'customers:archive': 'manager',
  'customers:ledger': 'user',
  'customers:pay': 'user',
  'customers:adjust': 'owner',
  // Reports: margins and costs are the owner's and managers' (sales.view).
  'reports:period': 'manager',
  // Suppliers (suppliers.mutate).
  'suppliers:list': 'manager',
  'suppliers:save': 'manager',
  'suppliers:archive': 'manager',

  // Selling and the cash drawer: any signed-in user. Discounts above the cap
  // need the owner's PIN inside sell:complete.
  'sell:complete': 'user',
  'sell:printReceipt': 'user',
  'sell:hold': 'user',
  'sell:held': 'user',
  'sell:recall': 'user',
  'shift:status': 'user',
  'shift:open': 'user',
  'shift:cash': 'user',
  'shift:close': 'user',
  'sales:history': 'user',
  'sales:detail': 'user',
  'sales:findByNumber': 'user',
  'sales:recent': 'user',
  // Cashiers void (same shift) and take late returns only with an owner's PIN, checked in SalesService.
  'sales:void': 'user',
  'sales:return': 'user',
  'shift:printZ': 'user',
  'settings:sales': 'user',
  'settings:saveSales': 'owner',

  // Printer test lives in Settings (owner).
  'print:printers': 'owner',
  'print:preview': 'owner',
  'print:raster': 'owner',
  'print:driver': 'owner',
  'print:drawer': 'owner',
}
