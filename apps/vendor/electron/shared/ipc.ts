/**
 * The IPC contract between the renderer and the main process. Every channel is
 * declared here once: its input schema (checked in main before any handler
 * runs) and its result type. Renderer code imports this file with
 * `import type` only, so zod is not bundled into the UI.
 */
import { z } from 'zod'

import { LABEL_LAYOUTS } from './constants'

export const LANGUAGES = ['ar', 'fr'] as const
export type Language = (typeof LANGUAGES)[number]

const HOST_RE = /^(?:[a-zA-Z0-9-]{1,63}\.)*[a-zA-Z0-9-]{1,63}$|^\d{1,3}(?:\.\d{1,3}){3}$/
// eslint-disable-next-line no-control-regex
const printerName = z.string().min(1).max(256).regex(/^[^\u0000-\u001f]+$/, 'invalid printer name')

const receiptOptions = z.object({
  lang: z.enum(['ar', 'fr', 'mixed']),
  paper: z.union([z.literal(58), z.literal(80)]),
})

const rawTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('windows'), printer: printerName }),
  z.object({ kind: z.literal('tcp'), host: z.string().regex(HOST_RE, 'invalid host'), port: z.number().int().min(1).max(65535) }),
])

const id = z.string().uuid()
const pin = z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits')
const money = z.number().int().min(0).max(10_000_000_000)
const price = money.refine((n) => n > 0, 'must be more than 0')
const optText = (max: number) => z.string().trim().max(max).default('')
// Scanner/typed codes: no control characters, no spaces.
// eslint-disable-next-line no-control-regex
const code = z.string().trim().max(48).regex(/^[^\s\u0000-\u001f]*$/, 'no spaces or control characters').default('')

const variantInput = z.object({
  id: id.optional(),
  option1Value: optText(40),
  option2Value: optText(40),
  /** Empty = generate one. */
  sku: code,
  /** Empty = no barcode yet. */
  barcode: code,
  /** null = use the product price. */
  salePrice: price.nullable().default(null),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).nullable().default(null),
})

const stockQty = z.number().int().min(0).max(1_000_000)

/** A vendor-screen item (one variant). Stock, when sent, is the counted quantity: the difference is an ADJUST. */
const flatItemInput = z.object({
  variantId: id.optional(),
  name: z.string().trim().min(1).max(120),
  category: optText(60),
  sku: code,
  barcode: code,
  costPrice: money,
  salePrice: price,
  lowStockThreshold: z.number().int().min(0).max(1_000_000).nullable().default(null),
  stock: stockQty.optional(),
  stockReason: optText(80),
})
export type FlatItemInput = z.output<typeof flatItemInput>

/** A completed sale or return with its lines, shaped for the vendor screens (amounts in DZD). */
export interface RecentSale {
  id: string
  number: string
  type: 'SALE' | 'RETURN'
  createdAt: string
  cashier: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card'
  items: { productId: string; productName: string; quantity: number; price: number; discount: number }[]
}

export interface FlatItem {
  variantId: string
  productId: string
  name: string
  nameAlt: string | null
  variantLabel: string
  /** Name with the size/colour when the product has several. */
  displayName: string
  category: string
  sku: string
  barcode: string
  costPrice: number
  salePrice: number
  stock: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

const productInput = z
  .object({
    id: id.optional(),
    /** Required when updating; a mismatch means someone else changed it. */
    version: z.number().int().min(0).optional(),
    name: z.string().trim().min(1).max(120),
    nameAlt: optText(120),
    categoryId: id.nullable().default(null),
    brand: optText(60),
    costPrice: money,
    salePrice: price,
    option1Name: optText(30),
    option2Name: optText(30),
    variants: z.array(variantInput).min(1).max(200),
  })
  .superRefine((p, ctx) => {
    if (p.id && p.version === undefined) ctx.addIssue({ code: 'custom', path: ['version'], message: 'required when updating' })
    if (!p.option1Name && p.option2Name) ctx.addIssue({ code: 'custom', path: ['option2Name'], message: 'set option 1 first' })
    const combos = new Set<string>()
    const skus = new Set<string>()
    const barcodes = new Set<string>()
    p.variants.forEach((v, i) => {
      if (!p.option1Name && v.option1Value) ctx.addIssue({ code: 'custom', path: ['variants', i, 'option1Value'], message: 'no option 1 on this product' })
      if (!p.option2Name && v.option2Value) ctx.addIssue({ code: 'custom', path: ['variants', i, 'option2Value'], message: 'no option 2 on this product' })
      if (p.option1Name && !v.option1Value) ctx.addIssue({ code: 'custom', path: ['variants', i, 'option1Value'], message: 'required' })
      if (p.option2Name && !v.option2Value) ctx.addIssue({ code: 'custom', path: ['variants', i, 'option2Value'], message: 'required' })
      const combo = `${v.option1Value.toLowerCase()}\u0000${v.option2Value.toLowerCase()}`
      if (combos.has(combo)) ctx.addIssue({ code: 'custom', path: ['variants', i], message: 'duplicate variant' })
      combos.add(combo)
      if (v.sku && skus.has(v.sku)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'duplicate SKU' })
      if (v.sku) skus.add(v.sku)
      if (v.barcode && barcodes.has(v.barcode)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'barcode'], message: 'duplicate barcode' })
      if (v.barcode) barcodes.add(v.barcode)
    })
  })

