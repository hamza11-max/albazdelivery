import { normaliseSearchText } from '@albaz/pos-core'
import ExcelJS from 'exceljs'
import type Database from 'better-sqlite3'

import { inputs, type ImportIssue, type ImportPreview, type ProductInput } from '../../shared/ipc'
import { AppError } from '../errors'
import type { CatalogRepo } from './repo'
import type { Sheet } from './spreadsheet'

/**
 * Import format: one row per variant. Rows with the same name (and other-language
 * name) form one product; product columns may be repeated or left empty on
 * later rows. Headers are matched loosely in French, Arabic or English.
 */
const FIELDS = {
  name: ['nom', 'name', 'produit', 'الاسم', 'اسم المنتج', 'المنتج'],
  nameAlt: ['nom 2', 'autre nom', 'name 2', 'nom (autre langue)', 'الاسم 2', 'الاسم بلغه اخري'],
  category: ['categorie', 'category', 'famille', 'الصنف', 'الفئه'],
  brand: ['marque', 'brand', 'العلامه', 'الماركه'],
  costPrice: ['prix d achat', 'prix achat', 'cout', 'cost', 'cost price', 'سعر الشراء'],
  salePrice: ['prix de vente', 'prix vente', 'prix', 'price', 'sale price', 'سعر البيع', 'السعر'],
  option1Name: ['option 1', 'option1', 'الخيار 1'],
  option1Value: ['valeur 1', 'value 1', 'قيمه 1', 'القيمه 1'],
  option2Name: ['option 2', 'option2', 'الخيار 2'],
  option2Value: ['valeur 2', 'value 2', 'قيمه 2', 'القيمه 2'],
  sku: ['sku', 'reference', 'ref', 'المرجع'],
  barcode: ['code barre', 'code-barres', 'code barres', 'codebarre', 'barcode', 'ean', 'الباركود', 'الرمز الشريطي'],
  variantPrice: ['prix variante', 'variant price', 'سعر المتغير'],
  lowStock: ['alerte stock', 'stock minimum', 'low stock', 'تنبيه المخزون'],
} as const
type Field = keyof typeof FIELDS
const REQUIRED: Field[] = ['name', 'salePrice']
const PRODUCT_FIELDS: Field[] = ['nameAlt', 'category', 'brand', 'costPrice', 'salePrice', 'option1Name', 'option2Name']

/** Template headers: French / Arabic, both recognised on import. */
export const TEMPLATE_HEADERS: Record<Field, string> = {
  name: 'Nom / الاسم',
  nameAlt: 'Nom 2 / الاسم 2',
  category: 'Catégorie / الصنف',
  brand: 'Marque / العلامة',
  costPrice: "Prix d'achat / سعر الشراء",
  salePrice: 'Prix de vente / سعر البيع',
  option1Name: 'Option 1 / الخيار 1',
  option1Value: 'Valeur 1 / القيمة 1',
  option2Name: 'Option 2 / الخيار 2',
  option2Value: 'Valeur 2 / القيمة 2',
  sku: 'SKU',
  barcode: 'Code-barres / الباركود',
  variantPrice: 'Prix variante / سعر المتغير',
  lowStock: 'Alerte stock / تنبيه المخزون',
}

const headerKey = (h: string) => normaliseSearchText(h).replace(/['’`._-]/g, ' ').replace(/\s+/g, ' ').trim()

/** Maps each column to a field. A header like "Nom / الاسم" matches on either half. */
export function mapHeaders(headers: string[]): { columns: Map<Field, number>; issues: ImportIssue[] } {
  const columns = new Map<Field, number>()
  headers.forEach((h, index) => {
    const parts = [h, ...h.split('/')].map(headerKey).filter(Boolean)
    for (const [field, aliases] of Object.entries(FIELDS) as [Field, readonly string[]][]) {
      if (columns.has(field)) continue
      if (parts.some((p) => aliases.some((a) => headerKey(a) === p))) {
        columns.set(field, index)
        break
      }
    }
  })
  const issues = REQUIRED.filter((f) => !columns.has(f)).map((f) => ({ row: 1, code: 'MISSING_COLUMN', field: f }))
  return { columns, issues }
}

/** "2 500", "2.500", "2500,00", "2500 DA" → 2500. Fractions of a dinar are refused. */
export function parseAmount(text: string): number | 'invalid' | 'fraction' | null {
  const s = text.replace(/[\s  ]/g, '').replace(/(da|dzd|د\.?ج)$/i, '')
  if (s === '') return null
  if (/^\d+$/.test(s)) return Number(s)
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''))
  if (/^\d+[.,]0{1,2}$/.test(s)) return Number(s.replace(/[.,]0+$/, ''))
  if (/^\d+[.,]\d+$/.test(s)) return 'fraction'
  return 'invalid'
}

