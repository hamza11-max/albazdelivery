import { ftsQuery, inStoreEan13, normaliseCode } from '@albaz/pos-core'
import type Database from 'better-sqlite3'

import type { Category, ProductDetail, ProductInput, ProductQuery, ProductSummary, VariantDetail, VariantInfo } from '../../shared/ipc'
import { nextCounter } from '../db/database'
import { uuidv7 } from '../ids'
import { AppError } from '../errors'

/** Writes that every catalog change records: an audit trail entry and an outbox row for sync. */
interface WriteContext {
  db: Database.Database
  now: string
  userId: string | null
}

function audit(ctx: WriteContext, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
  ctx.db
    .prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, before_json, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv7(), ctx.userId, action, entity, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after), ctx.now)
}

function outbox(ctx: WriteContext, entity: string, entityId: string, payload: unknown) {
  ctx.db
    .prepare("INSERT INTO outbox (event_id, entity, entity_id, op, payload_json, created_at) VALUES (?, ?, ?, 'UPSERT', ?, ?)")
    .run(uuidv7(), entity, entityId, JSON.stringify(payload), ctx.now)
}

interface ProductRow {
  id: string
  version: number
  name: string
  name_alt: string | null
  category_id: string | null
  brand: string | null
  cost_price: number
  sale_price: number
  option1_name: string | null
  option2_name: string | null
  archived_at: string | null
}

interface VariantRow {
  id: string
  product_id: string
  option1_value: string | null
  option2_value: string | null
  sku: string
  barcode: string | null
  sale_price: number | null
  stock_qty: number
  low_stock_threshold: number | null
}

const toVariant = (v: VariantRow): VariantDetail => ({
  id: v.id,
  option1Value: v.option1_value ?? '',
  option2Value: v.option2_value ?? '',
  sku: v.sku,
  barcode: v.barcode ?? '',
  salePrice: v.sale_price,
  stockQty: v.stock_qty,
  lowStockThreshold: v.low_stock_threshold,
})

export class CatalogRepo {
  constructor(
    private readonly db: Database.Database,
    private readonly clock: () => Date = () => new Date(),
    /** Signed-in user, recorded on audit rows. */
    private readonly currentUserId: () => string | null = () => null,
  ) {}

  private ctx(): WriteContext {
    return { db: this.db, now: this.clock().toISOString(), userId: this.currentUserId() }
  }

  // ---------- categories ----------

  categories(): Category[] {
    return this.db
      .prepare(
        `SELECT c.id, c.name, COUNT(p.id) AS productCount
         FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.archived_at IS NULL
         WHERE c.archived_at IS NULL
         GROUP BY c.id ORDER BY c.sort_order, c.name COLLATE NOCASE`,
      )
      .all() as Category[]
  }

  saveCategory(input: { id?: string | undefined; name: string }): Category {
    const ctx = this.ctx()
    return this.db.transaction(() => {
      const clash = this.db
        .prepare('SELECT id FROM categories WHERE archived_at IS NULL AND parent_id IS NULL AND lower(name) = lower(?) AND id IS NOT ?')
        .get(input.name, input.id ?? null)
      if (clash) throw new AppError('DUPLICATE_CATEGORY', `A category named “${input.name}” already exists`)
      const id = input.id ?? uuidv7()
      if (input.id) {
        const r = this.db.prepare('UPDATE categories SET name = ? WHERE id = ? AND archived_at IS NULL').run(input.name, id)
        if (r.changes === 0) throw new AppError('NOT_FOUND', 'Category not found')
      } else {
        this.db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(id, input.name)
      }
      outbox(ctx, 'category', id, { id, name: input.name })
      return this.categories().find((c) => c.id === id)!
    })()
  }

