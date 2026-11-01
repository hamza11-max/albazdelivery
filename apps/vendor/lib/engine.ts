"use client"

import type { Customer, InventoryProduct, Sale, Supplier } from "@/root/lib/types"
import type { CustomerRow, FlatItem, Outputs, RecentSale, Supplier as EngineSupplier } from "../electron/shared/ipc"

/**
 * The desktop app's local engine (electron/core): one SQLite database in the main
 * process, reached over typed IPC. Prices, totals, stock and sale numbers are decided
 * there; this module only calls it and maps its rows to the screens' types.
 */
type Channel = keyof Outputs
type Bridge = { invoke: (channel: string, input?: unknown) => Promise<{ ok: true; data: unknown } | { ok: false; error: { code: string; message: string } }> }

const bridge = (): Bridge | null =>
  typeof window !== "undefined" ? ((window as any).electronAPI?.core as Bridge | undefined) ?? null : null

/** True in the desktop app: data lives in the local engine, not in localStorage or the cloud API. */
export function hasEngine(): boolean {
  return bridge() !== null
}

export class EngineError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = "EngineError"
  }
}

export async function engine<K extends Channel>(channel: K, input?: unknown): Promise<Outputs[K]> {
  const b = bridge()
  if (!b) throw new EngineError("NO_ENGINE", "Desktop app only")
  const result = await b.invoke(channel, input)
  if (!result.ok) throw new EngineError(result.error.code, result.error.message)
  return result.data as Outputs[K]
}

// ---------- mapping to the vendor screens' types ----------

export function toInventoryProduct(i: FlatItem): InventoryProduct {
  return {
    id: i.variantId,
    sku: i.sku,
    name: i.displayName,
    category: i.category,
    costPrice: i.costPrice,
    sellingPrice: i.salePrice,
    price: i.salePrice,
    stock: i.stock,
    lowStockThreshold: i.lowStockThreshold,
    barcode: i.barcode || undefined,
    createdAt: new Date(i.createdAt),
    updatedAt: new Date(i.updatedAt),
  }
}

/** A sale as the screens show it, with its receipt number and type (returns are negative). */
export type EngineSale = Sale & { number: string; type: "SALE" | "RETURN" }

export function toSale(s: RecentSale): EngineSale {
  return {
    id: s.id,
    number: s.number,
    type: s.type,
    items: s.items,
    subtotal: s.subtotal,
    discount: s.discount,
    total: s.total,
    paymentMethod: s.paymentMethod,
    createdAt: new Date(s.createdAt),
  }
}

/** A customer as the vendor screens show it, plus their credit book. */
export type EngineCustomer = Customer & { balance: number; creditLimit: number | null; note: string }

export function toCustomer(c: CustomerRow): EngineCustomer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    totalPurchases: c.salesTotal,
    orderCount: c.salesCount,
    lastPurchaseDate: c.lastSaleAt ? new Date(c.lastSaleAt) : undefined,
    createdAt: new Date(c.createdAt),
    balance: c.balance,
    creditLimit: c.creditLimit,
    note: c.note,
  }
}

export type EngineSupplierRow = Supplier & { deliveries: number; purchasesTotal: number; note: string }

export function toSupplier(s: EngineSupplier): EngineSupplierRow {
  return { id: s.id, name: s.name, contactPerson: "", phone: s.phone, productsSupplied: [], createdAt: new Date(), deliveries: s.deliveries, purchasesTotal: s.purchasesTotal, note: s.note }
}

export async function engineCustomers(): Promise<EngineCustomer[]> {
  return (await engine("customers:list", { query: "", withDebtOnly: false })).map(toCustomer)
}

export async function engineSuppliers(): Promise<EngineSupplierRow[]> {
  return (await engine("suppliers:list")).map(toSupplier)
}

/**
 * Prints a sale's or return's receipt on the engine's receipt printer (Arabic as an image, ESC/POS).
 * Returns why nothing printed (no printer set up) instead of throwing; a printer error throws.
 */
export async function enginePrintReceipt(saleId: string): Promise<{ printed: boolean; reason?: string }> {
  return engine("sell:printReceipt", { saleId })
}

export async function engineInventory(): Promise<InventoryProduct[]> {
  return (await engine("catalog:items")).map(toInventoryProduct)
}

export async function engineSales(days = 90): Promise<EngineSale[]> {
  return (await engine("sales:recent", { days })).map(toSale)
}

/** Whole dinars: the engine refuses fractions, so screens round what people type. */
export const dinars = (n: unknown): number => Math.max(0, Math.round(Number(n) || 0))

/** Saves a product form. `stock` is the counted quantity; a change becomes an ADJUST movement. */
export async function engineSaveProduct(p: Partial<InventoryProduct> & { name: string }, stockReason = ""): Promise<InventoryProduct> {
  const saved = await engine("catalog:saveItem", {
    variantId: p.id ? String(p.id) : undefined,
    name: p.name,
    category: p.category ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    costPrice: dinars(p.costPrice),
    salePrice: dinars(p.sellingPrice ?? p.price),
    lowStockThreshold: p.lowStockThreshold == null ? null : dinars(p.lowStockThreshold),
    stock: p.stock == null ? undefined : dinars(p.stock),
    stockReason,
  })
  return toInventoryProduct(saved)
}

/**
 * Records a POS sale. The engine prices it from its own catalog; the screen sends only
 * which items, how many, and discounts. The register is opened (float 0) on the first
 * sale of a session if nobody opened it.
 */
export async function engineCompleteSale(input: {
  id: string
  lines: { variantId: string; qty: number; lineDiscount?: number }[]
  saleDiscount?: number
  /** credit = the whole sale on the customer's account (carnet). */
  paymentMethod: "cash" | "card" | "credit"
  customerId?: string
  /** Cash handed over; defaults to the exact total. */
  cashTendered?: number
}): Promise<Outputs["sell:complete"]> {
  const shift = await engine("shift:status")
  if (!shift.open) await engine("shift:open", { openingFloat: 0 })
  const lines = input.lines.map((l) => ({ variantId: l.variantId, qty: l.qty, lineDiscount: dinars(l.lineDiscount) }))
  const saleDiscount = dinars(input.saleDiscount)
  // Exact amount unless told otherwise: the engine rejects a payment short of its own total
  // with INSUFFICIENT_PAYMENT, so a stale price on screen can't record a wrong sale.
  const preview = await engine("catalog:variantInfo", { variantIds: [...new Set(lines.map((l) => l.variantId))] })
  const priceOf = new Map(preview.map((v) => [v.variantId, v.price]))
  const expected = Math.max(0, lines.reduce((s, l) => s + (priceOf.get(l.variantId) ?? 0) * l.qty - l.lineDiscount, 0) - saleDiscount)
  const amount = input.paymentMethod === "cash" ? Math.max(expected, dinars(input.cashTendered ?? expected)) : expected
  const method = input.paymentMethod === "card" ? "CARD_EXTERNAL" : input.paymentMethod === "credit" ? "CREDIT" : "CASH"
  return engine("sell:complete", {
    id: input.id,
    lines,
    saleDiscount,
    customerId: input.customerId,
    tenders: amount > 0 ? [{ method, amount }] : [],
  })
}
