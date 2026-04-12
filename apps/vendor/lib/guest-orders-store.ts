import { randomUUID } from "crypto"
import {
  getGuestOrdersPath,
  getGuestTablesPath,
  readJsonFile,
  writeJsonFileAtomic,
} from "./restaurant-local-data"

export type GuestTable = { id: string; label: string; createdAt: number }

export type GuestOrderItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export type GuestOrder = {
  id: string
  tableId: string
  tableLabel: string
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  items: GuestOrderItem[]
  total: number
  note?: string
  createdAt: number
}

export function listTables(): GuestTable[] {
  const data = readJsonFile<{ tables?: GuestTable[] }>(getGuestTablesPath(), { tables: [] })
  return Array.isArray(data.tables) ? data.tables : []
}

export function saveTables(tables: GuestTable[]) {
  writeJsonFileAtomic(getGuestTablesPath(), { tables })
}

export function addTable(label: string): GuestTable {
  const tables = listTables()
  const row: GuestTable = { id: randomUUID(), label: label.trim() || "Table", createdAt: Date.now() }
  tables.push(row)
  saveTables(tables)
  return row
}

export function deleteTable(id: string): boolean {
  const prev = listTables()
  const tables = prev.filter((t) => t.id !== id)
  if (tables.length === prev.length) return false
  saveTables(tables)
  return true
}

export function getTableById(id: string): GuestTable | null {
  return listTables().find((t) => t.id === id) || null
}

export function listGuestOrders(): GuestOrder[] {
  const data = readJsonFile<{ orders?: GuestOrder[] }>(getGuestOrdersPath(), { orders: [] })
  return Array.isArray(data.orders) ? data.orders : []
}

function saveOrders(orders: GuestOrder[]) {
  writeJsonFileAtomic(getGuestOrdersPath(), { orders })
}

export function appendGuestOrder(input: {
  tableId: string
  items: GuestOrderItem[]
  note?: string
}): { ok: true; order: GuestOrder } | { ok: false; error: string } {
  const table = getTableById(input.tableId)
  if (!table) return { ok: false, error: "Invalid table" }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Cart is empty" }
  }
  const total = input.items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0)
  const order: GuestOrder = {
    id: randomUUID(),
    tableId: table.id,
    tableLabel: table.label,
    status: "PENDING",
    items: input.items.map((it) => ({
      productId: String(it.productId || ""),
      name: String(it.name || "Item"),
      quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
      unitPrice: Math.max(0, Number(it.unitPrice) || 0),
    })),
    total,
    note: input.note ? String(input.note).slice(0, 500) : undefined,
    createdAt: Date.now(),
  }
  const orders = listGuestOrders()
  orders.unshift(order)
  saveOrders(orders)
  return { ok: true, order }
}

export function updateGuestOrderStatus(
  id: string,
  status: GuestOrder["status"],
): { ok: true; order: GuestOrder } | { ok: false; error: string } {
  const orders = listGuestOrders()
  const idx = orders.findIndex((o) => o.id === id)
  if (idx < 0) return { ok: false, error: "Order not found" }
  const next = { ...orders[idx], status }
  orders[idx] = next
  saveOrders(orders)
  return { ok: true, order: next }
}