interface Draft {
  firstRow: number
  rows: number[]
  product: Record<string, unknown>
  variants: Record<string, unknown>[]
  category: string
  /** Where each product field was first seen, for "conflicts with row N". */
  seen: Partial<Record<Field, { value: string; row: number }>>
}

export interface ImportPlan {
  preview: ImportPreview
  products: { input: ProductInput; category: string; rows: number[] }[]
}

export function planImport(sheet: Sheet, repo: CatalogRepo, db: Database.Database): ImportPlan {
  const { columns, issues } = mapHeaders(sheet.headers)
  if (issues.length) return { preview: summary([], issues, []), products: [] }

  const get = (cells: string[], f: Field) => (columns.has(f) ? (cells[columns.get(f)!] ?? '').trim() : '')
  const drafts = new Map<string, Draft>()
  const errors: ImportIssue[] = []

  for (const { row, cells } of sheet.rows) {
    const name = get(cells, 'name')
    if (!name) {
      errors.push({ row, code: 'REQUIRED', field: 'name' })
      continue
    }
    const key = `${normaliseSearchText(name)}|${normaliseSearchText(get(cells, 'nameAlt'))}`
    let d = drafts.get(key)
    if (!d) {
      d = { firstRow: row, rows: [], product: { name }, variants: [], category: '', seen: {} }
      drafts.set(key, d)
    }
    d.rows.push(row)

    for (const f of PRODUCT_FIELDS) {
      const value = get(cells, f)
      if (!value) continue
      const prev = d.seen[f]
      if (prev && normaliseSearchText(prev.value) !== normaliseSearchText(value)) {
        errors.push({ row, code: 'CONFLICTING_VALUE', field: f, detail: String(prev.row) })
        continue
      }
      if (prev) continue
      d.seen[f] = { value, row }
      if (f === 'costPrice' || f === 'salePrice') {
        const n = parseAmount(value)
        if (typeof n !== 'number') errors.push({ row, code: n === 'fraction' ? 'NOT_WHOLE' : 'INVALID_NUMBER', field: f })
        else d.product[f] = n
      } else if (f === 'category') d.category = value
      else d.product[f] = value
    }

    const variant: Record<string, unknown> = {
      option1Value: get(cells, 'option1Value'),
      option2Value: get(cells, 'option2Value'),
      sku: get(cells, 'sku'),
      barcode: get(cells, 'barcode'),
    }
    for (const [f, target] of [['variantPrice', 'salePrice'], ['lowStock', 'lowStockThreshold']] as const) {
      const n = parseAmount(get(cells, f))
      if (n === null) continue
      if (typeof n !== 'number') errors.push({ row, code: n === 'fraction' ? 'NOT_WHOLE' : 'INVALID_NUMBER', field: f })
      else variant[target] = n
    }
    d.variants.push(variant)
  }

  const products: ImportPlan['products'] = []
  const fileSkus = new Map<string, number>()
  const fileBarcodes = new Map<string, number>()
  const exists = (kind: 'sku' | 'barcode', v: string) => !!db.prepare(`SELECT 1 FROM variants WHERE ${kind} = ?`).get(v)

  for (const d of drafts.values()) {
    if (d.product.salePrice === undefined && !errors.some((e) => d.rows.includes(e.row) && e.field === 'salePrice')) {
      errors.push({ row: d.firstRow, code: 'REQUIRED', field: 'salePrice' })
    }
    d.variants.forEach((v, i) => {
      const row = d.rows[i]!
      for (const kind of ['sku', 'barcode'] as const) {
        const value = String(v[kind] ?? '')
        if (!value) continue
        const seen = kind === 'sku' ? fileSkus : fileBarcodes
        if (seen.has(value)) errors.push({ row, code: kind === 'sku' ? 'DUPLICATE_SKU' : 'DUPLICATE_BARCODE', detail: String(seen.get(value)) })
        else seen.set(value, row)
        if (exists(kind, value)) errors.push({ row, code: kind === 'sku' ? 'SKU_EXISTS' : 'BARCODE_EXISTS', detail: value })
      }
    })

    const parsed = inputs['catalog:saveProduct'].safeParse({ costPrice: 0, ...d.product, variants: d.variants })
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        // Map "variants.3.option1Value" back to the spreadsheet row of that variant.
        const row = issue.path[0] === 'variants' && typeof issue.path[1] === 'number' ? d.rows[issue.path[1]] ?? d.firstRow : d.firstRow
        const field = String(issue.path.at(-1) ?? '')
        if (!errors.some((e) => e.row === row && e.field === field)) errors.push({ row, code: 'INVALID', field, detail: issue.message })
      }
      continue
    }
    products.push({ input: parsed.data, category: d.category, rows: d.rows })
  }

  const known = new Set(repo.categories().map((c) => normaliseSearchText(c.name)))
  const newCategories = [...new Map(products.filter((p) => p.category && !known.has(normaliseSearchText(p.category))).map((p) => [normaliseSearchText(p.category), p.category])).values()]
  errors.sort((a, b) => a.row - b.row)
  return { preview: summary(products, errors, newCategories), products }
}