export { LABEL_LAYOUTS, type LabelLayout } from './constants'

const labelJob = z
  .object({
    items: z.array(z.object({ variantId: id, copies: z.number().int().min(1).max(500) })).min(1).max(500),
    layout: z.enum(LABEL_LAYOUTS),
    /** Labels already used on the first A4 sheet. */
    skip: z.number().int().min(0).max(64).default(0),
    showPrice: z.boolean().default(true),
  })
  .refine((j) => j.items.reduce((s, i) => s + i.copies, 0) <= 2000, { message: 'at most 2000 labels per job', path: ['items'] })

/** What the screen sends for a sale: which variants, how many, which discounts. Never prices. */
const cartInput = z.object({
  lines: z.array(z.object({ variantId: id, qty: z.number().int().min(1).max(9999), lineDiscount: money.default(0) })).min(1).max(200),
  saleDiscount: money.default(0),
  note: z.string().trim().max(60).default(''),
})

const saleInput = z.object({
  /** Generated by the screen: sending the same sale twice records it once. */
  id,
  lines: cartInput.shape.lines,
  saleDiscount: money.default(0),
  tenders: z.array(z.object({ method: z.enum(['CASH', 'CARD_EXTERNAL']), amount: price })).max(4),
  /** Owner PIN when a cashier's discount is above the cap. */
  ownerPin: z.string().regex(/^\d{4,6}$/).optional(),
})

/** A return against an earlier sale: which lines, how many, refunded how. Amounts come from the sale. */
const returnInput = z.object({
  id,
  originalSaleId: id,
  lines: z.array(z.object({ lineId: id, qty: z.number().int().min(1).max(9999) })).min(1).max(200),
  refundMethod: z.enum(['CASH', 'CARD_EXTERNAL']),
  /** Owner PIN when a cashier takes a return after the return window. */
  ownerPin: z.string().regex(/^\d{4,6}$/).optional(),
})

