import { withReadonlyVendorDatabase, type VendorOfflineDatabase } from "./vendor-offline-sqlite"
import { getGuestMenuHiddenSet } from "./guest-menu-product-state"

export type GuestMenuProduct = {
  id: string
  name: string
  description?: string
  sellingPrice: number
  image?: string
  category?: string
}

/** Row shape returned by SQLite for the guest menu SELECT */
type ProductSelectRow = {
  id: string
  name: string
  description: string | null
  sellingPrice: number | null
  image: string | null
  category: string | null
  stock: number | null
}

function normalizeProductRow(row: ProductSelectRow): GuestMenuProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : undefined,
    sellingPrice: Number(row.sellingPrice) || 0,
    image: row.image != null ? String(row.image) : undefined,
    category: row.category != null ? String(row.category) : undefined,
  }
}

const GUEST_MENU_SQL = `
  SELECT id, name, description, sellingPrice, image, category, stock
  FROM products
  ORDER BY name COLLATE NOCASE
`

/** Stock map from offline DB (empty if DB missing). */
export function loadGuestMenuStockByProductId(): Map<string, number> {
  const result = withReadonlyVendorDatabase((db: VendorOfflineDatabase) => {
    const map = new Map<string, number>()
    const stmt = db.prepare<[], ProductSelectRow>(GUEST_MENU_SQL)
    const rows = stmt.all()
    for (const row of rows) {
      map.set(String(row.id), Number(row.stock) || 0)
    }
    return map
  })
  return result ?? new Map()
}

/**
 * Products visible on the public QR menu: in SQLite, stock > 0, not 86'd (hidden file).
 */
export function listProductsForGuestMenu(): GuestMenuProduct[] {
  const hidden = getGuestMenuHiddenSet()
  const result = withReadonlyVendorDatabase((db: VendorOfflineDatabase) => {
    const stmt = db.prepare<[], ProductSelectRow>(GUEST_MENU_SQL)
    const rows = stmt.all()
    return rows
      .filter((row) => {
        const stock = Number(row.stock) || 0
        if (stock <= 0) return false
        if (hidden.has(String(row.id))) return false
        return true
      })
      .map((row) => normalizeProductRow(row))
  })
  return result ?? []
}

export type GuestCartLineInput = { productId: string; quantity: number }

/**
 * Validates guest cart against current hidden list + SQLite stock.
 */
export function validateGuestCartItems(items: GuestCartLineInput[]): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Cart is empty" }
  }
  const hidden = getGuestMenuHiddenSet()
  const stockMap = loadGuestMenuStockByProductId()
  for (const it of items) {
    const pid = String(it.productId || "").trim()
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 1))
    if (!pid) return { ok: false, error: "Invalid product" }
    if (hidden.has(pid)) {
      return { ok: false, error: "One or more items are no longer available" }
    }
    const stock = stockMap.has(pid) ? (stockMap.get(pid) as number) : 0
    if (stock < qty) {
      return { ok: false, error: "Insufficient stock for one or more items" }
    }
  }
  return { ok: true }
}