function summary(products: ImportPlan['products'], errors: ImportIssue[], newCategories: string[]): ImportPreview {
  return {
    token: '',
    fileName: '',
    products: products.length,
    variants: products.reduce((s, p) => s + p.input.variants.length, 0),
    newCategories,
    errors: errors.slice(0, 500),
    errorCount: errors.length,
    sample: products.slice(0, 10).map((p) => ({ name: p.input.name, nameAlt: p.input.nameAlt, variants: p.input.variants.length, salePrice: p.input.salePrice, category: p.category })),
  }
}

/** Creates categories and products in one transaction: all rows are imported, or none. */
export function commitImport(plan: ImportPlan, repo: CatalogRepo, db: Database.Database): { products: number; variants: number } {
  if (plan.preview.errorCount > 0) throw new AppError('IMPORT_HAS_ERRORS', 'Fix the errors in the file first')
  return db.transaction(() => {
    const categories = new Map(repo.categories().map((c) => [normaliseSearchText(c.name), c.id]))
    let variants = 0
    for (const p of plan.products) {
      let categoryId: string | null = null
      if (p.category) {
        const key = normaliseSearchText(p.category)
        categoryId = categories.get(key) ?? repo.saveCategory({ name: p.category }).id
        categories.set(key, categoryId)
      }
      try {
        variants += repo.saveProduct({ ...p.input, categoryId }).variants.length
      } catch (err) {
        if (err instanceof AppError) throw new AppError(err.code, `Row ${p.rows[0]}: ${err.message}`)
        throw err
      }
    }
    return { products: plan.products.length, variants }
  })()
}

/** An .xlsx template with bilingual headers and two example products (written in memory). */
export async function templateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Produits')
  ws.addRow(Object.values(TEMPLATE_HEADERS))
  ws.getRow(1).font = { bold: true }
  const example = (o: Partial<Record<Field, string | number>>) => ws.addRow((Object.keys(TEMPLATE_HEADERS) as Field[]).map((f) => o[f] ?? ''))
  example({ name: 'قميص قطن', nameAlt: 'Chemise coton', category: 'Chemises', brand: 'Albaz', costPrice: 1200, salePrice: 2500, option1Name: 'Taille', option1Value: 'M', option2Name: 'Couleur', option2Value: 'Blanc' })
  example({ name: 'قميص قطن', nameAlt: 'Chemise coton', option1Value: 'L', option2Value: 'Blanc', variantPrice: 2700 })
  example({ name: 'حزام جلد', nameAlt: 'Ceinture cuir', category: 'Accessoires', costPrice: 500, salePrice: 1200, barcode: '6130000000015', lowStock: 3 })
  ws.columns.forEach((c) => (c.width = 22))
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  return Buffer.from(await wb.xlsx.writeBuffer())
}