export const inputs = {
  'app:info': z.undefined(),
  'settings:get': z.undefined(),
  'settings:setLanguage': z.object({ lang: z.enum(LANGUAGES) }),
  'print:printers': z.undefined(),
  'print:preview': receiptOptions,
  'print:raster': z.object({ options: receiptOptions, target: rawTarget, openDrawer: z.boolean() }),
  'print:driver': z.object({ options: receiptOptions, printer: printerName }),
  'print:drawer': z.object({ target: rawTarget }),
  'catalog:categories': z.undefined(),
  'catalog:saveCategory': z.object({ id: id.optional(), name: z.string().trim().min(1).max(60) }),
  'catalog:archiveCategory': z.object({ id }),
  'catalog:products': z.object({
    query: z.string().max(100).default(''),
    categoryId: id.nullable().default(null),
    stock: z.enum(['all', 'low', 'out']).default('all'),
    limit: z.number().int().min(1).max(200).default(100),
    offset: z.number().int().min(0).default(0),
  }),
  'catalog:product': z.object({ id }),
  'catalog:saveProduct': productInput,
  'catalog:archiveProduct': z.object({ id }),
  'catalog:findByCode': z.object({ code: z.string().trim().min(1).max(48) }),
  'catalog:newBarcode': z.undefined(),
  'catalog:variantInfo': z.object({ variantIds: z.array(id).min(1).max(200) }),
  // Vendor screens: one flat row per sellable item (see core/catalog/flat.ts).
  'catalog:items': z.undefined(),
  'catalog:saveItem': flatItemInput,
  'catalog:archiveItem': z.object({ variantId: id }),
  'stock:adjust': z.object({ variantId: id, newQty: stockQty, reason: z.string().trim().min(1).max(80) }),
  'sales:recent': z.object({ days: z.number().int().min(1).max(400).default(90) }),
  // The main process shows the file dialogs: the renderer never passes file paths.
  'import:template': z.undefined(),
  'import:preview': z.undefined(),
  'import:commit': z.object({ token: z.string().uuid() }),
  'labels:preview': labelJob,
  'labels:print': labelJob.and(z.object({ printer: printerName })),
  'labels:assignBarcodes': z.object({ variantIds: z.array(id).min(1).max(500) }),
  'auth:status': z.undefined(),
  'auth:setup': z.object({
    shopName: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(30).default(''),
    address: z.string().trim().max(160).default(''),
    lang: z.enum(LANGUAGES),
    ownerName: z.string().trim().min(1).max(40),
    pin,
  }),
  'auth:users': z.undefined(),
  'auth:login': z.object({ userId: id, pin: z.string().max(6) }),
  'auth:logout': z.undefined(),
  'users:list': z.undefined(),
  'users:save': z.object({
    id: id.optional(),
    name: z.string().trim().min(1).max(40),
    role: z.enum(['OWNER', 'CASHIER']),
    /** Required for a new user; on an existing user it resets the PIN. */
    pin: pin.optional(),
  }),
  'users:setActive': z.object({ id, active: z.boolean() }),
  'sell:complete': saleInput,
  'sell:printReceipt': z.object({ saleId: id }),
  'sell:hold': z.object({ cart: cartInput }),
  'sell:held': z.undefined(),
  'sell:recall': z.object({ id }),
  'shift:status': z.undefined(),
  'shift:open': z.object({ openingFloat: money }),
  'shift:cash': z.object({ type: z.enum(['IN', 'OUT']), amount: price, reason: z.string().trim().min(1).max(120) }),
  'shift:close': z.object({ countedCash: money, reason: z.string().trim().max(200).default('') }),
  'sales:history': z.object({
    /** ISO times (local day boundaries computed by the screen). */
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    number: z.string().trim().max(30).optional(),
    userId: id.optional(),
    limit: z.number().int().min(1).max(200).default(100),
    offset: z.number().int().min(0).default(0),
  }),
  'sales:detail': z.object({ id }),
  'sales:findByNumber': z.object({ number: z.string().trim().min(3).max(30) }),
  'sales:void': z.object({ id, reason: z.string().trim().min(1).max(200), ownerPin: z.string().regex(/^\d{4,6}$/).optional() }),
  'sales:return': returnInput,
  'shift:printZ': z.object({ shiftId: id }),
  'settings:sales': z.undefined(),
  'settings:saveSales': z.object({
    cashierDiscountCapPercent: z.number().int().min(0).max(100),
    allowNegativeStock: z.boolean(),
    returnWindowDays: z.number().int().min(0).max(365),
    receipt: z.object({
      printer: z.string().max(256).regex(/^[^\u0000-\u001f]*$/),
      paper: z.union([z.literal(58), z.literal(80)]),
      route: z.enum(['raster', 'driver']),
      lang: z.enum(['ar', 'fr', 'mixed']),
      autoPrint: z.boolean(),
      openDrawer: z.boolean(),
    }),
  }),
  'shop:get': z.undefined(),
  'shop:save': z.object({
    name: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(30).default(''),
    address: z.string().trim().max(160).default(''),
    receiptFooter: z.string().trim().max(300).default(''),
  }),
} as const

export type ChannelName = keyof typeof inputs
export type Inputs = { [K in ChannelName]: z.input<(typeof inputs)[K]> }
export type ReceiptOptions = z.infer<typeof receiptOptions>
export type RawTarget = z.infer<typeof rawTarget>
export type ProductInput = z.output<typeof productInput>
export type ProductQuery = z.output<(typeof inputs)['catalog:products']>

