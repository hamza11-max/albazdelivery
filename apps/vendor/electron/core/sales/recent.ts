import type Database from 'better-sqlite3'

import type { RecentSale } from '../../shared/ipc'

/**
 * Completed sales and returns of the last `days` days with their lines, newest first,
 * for the vendor dashboard and history. Voided sales are left out; returns carry
 * negative quantities and totals so sums net out.
 */
export function recentSales(db: Database.Database, days: number, now: Date = new Date()): RecentSale[] {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString()
  const sales = db.prepare(`
    SELECT s.id, s.number, s.type, s.created_at AS createdAt, u.name AS cashier,
           s.subtotal, s.discount_total AS discount, s.total,
           coalesce((SELECT SUM(abs(amount)) FROM payments p WHERE p.sale_id = s.id AND p.method = 'CARD_EXTERNAL'), 0) AS card
    FROM sales s JOIN users u ON u.id = s.user_id
    WHERE s.status = 'COMPLETED' AND s.created_at >= ?
    ORDER BY s.created_at DESC`).all(since) as (Omit<RecentSale, 'items' | 'paymentMethod'> & { card: number })[]
  if (sales.length === 0) return []

  const lines = db.prepare(`
    SELECT l.sale_id AS saleId, l.variant_id AS productId,
           l.name_snapshot || CASE WHEN coalesce(l.variant_label_snapshot, '') <> '' THEN ' — ' || l.variant_label_snapshot ELSE '' END AS productName,
           l.qty AS quantity, l.unit_price AS price, l.line_discount + l.allocated_sale_discount AS discount
    FROM sale_lines l JOIN sales s ON s.id = l.sale_id
    WHERE s.status = 'COMPLETED' AND s.created_at >= ?
    ORDER BY l.rowid`).all(since) as (RecentSale['items'][number] & { saleId: string })[]
  const bySale = new Map<string, RecentSale['items']>()
  for (const { saleId, ...line } of lines) {
    const list = bySale.get(saleId) ?? []
    list.push(line)
    bySale.set(saleId, list)
  }
  return sales.map(({ card, ...s }) => ({
    ...s,
    // A sale paid mostly by card shows as card; the exact split is in the sale detail.
    paymentMethod: card * 2 > Math.abs(s.total) ? 'card' : 'cash',
    items: bySale.get(s.id) ?? [],
  }))
}
