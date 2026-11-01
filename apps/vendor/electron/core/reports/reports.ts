import type Database from 'better-sqlite3'

import type { Report } from '../../shared/ipc'

/**
 * Reports for a period, computed in SQL from the sale records (never from screen totals).
 * - Completed sales and returns count; voided sales are listed apart.
 * - Revenue is net: line totals after line and sale discounts, returns subtracted.
 * - Cost is the unit cost recorded on each sale line, so margin doesn't move when costs change later.
 * - Days are the shop's local days (the PC's time zone).
 * `from` is inclusive, `to` exclusive (ISO instants).
 */
export function report(db: Database.Database, from: string, to: string): Report {
  const inRange = `s.status = 'COMPLETED' AND s.created_at >= @from AND s.created_at < @to`
  const params = { from, to }
  // Net amount and cost of each line: what was really paid for it.
  const lineNet = 'l.line_total - l.allocated_sale_discount'
  const lineCost = 'l.unit_cost * l.qty'

  const t = db.prepare(`
    SELECT
      coalesce(SUM(CASE WHEN s.type = 'SALE' THEN 1 END), 0) AS salesCount,
      coalesce(SUM(CASE WHEN s.type = 'RETURN' THEN 1 END), 0) AS returnsCount,
      coalesce(SUM(CASE WHEN s.type = 'SALE' THEN s.subtotal END), 0) AS gross,
      coalesce(SUM(CASE WHEN s.type = 'SALE' THEN s.discount_total END), 0) AS discounts,
      coalesce(SUM(CASE WHEN s.type = 'RETURN' THEN -s.total END), 0) AS returns,
      coalesce(SUM(s.total), 0) AS revenue
    FROM sales s WHERE ${inRange}`).get(params) as Omit<Report['totals'], 'cost' | 'margin' | 'marginPercent' | 'averageBasket' | 'cash' | 'card' | 'credit' | 'voidedCount' | 'voidedTotal'>

  const cost = (db.prepare(`SELECT coalesce(SUM(${lineCost}), 0) AS c FROM sale_lines l JOIN sales s ON s.id = l.sale_id WHERE ${inRange}`).get(params) as { c: number }).c
  const pay = db.prepare(`
    SELECT coalesce(SUM(CASE WHEN p.method = 'CASH' THEN p.amount END), 0) AS cash,
           coalesce(SUM(CASE WHEN p.method = 'CARD_EXTERNAL' THEN p.amount END), 0) AS card,
           coalesce(SUM(CASE WHEN p.method = 'CREDIT' THEN p.amount END), 0) AS credit
    FROM payments p JOIN sales s ON s.id = p.sale_id WHERE ${inRange}`).get(params) as { cash: number; card: number; credit: number }
  const voided = db.prepare(`SELECT COUNT(*) AS n, coalesce(SUM(total), 0) AS total FROM sales s WHERE s.status = 'VOIDED' AND s.created_at >= @from AND s.created_at < @to`).get(params) as { n: number; total: number }

  const margin = t.revenue - cost
  const totals: Report['totals'] = {
    ...t,
    cost,
    margin,
    marginPercent: t.revenue > 0 ? Math.round((margin * 1000) / t.revenue) / 10 : 0,
    averageBasket: t.salesCount > 0 ? Math.round((t.revenue + t.returns) / t.salesCount) : 0,
    ...pay,
    voidedCount: voided.n,
    voidedTotal: voided.total,
  }

  const daily = db.prepare(`
    SELECT date(s.created_at, 'localtime') AS date,
           SUM(CASE WHEN s.type = 'SALE' THEN 1 ELSE 0 END) AS count,
           SUM(${lineNet}) AS revenue, SUM(${lineNet}) - SUM(${lineCost}) AS margin
    FROM sale_lines l JOIN sales s ON s.id = l.sale_id WHERE ${inRange}
    GROUP BY date(s.created_at, 'localtime') ORDER BY date`).all(params) as Report['daily']
  // A day's sale count counts sales, not lines.
  const countByDay = new Map((db.prepare(`SELECT date(s.created_at, 'localtime') AS date, COUNT(*) AS n FROM sales s WHERE ${inRange} AND s.type = 'SALE' GROUP BY 1`).all(params) as { date: string; n: number }[]).map((r) => [r.date, r.n]))
  for (const d of daily) d.count = countByDay.get(d.date) ?? 0

  const products = db.prepare(`
    SELECT l.variant_id AS variantId,
           l.name_snapshot || CASE WHEN coalesce(l.variant_label_snapshot, '') <> '' THEN ' — ' || l.variant_label_snapshot ELSE '' END AS name,
           coalesce(c.name, '') AS category,
           SUM(l.qty) AS qty, SUM(${lineNet}) AS revenue, SUM(${lineCost}) AS cost, SUM(${lineNet}) - SUM(${lineCost}) AS margin
    FROM sale_lines l JOIN sales s ON s.id = l.sale_id
    JOIN variants v ON v.id = l.variant_id JOIN products p ON p.id = v.product_id LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${inRange}
    GROUP BY l.variant_id ORDER BY revenue DESC, name`).all(params) as Report['products']

  const categories = db.prepare(`
    SELECT coalesce(c.name, '') AS category, SUM(l.qty) AS qty, SUM(${lineNet}) AS revenue, SUM(${lineNet}) - SUM(${lineCost}) AS margin
    FROM sale_lines l JOIN sales s ON s.id = l.sale_id
    JOIN variants v ON v.id = l.variant_id JOIN products p ON p.id = v.product_id LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${inRange}
    GROUP BY coalesce(c.name, '') ORDER BY revenue DESC`).all(params) as Report['categories']

  const cashiers = db.prepare(`
    SELECT u.name, SUM(CASE WHEN s.type = 'SALE' THEN 1 ELSE 0 END) AS count, SUM(s.total) AS revenue,
           SUM(CASE WHEN s.type = 'SALE' THEN s.discount_total ELSE 0 END) AS discounts
    FROM sales s JOIN users u ON u.id = s.user_id WHERE ${inRange}
    GROUP BY u.id ORDER BY revenue DESC`).all(params) as Report['cashiers']

  const customers = db.prepare(`
    SELECT c.id AS customerId, c.name, SUM(CASE WHEN s.type = 'SALE' THEN 1 ELSE 0 END) AS count, SUM(s.total) AS revenue,
           coalesce((SELECT SUM(amount) FROM customer_ledger g WHERE g.customer_id = c.id), 0) AS balance
    FROM sales s JOIN customers c ON c.id = s.customer_id WHERE ${inRange}
    GROUP BY c.id ORDER BY revenue DESC`).all(params) as Report['customers']

  const sales = db.prepare(`
    SELECT s.id, s.number, s.type, s.created_at AS createdAt, u.name AS cashier, s.subtotal, s.discount_total AS discount, s.total,
           coalesce(c.name, '') AS customer
    FROM sales s JOIN users u ON u.id = s.user_id LEFT JOIN customers c ON c.id = s.customer_id
    WHERE ${inRange} ORDER BY s.created_at`).all(params) as Report['sales']

  const payments = db.prepare(`
    SELECT CASE p.method WHEN 'CARD_EXTERNAL' THEN 'card' WHEN 'CREDIT' THEN 'credit' ELSE 'cash' END AS method,
           COUNT(DISTINCT p.sale_id) AS count, SUM(p.amount) AS amount
    FROM payments p JOIN sales s ON s.id = p.sale_id WHERE ${inRange}
    GROUP BY p.method ORDER BY amount DESC`).all(params) as Report['payments']

  // Stock value is "now", whatever the period.
  const stockValue = db.prepare(`
    SELECT coalesce(SUM(CASE WHEN v.stock_qty > 0 THEN v.stock_qty END), 0) AS units,
           coalesce(SUM(CASE WHEN v.stock_qty > 0 THEN v.stock_qty * coalesce(v.cost_price, p.cost_price) END), 0) AS atCost,
           coalesce(SUM(CASE WHEN v.stock_qty > 0 THEN v.stock_qty * coalesce(v.sale_price, p.sale_price) END), 0) AS atPrice
    FROM variants v JOIN products p ON p.id = v.product_id WHERE v.archived_at IS NULL AND p.archived_at IS NULL`).get() as Report['stockValue']

  return { from, to, totals, daily, products, categories, cashiers, customers, payments, sales, stockValue }
}