export interface Category {
  id: string
  name: string
  productCount: number
}

export interface ProductSummary {
  id: string
  name: string
  nameAlt: string
  categoryId: string | null
  categoryName: string | null
  brand: string
  minPrice: number
  maxPrice: number
  variantCount: number
  stockTotal: number
  lowStockVariants: number
  outOfStockVariants: number
}

export interface VariantDetail {
  id: string
  option1Value: string
  option2Value: string
  sku: string
  barcode: string
  salePrice: number | null
  stockQty: number
  lowStockThreshold: number | null
}

/** What the Sell screen shows for a cart line. Display only: the sale is priced again in main. */
export interface VariantInfo {
  variantId: string
  name: string
  nameAlt: string
  variantLabel: string
  price: number
  stockQty: number
}

export interface ProductDetail {
  id: string
  version: number
  name: string
  nameAlt: string
  categoryId: string | null
  brand: string
  costPrice: number
  salePrice: number
  option1Name: string
  option2Name: string
  variants: VariantDetail[]
}

export interface AppInfo {
  appVersion: string
  electronVersion: string
  database: {
    path: string
    schemaVersion: number
    migrations: { version: number; name: string; appliedAt: string }[]
  }
}

export interface Outputs {
  'app:info': AppInfo
  'settings:get': { lang: Language }
  'settings:setLanguage': { lang: Language }
  'print:printers': { name: string; displayName: string }[]
  'print:preview': { dataUrl: string; width: number; height: number }
  'print:raster': { bytes: number }
  'print:driver': null
  'print:drawer': null
  'catalog:categories': Category[]
  'catalog:saveCategory': Category
  'catalog:archiveCategory': null
  'catalog:products': { rows: ProductSummary[]; total: number }
  'catalog:product': ProductDetail
  'catalog:saveProduct': ProductDetail
  'catalog:archiveProduct': null
  'catalog:findByCode': { product: ProductDetail; variantId: string } | null
  'catalog:newBarcode': { barcode: string }
  'catalog:variantInfo': VariantInfo[]
  'catalog:items': FlatItem[]
  'catalog:saveItem': FlatItem
  'catalog:archiveItem': null
  'stock:adjust': { stock: number; delta: number }
  'sales:recent': RecentSale[]
  /** null when the dialog was cancelled. */
  'import:template': { path: string } | null
  'import:preview': ImportPreview | null
  'import:commit': { products: number; variants: number; stockUnits: number }
  /** First page as an image; `missingBarcodes` lists variants that would print without bars. */
  'labels:preview': { dataUrl: string; pages: number; labels: number; missingBarcodes: string[] }
  'labels:print': { pages: number; labels: number }
  'labels:assignBarcodes': { assigned: number }
  'auth:status': { setupDone: boolean; shopName: string | null; session: Session | null }
  'auth:setup': Session
  'auth:users': UserSummary[]
  'auth:login': Session
  'auth:logout': null
  'users:list': UserSummary[]
  'users:save': UserSummary
  'users:setActive': null
  'shop:get': ShopInfo
  'shop:save': ShopInfo
  'sell:complete': SaleResult
  'sell:printReceipt': { printed: boolean; reason?: string }
  'sell:hold': { id: string }
  'sell:held': HeldCart[]
  'sell:recall': HeldCart
  'shift:status': ShiftStatus
  'shift:open': ShiftStatus
  'shift:cash': ShiftStatus
  'shift:close': ShiftClosed
  'settings:sales': SalesSettings
  'settings:saveSales': SalesSettings
  'sales:history': { rows: SaleSummaryRow[]; total: number }
  'sales:detail': SaleDetail
  'sales:findByNumber': { id: string } | null
  'sales:void': SaleDetail
  'sales:return': SaleResult
  'shift:printZ': { printed: boolean; reason?: string }
}

export type HistoryQuery = z.output<(typeof inputs)['sales:history']>
export type ReturnInput = z.output<typeof returnInput>

export interface SaleSummaryRow {
  id: string
  number: string
  type: 'SALE' | 'RETURN'
  status: 'COMPLETED' | 'VOIDED'
  createdAt: string
  cashier: string
  total: number
  items: number
  cash: number
  card: number
  originalNumber: string
}

