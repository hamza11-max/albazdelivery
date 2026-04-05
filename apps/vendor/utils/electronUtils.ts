"use client"

import type { Sale } from "@/root/lib/types"
import type { TopProductData } from "../app/vendor/types"
import { safeLocalStorageGet, safeLocalStorageSet, handleError, StorageError } from "./errorHandling"

type OfflineQueueEntryReschedule = { id: string; payload?: any; createdAt?: string; status?: string }

function normalizeSaleCreatedAt(s: Sale): Sale {
  return {
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt as unknown as string),
  }
}

/** Build a Sale row from a queued API payload (web offline) for Historique. */
function saleFromOfflineQueueEntry(entry: OfflineQueueEntryReschedule): Sale | null {
  const p = entry.payload
  if (!p?.items || !Array.isArray(p.items)) return null
  try {
    const items = p.items.map((i: any) => ({
      productId: typeof i.productId === "number" ? i.productId : Number.parseInt(String(i.productId), 10) || (i.productId as number),
      productName: i.productName || "",
      quantity: i.quantity,
      price: i.price,
      discount: i.discount ?? 0,
    }))
    const pm = String(p.paymentMethod || "CASH").toLowerCase() === "card" ? "card" : "cash"
    const subtotal =
      typeof p.subtotal === "number" ? p.subtotal : items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0)
    const discount = p.discount ?? 0
    const total = typeof p.total === "number" ? p.total : subtotal - discount
    return normalizeSaleCreatedAt({
      id: String(entry.id),
      items,
      subtotal,
      discount,
      total,
      paymentMethod: pm,
      createdAt: new Date(entry.createdAt || Date.now()),
    })
  } catch {
    return null
  }
}

/**
 * Single history list for offline / POS: persisted electron sales plus rows implied by
 * `offline-sales-queue` (web POS when the API is unreachable).
 */
export function getMergedLocalSalesHistory(): Sale[] {
  const fromStorage = safeLocalStorageGet<Sale[]>("electron-sales", [])
  const byId = new Map<string, Sale>()
  for (const s of fromStorage) {
    byId.set(String(s.id), normalizeSaleCreatedAt(s))
  }
  const queued = safeLocalStorageGet<OfflineQueueEntryReschedule[]>("offline-sales-queue", [])
  for (const q of queued) {
    const id = String(q.id)
    if (byId.has(id)) continue
    const synthetic = saleFromOfflineQueueEntry(q)
    if (synthetic) byId.set(id, synthetic)
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/** After a queued sale syncs to the API, drop the provisional Historique row (server copy loads via fetch). */
export function removeLocalProvisionalSale(saleId: string): void {
  try {
    const arr = safeLocalStorageGet<Sale[]>("electron-sales", [])
    const filtered = arr.filter((s) => String(s.id) !== String(saleId))
    if (filtered.length !== arr.length) {
      safeLocalStorageSet("electron-sales", filtered)
    }
  } catch {
    /* ignore */
  }
}

/** IDs that use `electron-inventory` in localStorage. Matches offline Electron vendors; avoids the in-memory API map that resets when the app exits. */
export function isElectronOfflineInventoryVendorId(vid: string | undefined | null): boolean {
  const v = typeof vid === "string" ? vid.trim() : ""
  if (v === "" || v === "electron-vendor") return true
  return v.startsWith("electron-") || v.startsWith("local-")
}

interface LoadElectronOfflineDataParams {
  setProducts: (products: any[]) => void
  setLowStockProducts: (products: any[]) => void
  setSales: (sales: any[]) => void
  setSuppliers: (suppliers: any[]) => void
  setCustomers: (customers: any[]) => void
  setTodaySales: (sales: number) => void
  setWeekSales: (sales: number) => void
  setMonthSales: (sales: number) => void
  setTopProducts: (products: TopProductData[]) => void
}

export function loadElectronOfflineData({
  setProducts,
  setLowStockProducts,
  setSales,
  setSuppliers,
  setCustomers,
  setTodaySales,
  setWeekSales,
  setMonthSales,
  setTopProducts,
}: LoadElectronOfflineDataParams) {
  try {
    const storedProducts = safeLocalStorageGet<any[]>('electron-inventory', [])
    if (storedProducts.length > 0) {
      setProducts(storedProducts)
      setLowStockProducts(storedProducts.filter((p: any) => p.stock <= (p.lowStockThreshold ?? 10)))
    }
    
    const mergedSales = getMergedLocalSalesHistory()
    setSales(mergedSales)

    const storedSuppliers = safeLocalStorageGet<any[]>('electron-suppliers', [])
    if (storedSuppliers.length > 0) {
      setSuppliers(storedSuppliers)
    }
    
    const storedCustomers = safeLocalStorageGet<any[]>('electron-customers', [])
    if (storedCustomers.length > 0) {
      setCustomers(storedCustomers)
    }
    
    // Compute offline dashboard stats (includes queued web-offline sales)
    if (mergedSales.length > 0) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const todayTotal = mergedSales
        .filter((s: any) => new Date(s.createdAt) >= todayStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      const weekTotal = mergedSales
        .filter((s: any) => new Date(s.createdAt) >= weekStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      const monthTotal = mergedSales
        .filter((s: any) => new Date(s.createdAt) >= monthStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      
      setTodaySales(todayTotal)
      setWeekSales(weekTotal)
      setMonthSales(monthTotal)
      
      // Compute top products from sales
      const productSales: Record<string, { name: string; qty: number; total: number }> = {}
      mergedSales.forEach((sale: any) => {
        sale.items?.forEach((item: any) => {
          // Use productId as key, fallback to productName if productId is missing
          const id = item.productId != null ? String(item.productId) : item.productName
          if (!productSales[id]) {
            productSales[id] = { name: item.productName, qty: 0, total: 0 }
          }
          productSales[id].qty += item.quantity
          productSales[id].total += item.price * item.quantity
        })
      })
      const topList: TopProductData[] = Object.entries(productSales)
        .map(([id, data]) => {
          // Try to parse as number, use 0 if it's a productName (string)
          const productId = !isNaN(Number(id)) ? Number(id) : 0
          return {
            productId,
            productName: data.name,
            totalQuantity: data.qty,
            totalSales: data.total,
            totalSold: data.qty
          }
        })
        .filter(item => item.productId > 0) // Filter out entries without valid productId
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5)
      setTopProducts(topList)
    }
  } catch (e) {
    handleError(new StorageError('Failed to load offline data', e), {
      showToast: false,
      logError: true,
    })
  }
}

