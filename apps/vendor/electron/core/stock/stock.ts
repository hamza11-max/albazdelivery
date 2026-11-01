import type Database from 'better-sqlite3'

import type { FlatItem, StockCount, StockMovementRow, StockReceiptInput } from '../../shared/ipc'
import { flatItems } from '../catalog/flat'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'

/**
 * Stock in the shop: deliveries (RECEIVE), counts (ADJUST for each difference) and the
 * movement history. Every change is a stock_movements row; variants.stock_qty is its running
 * total. Writes are audited; a delivery's id comes from the screen so a retry records it once.
 */
export class StockService {
  constructor(
    private readonly db: Database.Database,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** A supplier delivery: one receipt, one RECEIVE per line; the line cost becomes the item's cost. */
  receive(input: StockReceiptInput, userId: string): { receiptId: string; units: number; totalCost: number } {
    return this.db.transaction(() => {
      const existing = this.db.prepare('SELECT id, total_cost AS totalCost FROM stock_receipts WHERE id = ?').get(input.id) as { id: string; totalCost: number } | undefined
      if (existing) {
        const units = (this.db.prepare("SELECT coalesce(SUM(qty_delta), 0) AS n FROM stock_movements WHERE ref_type = 'receipt' AND ref_id = ?").get(input.id) as { n: number }).n
        return { receiptId: existing.id, units, totalCost: existing.totalCost }
      }
      const now = this.clock().toISOString()
      const variant = this.db.prepare('SELECT v.id, v.cost_price AS own, p.cost_price AS productCost, (SELECT COUNT(*) FROM variants w WHERE w.product_id = p.id AND w.archived_at IS NULL) AS siblings, p.id AS productId FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ? AND v.archived_at IS NULL')
      const move = this.db.prepare("INSERT INTO stock_movements (id, variant_id, type, qty_delta, unit_cost, ref_type, ref_id, reason, user_id, created_at) VALUES (?, ?, 'RECEIVE', ?, ?, 'receipt', ?, NULL, ?, ?)")
      const bump = this.db.prepare('UPDATE variants SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?')
      this.db.prepare('INSERT INTO stock_receipts (id, supplier_id, supplier_name, reference, note, user_id, total_cost, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
        .run(input.id, input.supplierId ?? null, input.supplierName || null, input.reference || null, input.note || null, userId, now)
      let totalCost = 0
      let units = 0
      const costChanges: { variantId: string; from: number; to: number }[] = []
      for (const line of input.lines) {
        const v = variant.get(line.variantId) as { id: string; own: number | null; productCost: number; siblings: number; productId: string } | undefined
        if (!v) throw new AppError('NOT_FOUND', `Item not found: ${line.variantId}`)
        const cost = line.unitCost ?? v.own ?? v.productCost
        move.run(uuidv7(), v.id, line.qty, cost, input.id, userId, now)
        bump.run(line.qty, now, v.id)
        totalCost += cost * line.qty
        units += line.qty
        const current = v.own ?? v.productCost
        if (line.unitCost !== undefined && line.unitCost !== current) {
          // One-size products keep the cost on the product; sizes get their own.
          if (v.siblings === 1) this.db.prepare('UPDATE products SET cost_price = ?, updated_at = ?, version = version + 1 WHERE id = ?').run(line.unitCost, now, v.productId)
          else this.db.prepare('UPDATE variants SET cost_price = ?, updated_at = ? WHERE id = ?').run(line.unitCost, now, v.id)
          costChanges.push({ variantId: v.id, from: current, to: line.unitCost })
        }
      }
      this.db.prepare('UPDATE stock_receipts SET total_cost = ? WHERE id = ?').run(totalCost, input.id)
      this.audit(userId, 'STOCK_RECEIVE', 'stock_receipt', input.id, null, { supplier: input.supplierName, reference: input.reference, units, totalCost, costChanges }, now)
      return { receiptId: input.id, units, totalCost }
    })()
  }

  /** Items at or under their alert level (and anything out of stock), emptiest first. */
  low(): FlatItem[] {
    return flatItems(this.db)
      .filter((i) => i.stock <= 0 || (i.lowStockThreshold > 0 && i.stock <= i.lowStockThreshold))
      .sort((a, b) => a.stock - b.stock || a.displayName.localeCompare(b.displayName))
  }

  movements(q: { variantId?: string | undefined; limit: number }): StockMovementRow[] {
    return this.db.prepare(`
      SELECT m.id, m.variant_id AS variantId,
             p.name || CASE WHEN trim(coalesce(v.option1_value, '') || ' ' || coalesce(v.option2_value, '')) <> '' THEN ' — ' || trim(coalesce(v.option1_value, '') || ' ' || coalesce(v.option2_value, '')) ELSE '' END AS name,
             m.type, m.qty_delta AS delta, m.unit_cost AS unitCost, coalesce(m.reason, '') AS reason,
             coalesce(r.supplier_name, '') AS supplier, coalesce(r.reference, '') AS reference,
             coalesce(s.number, '') AS saleNumber, u.name AS user, m.created_at AS createdAt
      FROM stock_movements m
      JOIN variants v ON v.id = m.variant_id
      JOIN products p ON p.id = v.product_id
      JOIN users u ON u.id = m.user_id
      LEFT JOIN stock_receipts r ON m.ref_type = 'receipt' AND r.id = m.ref_id
      LEFT JOIN sales s ON m.ref_type = 'sale' AND s.id = m.ref_id
      WHERE (? IS NULL OR m.variant_id = ?)
      ORDER BY m.created_at DESC, m.rowid DESC
      LIMIT ?`).all(q.variantId ?? null, q.variantId ?? null, q.limit) as StockMovementRow[]
  }

  // ---------- counts ----------

  /** Starts a count: snapshots what the system expects for every item on sale. */
  startCount(note: string, userId: string): StockCount {
    return this.db.transaction(() => {
      if (this.openCountId()) throw new AppError('COUNT_ALREADY_OPEN', 'A count is already open')
      const id = uuidv7()
      const now = this.clock().toISOString()
      this.db.prepare('INSERT INTO stock_counts (id, note, user_id, created_at) VALUES (?, ?, ?, ?)').run(id, note || null, userId, now)
      this.db.prepare(`INSERT INTO stock_count_lines (count_id, variant_id, expected)
        SELECT ?, v.id, v.stock_qty FROM variants v JOIN products p ON p.id = v.product_id
        WHERE v.archived_at IS NULL AND p.archived_at IS NULL`).run(id)
      this.audit(userId, 'COUNT_START', 'stock_count', id, null, { note }, now)
      return this.count(id)
    })()
  }

  openCount(): StockCount | null {
    const id = this.openCountId()
    return id ? this.count(id) : null
  }

  /** Records what is on the shelf for one item; null clears it (not counted). */
  setCounted(countId: string, variantId: string, counted: number | null): void {
    this.requireOpen(countId)
    const r = this.db.prepare('UPDATE stock_count_lines SET counted = ?, counted_at = ? WHERE count_id = ? AND variant_id = ?')
      .run(counted, counted === null ? null : this.clock().toISOString(), countId, variantId)
    if (r.changes === 0) throw new AppError('NOT_FOUND', 'Item is not in this count')
  }

  /**
   * Finishes a count. Each counted item is set to the counted quantity with one ADJUST
   * against its stock now (sales during the count are already in it). Uncounted items are not touched.
   */
  finishCount(countId: string, userId: string): { adjusted: number; unitsDelta: number } {
    return this.db.transaction(() => {
      this.requireOpen(countId)
      const now = this.clock().toISOString()
      const lines = this.db.prepare(`SELECT l.variant_id AS variantId, l.counted, v.stock_qty AS stock, coalesce(v.cost_price, p.cost_price) AS cost
        FROM stock_count_lines l JOIN variants v ON v.id = l.variant_id JOIN products p ON p.id = v.product_id
        WHERE l.count_id = ? AND l.counted IS NOT NULL`).all(countId) as { variantId: string; counted: number; stock: number; cost: number }[]
      const move = this.db.prepare("INSERT INTO stock_movements (id, variant_id, type, qty_delta, unit_cost, ref_type, ref_id, reason, user_id, created_at) VALUES (?, ?, 'ADJUST', ?, ?, 'adjust', ?, 'Inventaire', ?, ?)")
      const set = this.db.prepare('UPDATE variants SET stock_qty = ?, updated_at = ? WHERE id = ?')
      let adjusted = 0
      let unitsDelta = 0
      for (const l of lines) {
        const delta = l.counted - l.stock
        if (delta === 0) continue
        move.run(uuidv7(), l.variantId, delta, l.cost, countId, userId, now)
        set.run(l.counted, now, l.variantId)
        adjusted++
        unitsDelta += delta
      }
      this.db.prepare("UPDATE stock_counts SET status = 'FINISHED', finished_at = ?, finished_by = ? WHERE id = ?").run(now, userId, countId)
      this.audit(userId, 'COUNT_FINISH', 'stock_count', countId, null, { counted: lines.length, adjusted, unitsDelta }, now)
      return { adjusted, unitsDelta }
    })()
  }

  cancelCount(countId: string, userId: string): void {
    this.requireOpen(countId)
    const now = this.clock().toISOString()
    this.db.prepare("UPDATE stock_counts SET status = 'CANCELLED', finished_at = ?, finished_by = ? WHERE id = ?").run(now, userId, countId)
    this.audit(userId, 'COUNT_CANCEL', 'stock_count', countId, null, null, now)
  }

  private count(id: string): StockCount {
    const head = this.db.prepare('SELECT c.id, c.status, coalesce(c.note, \'\') AS note, c.created_at AS createdAt, u.name AS user FROM stock_counts c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(id) as Omit<StockCount, 'lines'>
    const items = new Map(flatItems(this.db).map((i) => [i.variantId, i]))
    const lines = (this.db.prepare('SELECT variant_id AS variantId, expected, counted FROM stock_count_lines WHERE count_id = ? ORDER BY rowid').all(id) as { variantId: string; expected: number; counted: number | null }[])
      .map((l) => {
        const item = items.get(l.variantId)
        return { ...l, name: item?.displayName ?? '?', sku: item?.sku ?? '', barcode: item?.barcode ?? '', stockNow: item?.stock ?? l.expected }
      })
    return { ...head, lines }
  }

  private openCountId(): string | null {
    return (this.db.prepare("SELECT id FROM stock_counts WHERE status = 'OPEN'").get() as { id: string } | undefined)?.id ?? null
  }

  private requireOpen(countId: string): void {
    if (this.openCountId() !== countId) throw new AppError('COUNT_NOT_OPEN', 'This count is not open')
  }

  private audit(userId: string, action: string, entity: string, entityId: string, before: unknown, after: unknown, now: string) {
    this.db.prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, before_json, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv7(), userId, action, entity, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after), now)
  }
}