export interface SaleDetail {
  id: string
  number: string
  type: 'SALE' | 'RETURN'
  status: 'COMPLETED' | 'VOIDED'
  createdAt: string
  cashier: string
  subtotal: number
  discountTotal: number
  total: number
  paidTotal: number
  change: number
  lines: {
    lineId: string
    variantId: string
    name: string
    variant: string
    qty: number
    unitPrice: number
    lineDiscount: number
    lineTotal: number
    /** What the customer actually paid for the line (after the sale discount share). */
    net: number
    returnedQty: number
    refunded: number
  }[]
  payments: { method: 'CASH' | 'CARD_EXTERNAL'; amount: number }[]
  voided: { at: string; by: string; reason: string } | null
  originalId: string | null
  originalNumber: string
  returns: { id: string; number: string; createdAt: string; total: number }[]
  canVoid: boolean
  canReturn: boolean
  /** After this, a cashier needs the owner's PIN for a return. */
  returnWindowEnds: string
}

export type SaleInput = z.output<typeof saleInput>
export type CartInput = z.output<typeof cartInput>

/** Everything printed on a sale receipt. Amounts are whole DZD. */
export interface ReceiptData {
  /** A return prints a RETURN header with the original receipt number and a refund line. */
  kind: 'SALE' | 'RETURN'
  originalNumber: string
  shop: { name: string; phone: string; address: string; footer: string }
  number: string
  /** ISO timestamp; printed in the PC's local time. */
  createdAt: string
  cashier: string
  lines: { name: string; nameAlt: string; variant: string; qty: number; unitPrice: number; lineDiscount: number; lineTotal: number }[]
  subtotal: number
  discountTotal: number
  total: number
  /** Cash handed over (before change) and card amount. */
  cashTendered: number
  card: number
  change: number
}

export interface SaleResult {
  saleId: string
  number: string
  total: number
  change: number
  receipt: ReceiptData
}

export interface HeldCart {
  id: string
  createdAt: string
  userName: string
  cart: CartInput
}

export type ShiftStatus =
  | { open: false }
  | {
      open: true
      id: string
      openedAt: string
      openedBy: string
      openingFloat: number
      salesCount: number
      salesTotal: number
      cardTotal: number
      /** Only for the owner: cashiers count blind. */
      expectedCash: number | null
    }

/** End-of-shift report (Z-report). closedAt is empty while the shift is still open. */
export interface ShiftClosed {
  id: string
  openedAt: string
  closedAt: string
  openedBy: string
  closedBy: string
  openingFloat: number
  salesCount: number
  salesTotal: number
  returnsCount: number
  returnsTotal: number
  voidsCount: number
  voidsTotal: number
  cashFromSales: number
  cashRefunds: number
  cardTotal: number
  cashIn: number
  cashOut: number
  expectedCash: number
  countedCash: number
  difference: number
  differenceReason: string
}

export interface SalesSettings {
  cashierDiscountCapPercent: number
  allowNegativeStock: boolean
  /** Days after a sale during which a cashier may take a return without the owner. */
  returnWindowDays: number
  receipt: {
    /** Windows printer name; empty = no receipt printer set up. */
    printer: string
    paper: 58 | 80
    route: 'raster' | 'driver'
    lang: 'ar' | 'fr' | 'mixed'
    autoPrint: boolean
    openDrawer: boolean
  }
}

export type Role = 'OWNER' | 'CASHIER'

export interface Session {
  userId: string
  name: string
  role: Role
  since: string
}

export interface UserSummary {
  id: string
  name: string
  role: Role
  isActive: boolean
}

export interface ShopInfo {
  name: string
  phone: string
  address: string
  receiptFooter: string
}

/** One problem in an imported file. `code` is translated in the UI; `detail` is a value or row number. */
export interface ImportIssue {
  row: number
  code: string
  field?: string
  detail?: string
}

export interface ImportPreview {
  token: string
  fileName: string
  products: number
  variants: number
  newCategories: string[]
  /** First 500 issues; errorCount is the full number. */
  errors: ImportIssue[]
  errorCount: number
  /** Opening stock units in the file (all variants). */
  stockUnits: number
  sample: { name: string; nameAlt: string; variants: number; salePrice: number; category: string }[]
}

/** Handlers never throw across IPC; they return this envelope. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
