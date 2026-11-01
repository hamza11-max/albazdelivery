import type { ChannelName } from '../shared/ipc'

/**
 * Who may call each IPC channel (spec §8 permission matrix). Checked in the
 * main process before input parsing; the renderer hiding a button is only UX.
 * - public: before sign-in (setup, PIN screen, language)
 * - user:   any signed-in user (owner or cashier)
 * - owner:  the owner only
 * Every channel must be listed: TypeScript fails the build otherwise.
 */
export type Access = 'public' | 'user' | 'owner'

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

  // Cashiers can look products up; only the owner changes the catalog.
  'catalog:categories': 'user',
  'catalog:products': 'user',
  'catalog:product': 'user',
  'catalog:findByCode': 'user',
  'catalog:variantInfo': 'user',
  'catalog:items': 'user',
  'catalog:saveItem': 'owner',
  'catalog:archiveItem': 'owner',
  'stock:adjust': 'owner',
  'sales:recent': 'user',
  // Stock: anyone can see what is low; deliveries, counts and history are the owner's.
  'stock:receive': 'owner',
  'stock:low': 'user',
  'stock:movements': 'owner',
  'stock:countOpen': 'owner',
  'stock:countStart': 'owner',
  'stock:countSet': 'owner',
  'stock:countFinish': 'owner',
  'stock:countCancel': 'owner',
  'catalog:saveCategory': 'owner',
  'catalog:archiveCategory': 'owner',
  'catalog:saveProduct': 'owner',
  'catalog:archiveProduct': 'owner',
  'catalog:newBarcode': 'owner',
  'import:template': 'owner',
  'import:preview': 'owner',
  'import:commit': 'owner',
  'labels:preview': 'owner',
  'labels:print': 'owner',
  'labels:assignBarcodes': 'owner',

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