  archiveCategory(id: string): void {
    const ctx = this.ctx()
    this.db.transaction(() => {
      const used = this.db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND archived_at IS NULL').get(id) as { n: number }
      if (used.n > 0) throw new AppError('CATEGORY_IN_USE', `This category still has ${used.n} product(s)`)
      const r = this.db.prepare('UPDATE categories SET archived_at = ? WHERE id = ? AND archived_at IS NULL').run(ctx.now, id)
      if (r.changes === 0) throw new AppError('NOT_FOUND', 'Category not found')
      outbox(ctx, 'category', id, { id, archivedAt: ctx.now })
    })()
  }

  // ---------- products ----------

  products(q: ProductQuery): { rows: ProductSummary[]; total: number } {
    const where = ['p.archived_at IS NULL']
    const params: unknown[] = []
    if (q.categoryId) {
      where.push('p.category_id = ?')
      params.push(q.categoryId)
    }
    const match = ftsQuery(q.query)
    if (match) {
      where.push('p.id IN (SELECT product_id FROM catalog_search WHERE catalog_search MATCH ?)')
      params.push(match)
    }
    const having = q.stock === 'low' ? 'HAVING lowStockVariants > 0' : q.stock === 'out' ? 'HAVING outOfStockVariants > 0' : ''
    const base = `
      SELECT p.id, p.name, coalesce(p.name_alt, '') AS nameAlt, p.category_id AS categoryId, c.name AS categoryName,
             coalesce(p.brand, '') AS brand,
             MIN(coalesce(v.sale_price, p.sale_price)) AS minPrice, MAX(coalesce(v.sale_price, p.sale_price)) AS maxPrice,
             COUNT(v.id) AS variantCount, SUM(v.stock_qty) AS stockTotal,
             SUM(CASE WHEN v.low_stock_threshold IS NOT NULL AND v.stock_qty <= v.low_stock_threshold AND v.stock_qty > 0 THEN 1 ELSE 0 END) AS lowStockVariants,
             SUM(CASE WHEN p.track_stock = 1 AND v.stock_qty <= 0 THEN 1 ELSE 0 END) AS outOfStockVariants
      FROM products p
      JOIN variants v ON v.product_id = p.id AND v.archived_at IS NULL
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
      GROUP BY p.id ${having}`
    const total = (this.db.prepare(`SELECT COUNT(*) AS n FROM (${base})`).get(...params) as { n: number }).n
    const rows = this.db.prepare(`${base} ORDER BY p.name COLLATE NOCASE LIMIT ? OFFSET ?`).all(...params, q.limit, q.offset) as ProductSummary[]
    return { rows, total }
  }

  product(id: string): ProductDetail {
    const p = this.db.prepare('SELECT * FROM products WHERE id = ? AND archived_at IS NULL').get(id) as ProductRow | undefined
    if (!p) throw new AppError('NOT_FOUND', 'Product not found')
    const variants = this.db
      // rowid = insertion order: variants stay in the order the shop entered them.
      .prepare('SELECT * FROM variants WHERE product_id = ? AND archived_at IS NULL ORDER BY rowid')
      .all(id) as VariantRow[]
    return {
      id: p.id,
      version: p.version,
      name: p.name,
      nameAlt: p.name_alt ?? '',
      categoryId: p.category_id,
      brand: p.brand ?? '',
      costPrice: p.cost_price,
      salePrice: p.sale_price,
      option1Name: p.option1_name ?? '',
      option2Name: p.option2_name ?? '',
      variants: variants.map(toVariant),
    }
  }

  /** Exact SKU or barcode lookup for scanning. Returns null when nothing matches. */
  findByCode(raw: string): { product: ProductDetail; variantId: string } | null {
    const c = normaliseCode(raw)
    if (!c) return null
    const v = this.db
      .prepare(
        `SELECT v.id, v.product_id FROM variants v JOIN products p ON p.id = v.product_id
         WHERE (v.barcode = ? OR v.sku = ?) AND v.archived_at IS NULL AND p.archived_at IS NULL
         ORDER BY (v.barcode = ?) DESC LIMIT 1`,
      )
      .get(c, c, c) as { id: string; product_id: string } | undefined
    return v ? { product: this.product(v.product_id), variantId: v.id } : null
  }

