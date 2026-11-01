import type Database from 'better-sqlite3'

import type { FlatItem, FlatItemInput } from '../../shared/ipc'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import type { CatalogRepo } from './repo'

/**
 * The vendor screens work with one flat row per sellable item (name, SKU, barcode,
 * prices, stock). Here that row is one variant; a product with sizes shows one row
 * per size ("Chemise — M"). Products and variants stay the source of truth.
 */
export function flatItems(db: Database.Database): FlatItem[] {
  const rows = db.prepare(`
    SELECT v.id AS variantId, p.id AS productId, p.name, p.name_alt AS nameAlt,
           trim(coalesce(v.option1_value, '') || ' ' || coalesce(v.option2_value, '')) AS variantLabel,
           coalesce(c.name, '') AS category, v.sku, coalesce(v.barcode, '') AS barcode,
           coalesce(v.cost_price, p.cost_price) AS costPrice, coalesce(v.sale_price, p.sale_price) AS salePrice,
           v.stock_qty AS stock, coalesce(v.low_stock_threshold, 0) AS lowStockThreshold,
           (SELECT COUNT(*) FROM variants w WHERE w.product_id = p.id AND w.archived_at IS NULL) AS siblings,
           v.created_at AS createdAt, max(v.updated_at, p.updated_at) AS updatedAt
    FROM variants v
    JOIN products p ON p.id = v.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE v.archived_at IS NULL AND p.archived_at IS NULL
    ORDER BY lower(p.name), v.rowid`).all() as (Omit<FlatItem, 'displayName'> & { siblings: number })[]
  return rows.map(({ siblings, ...r }) => ({ ...r, displayName: r.variantLabel && siblings > 1 ? `${r.name} — ${r.variantLabel}` : r.name }))
}

/**
 * Creates or edits one flat item. A new item is a product with one variant.
 * On a product with several sizes, the price edit applies to that size only.
 * A changed stock count is recorded as an ADJUST movement, never written directly.
 */
export function saveFlatItem(db: Database.Database, repo: CatalogRepo, input: FlatItemInput, userId: string): FlatItem {
  const categoryId = input.category ? findOrCreateCategory(repo, input.category) : null
  return db.transaction(() => {
    let variantId = input.variantId
    if (!variantId) {
      const saved = repo.saveProduct({
        name: input.name, nameAlt: '', categoryId, brand: '', costPrice: input.costPrice, salePrice: input.salePrice,
        option1Name: '', option2Name: '',
        variants: [{ option1Value: '', option2Value: '', sku: input.sku, barcode: input.barcode, salePrice: null, lowStockThreshold: input.lowStockThreshold }],
      })
      variantId = saved.variants[0]!.id
    } else {
      const owner = db.prepare('SELECT product_id AS productId FROM variants WHERE id = ? AND archived_at IS NULL').get(variantId) as { productId: string } | undefined
      if (!owner) throw new AppError('NOT_FOUND', 'Item not found')
      const p = repo.product(owner.productId)
      const single = p.variants.length === 1
      repo.saveProduct({
        id: p.id, version: p.version, name: input.name, nameAlt: p.nameAlt, categoryId, brand: p.brand,
        costPrice: single ? input.costPrice : p.costPrice,
        salePrice: single ? input.salePrice : p.salePrice,
        option1Name: p.option1Name, option2Name: p.option2Name,
        variants: p.variants.map((v) => v.id !== variantId ? {
          id: v.id, option1Value: v.option1Value, option2Value: v.option2Value, sku: v.sku, barcode: v.barcode, salePrice: v.salePrice, lowStockThreshold: v.lowStockThreshold,
        } : {
          id: v.id, option1Value: v.option1Value, option2Value: v.option2Value, sku: input.sku, barcode: input.barcode,
          salePrice: single || input.salePrice === p.salePrice ? null : input.salePrice,
          lowStockThreshold: input.lowStockThreshold,
        }),
      })
    }
    if (input.stock !== undefined) adjustStock(db, { variantId, newQty: input.stock, reason: input.stockReason || 'Inventaire' }, userId)
    const item = flatItems(db).find((i) => i.variantId === variantId)
    if (!item) throw new AppError('NOT_FOUND', 'Item not found')
    return item
  })()
}

/** Removes an item from sale. History keeps it (archived, never deleted). */
export function archiveFlatItem(db: Database.Database, repo: CatalogRepo, variantId: string): void {
  const v = db.prepare('SELECT product_id AS productId FROM variants WHERE id = ? AND archived_at IS NULL').get(variantId) as { productId: string } | undefined
  if (!v) throw new AppError('NOT_FOUND', 'Item not found')
  const p = repo.product(v.productId)
  if (p.variants.length === 1) return repo.archiveProduct(p.id)
  db.prepare('UPDATE variants SET archived_at = ?, updated_at = ? WHERE id = ?').run(new Date().toISOString(), new Date().toISOString(), variantId)
}

/** Sets a variant's stock to a counted quantity: one ADJUST movement for the difference, with a reason. */
export function adjustStock(db: Database.Database, input: { variantId: string; newQty: number; reason: string }, userId: string): { stock: number; delta: number } {
  return db.transaction(() => {
    const v = db.prepare('SELECT stock_qty AS stock, coalesce(variants.cost_price, products.cost_price) AS cost FROM variants JOIN products ON products.id = variants.product_id WHERE variants.id = ?').get(input.variantId) as { stock: number; cost: number } | undefined
    if (!v) throw new AppError('NOT_FOUND', 'Item not found')
    const delta = input.newQty - v.stock
    if (delta === 0) return { stock: v.stock, delta }
    const now = new Date().toISOString()
    db.prepare("INSERT INTO stock_movements (id, variant_id, type, qty_delta, unit_cost, ref_type, ref_id, reason, user_id, created_at) VALUES (?, ?, 'ADJUST', ?, ?, 'adjust', NULL, ?, ?, ?)")
      .run(uuidv7(), input.variantId, delta, v.cost, input.reason, userId, now)
    db.prepare('UPDATE variants SET stock_qty = ?, updated_at = ? WHERE id = ?').run(input.newQty, now, input.variantId)
    db.prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, before_json, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv7(), userId, 'STOCK_ADJUST', 'variant', input.variantId, JSON.stringify({ stock: v.stock }), JSON.stringify({ stock: input.newQty, reason: input.reason }), now)
    return { stock: input.newQty, delta }
  })()
}

function findOrCreateCategory(repo: CatalogRepo, name: string): string {
  const existing = repo.categories().find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())
  return existing ? existing.id : repo.saveCategory({ name: name.trim() }).id
}
