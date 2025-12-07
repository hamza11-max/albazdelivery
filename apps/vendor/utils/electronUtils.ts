"use client"

import type { TopProductData } from "../app/vendor/types"
import { safeLocalStorageGet, handleError, StorageError } from "./errorHandling"

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
    
    const storedSales = safeLocalStorageGet<any[]>('electron-sales', [])
    if (storedSales.length > 0) {
      setSales(storedSales)
    }
    
    const storedSuppliers = safeLocalStorageGet<any[]>('electron-suppliers', [])
    if (storedSuppliers.length > 0) {
      setSuppliers(storedSuppliers)
    }
    
    const storedCustomers = safeLocalStorageGet<any[]>('electron-customers', [])
    if (storedCustomers.length > 0) {
      setCustomers(storedCustomers)
    }
    
    // Compute offline dashboard stats
    if (storedSales.length > 0) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const todayTotal = storedSales
        .filter((s: any) => new Date(s.createdAt) >= todayStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      const weekTotal = storedSales
        .filter((s: any) => new Date(s.createdAt) >= weekStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      const monthTotal = storedSales
        .filter((s: any) => new Date(s.createdAt) >= monthStart)
        .reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      
      setTodaySales(todayTotal)
      setWeekSales(weekTotal)
      setMonthSales(monthTotal)
      
      // Compute top products from sales
      const productSales: Record<string, { name: string; qty: number; total: number }> = {}
      storedSales.forEach((sale: any) => {
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

