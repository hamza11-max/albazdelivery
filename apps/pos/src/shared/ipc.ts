/**
 * The IPC contract between the renderer and the main process. Every channel is
 * declared here once: its input schema (checked in main before any handler
 * runs) and its result type. Renderer code imports this file with
 * `import type` only, so zod is not bundled into the UI.
 */
import { z } from 'zod'

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
  // The main process shows the file dialogs: the renderer never passes file paths.
  'import:template': z.undefined(),
  'import:preview': z.undefined(),
  'import:commit': z.object({ token: z.string().uuid() }),
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
  /** null when the dialog was cancelled. */
  'import:template': { path: string } | null
  'import:preview': ImportPreview | null
  'import:commit': { products: number; variants: number }
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
  sample: { name: string; nameAlt: string; variants: number; salePrice: number; category: string }[]
}

/** Handlers never throw across IPC; they return this envelope. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