  /** Reserves the next in-store EAN-13 (never handed out twice, even if unused). */
  newBarcode(): string {
    return this.db.transaction(() => {
      for (;;) {
        const code = inStoreEan13(nextCounter(this.db, 'catalog.barcodeSeq'))
        if (!this.db.prepare('SELECT 1 FROM variants WHERE barcode = ?').get(code)) return code
      }
    })()
  }

  saveProduct(input: ProductInput): ProductDetail {
    const ctx = this.ctx()
    return this.db.transaction(() => {
      if (input.categoryId && !this.db.prepare('SELECT 1 FROM categories WHERE id = ? AND archived_at IS NULL').get(input.categoryId)) {
        throw new AppError('NOT_FOUND', 'Category not found')
      }
      const before = input.id ? this.product(input.id) : null
      const productId = input.id ?? uuidv7()

      if (before) {
        const r = this.db
          .prepare(
            `UPDATE products SET name = ?, name_alt = ?, category_id = ?, brand = ?, cost_price = ?, sale_price = ?,
               option1_name = ?, option2_name = ?, version = version + 1, updated_at = ?
             WHERE id = ? AND version = ? AND archived_at IS NULL`,
          )
          .run(input.name, input.nameAlt || null, input.categoryId, input.brand || null, input.costPrice, input.salePrice,
            input.option1Name || null, input.option2Name || null, ctx.now, productId, input.version)
        if (r.changes === 0) throw new AppError('CONFLICT', 'This product was changed elsewhere. Reload it and try again.')
      } else {
        this.db
          .prepare(
            `INSERT INTO products (id, name, name_alt, category_id, brand, cost_price, sale_price, option1_name, option2_name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(productId, input.name, input.nameAlt || null, input.categoryId, input.brand || null, input.costPrice, input.salePrice,
            input.option1Name || null, input.option2Name || null, ctx.now, ctx.now)
      }

      const existing = new Map((before?.variants ?? []).map((v) => [v.id, v]))
      const kept = new Set<string>()
      for (const v of input.variants) {
        if (v.id && !existing.has(v.id)) throw new AppError('NOT_FOUND', 'Variant does not belong to this product')
        const variantId = v.id ?? uuidv7()
        const sku = v.sku || `SKU-${String(nextCounter(this.db, 'catalog.skuSeq')).padStart(6, '0')}`
        this.assertCodeFree('sku', sku, variantId)
        if (v.barcode) this.assertCodeFree('barcode', v.barcode, variantId)
        if (v.id) {
          this.db
            .prepare(
              `UPDATE variants SET option1_value = ?, option2_value = ?, sku = ?, barcode = ?, sale_price = ?, low_stock_threshold = ?, updated_at = ?
               WHERE id = ?`,
            )
            .run(v.option1Value || null, v.option2Value || null, sku, v.barcode || null, v.salePrice, v.lowStockThreshold, ctx.now, variantId)
        } else {
          this.db
            .prepare(
              `INSERT INTO variants (id, product_id, option1_value, option2_value, sku, barcode, sale_price, low_stock_threshold, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(variantId, productId, v.option1Value || null, v.option2Value || null, sku, v.barcode || null, v.salePrice, v.lowStockThreshold, ctx.now, ctx.now)
        }
        kept.add(variantId)
      }
      // Variants left out are archived, never deleted: past sales still point at them.
      for (const id of existing.keys()) {
        if (!kept.has(id)) this.db.prepare('UPDATE variants SET archived_at = ?, updated_at = ? WHERE id = ?').run(ctx.now, ctx.now, id)
      }

      const after = this.product(productId)
      if (!before) {
        audit(ctx, 'PRODUCT_CREATE', 'product', productId, null, after)
      } else {
        const prices = (d: ProductDetail) => ({ costPrice: d.costPrice, salePrice: d.salePrice, variants: d.variants.map((v) => [v.id, v.salePrice]) })
        if (JSON.stringify(prices(before)) !== JSON.stringify(prices(after))) audit(ctx, 'PRICE_EDIT', 'product', productId, prices(before), prices(after))
      }
      outbox(ctx, 'product', productId, after)
      return after
    })()
  }

  archiveProduct(id: string): void {
    const ctx = this.ctx()
    this.db.transaction(() => {
      const before = this.product(id)
      this.db.prepare('UPDATE products SET archived_at = ?, updated_at = ?, version = version + 1 WHERE id = ?').run(ctx.now, ctx.now, id)
      audit(ctx, 'PRODUCT_ARCHIVE', 'product', id, { name: before.name }, null)
      outbox(ctx, 'product', id, { id, archivedAt: ctx.now })
    })()
  }

  /** What goes on a label for each variant, in the order asked. */
  labelData(variantIds: readonly string[]): { variantId: string; name: string; variantLabel: string; price: number; barcode: string }[] {
    const get = this.db.prepare(
      `SELECT v.id, p.name, v.option1_value, v.option2_value, coalesce(v.sale_price, p.sale_price) AS price, coalesce(v.barcode, '') AS barcode
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.archived_at IS NULL AND p.archived_at IS NULL`,
    )
    return variantIds.map((id) => {
      const r = get.get(id) as { id: string; name: string; option1_value: string | null; option2_value: string | null; price: number; barcode: string } | undefined
      if (!r) throw new AppError('NOT_FOUND', 'Variant not found')
      return {
        variantId: r.id,
        name: r.name,
        variantLabel: [r.option1_value, r.option2_value].filter(Boolean).join(' / '),
        price: r.price,
        barcode: r.barcode,
      }
    })
  }

  /** Display info for cart lines (active variants only, in the order asked; missing ones are left out). */
  variantInfo(variantIds: readonly string[]): VariantInfo[] {
    const get = this.db.prepare(
      `SELECT v.id AS variantId, p.name, coalesce(p.name_alt, '') AS nameAlt,
              trim(coalesce(v.option1_value, '') || CASE WHEN v.option2_value IS NOT NULL THEN ' / ' || v.option2_value ELSE '' END) AS variantLabel,
              coalesce(v.sale_price, p.sale_price) AS price, v.stock_qty AS stockQty
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.archived_at IS NULL AND p.archived_at IS NULL`,
    )
    return variantIds.map((id) => get.get(id) as VariantInfo | undefined).filter((v): v is VariantInfo => !!v)
  }

  /** Gives an in-store EAN-13 to each listed variant that has no barcode yet. */
  assignMissingBarcodes(variantIds: readonly string[]): number {
    const ctx = this.ctx()
    return this.db.transaction(() => {
      let assigned = 0
      const touched = new Set<string>()
      for (const id of variantIds) {
        const v = this.db.prepare('SELECT product_id, barcode FROM variants WHERE id = ? AND archived_at IS NULL').get(id) as { product_id: string; barcode: string | null } | undefined
        if (!v) throw new AppError('NOT_FOUND', 'Variant not found')
        if (v.barcode) continue
        this.db.prepare('UPDATE variants SET barcode = ?, updated_at = ? WHERE id = ?').run(this.newBarcode(), ctx.now, id)
        touched.add(v.product_id)
        assigned++
      }
      for (const productId of touched) outbox(ctx, 'product', productId, this.product(productId))
      return assigned
    })()
  }

  private assertCodeFree(kind: 'sku' | 'barcode', value: string, variantId: string) {
    const other = this.db
      .prepare(`SELECT p.name FROM variants v JOIN products p ON p.id = v.product_id WHERE v.${kind} = ? AND v.id <> ?`)
      .get(value, variantId) as { name: string } | undefined
    if (other) {
      throw new AppError(kind === 'sku' ? 'DUPLICATE_SKU' : 'DUPLICATE_BARCODE', `${kind === 'sku' ? 'SKU' : 'Barcode'} ${value} is already used by “${other.name}”`)
    }
  }
}
