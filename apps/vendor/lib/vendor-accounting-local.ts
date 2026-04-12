import { randomUUID } from "crypto"
import {
  getAccountingExpensesPath,
  readJsonFile,
  writeJsonFileAtomic,
} from "./restaurant-local-data"
import { withReadonlyVendorDatabase, type VendorOfflineDatabase } from "./vendor-offline-sqlite"

export type AccountingExpense = {
  id: string
  amount: number
  category: string
  note?: string
  createdAt: number
}

export function listExpenses(): AccountingExpense[] {
  const data = readJsonFile<{ expenses?: AccountingExpense[] }>(getAccountingExpensesPath(), {
    expenses: [],
  })
  return Array.isArray(data.expenses) ? data.expenses : []
}

export function addExpense(input: { amount: number; category: string; note?: string }): AccountingExpense {
  const row: AccountingExpense = {
    id: randomUUID(),
    amount: Math.max(0, Number(input.amount) || 0),
    category: String(input.category || "general").slice(0, 80),
    note: input.note ? String(input.note).slice(0, 500) : undefined,
    createdAt: Date.now(),
  }
  const expenses = listExpenses()
  expenses.unshift(row)
  writeJsonFileAtomic(getAccountingExpensesPath(), { expenses })
  return row
}

export type SaleRow = {
  id: string
  total: number
  paymentMethod?: string
  createdAt: number
}

type SaleSelectRow = {
  id: string
  total: number | null
  paymentMethod: string | null
  createdAt: number | null
}

function normalizeSaleRow(row: SaleSelectRow): SaleRow {
  return {
    id: String(row.id),
    total: Number(row.total) || 0,
    paymentMethod: row.paymentMethod != null ? String(row.paymentMethod) : undefined,
    createdAt: Number(row.createdAt) || 0,
  }
}

const SALES_RANGE_SQL = `
  SELECT id, total, paymentMethod, createdAt
  FROM sales
  WHERE createdAt >= ? AND createdAt <= ?
  ORDER BY createdAt DESC
`

export function listOfflineSalesInRange(fromMs: number, toMs: number): SaleRow[] {
  const result = withReadonlyVendorDatabase((db: VendorOfflineDatabase) => {
    const stmt = db.prepare<[number, number], SaleSelectRow>(SALES_RANGE_SQL)
    const rows = stmt.all(fromMs, toMs)
    return rows.map((row) => normalizeSaleRow(row))
  })
  return result ?? []
}

export function summarizeSales(rows: SaleRow[]) {
  let gross = 0
  const byPayment: Record<string, number> = {}
  for (const r of rows) {
    const t = Number(r.total) || 0
    gross += t
    const pm = (r.paymentMethod || "unknown").toLowerCase()
    byPayment[pm] = (byPayment[pm] || 0) + t
  }
  return { gross, count: rows.length, byPayment }
}

export function exportAccountingCsv(fromMs: number, toMs: number): string {
  const sales = listOfflineSalesInRange(fromMs, toMs)
  const expenses = listExpenses().filter((e) => e.createdAt >= fromMs && e.createdAt <= toMs)
  const lines = ["type,id,date_iso,amount,category,payment_method,note"]
  for (const s of sales) {
    lines.push(
      [
        "sale",
        s.id,
        new Date(s.createdAt).toISOString(),
        String(s.total),
        "",
        s.paymentMethod || "",
        "",
      ].join(","),
    )
  }
  for (const e of expenses) {
    lines.push(
      [
        "expense",
        e.id,
        new Date(e.createdAt).toISOString(),
        String(e.amount),
        e.category,
        "",
        (e.note || "").replace(/,/g, " "),
      ].join(","),
    )
  }
  return lines.join("\n")
}
