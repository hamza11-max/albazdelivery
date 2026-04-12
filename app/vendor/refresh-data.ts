// Direct API fetch functions - do not use hooks here
// These functions are called from components that already have the hook context

import type { InventoryProduct } from "@/root/lib/types"

async function fetchFromAPI<T>(url: string): Promise<T> {
  const response = await fetch(url)
  let body: any = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body?.error?.message ||
      body?.message ||
      response.statusText ||
      `HTTP ${response.status}`
    throw new Error(`HTTP ${response.status}: ${message}`)
  }

  return body as T
}

export async function fetchDashboardData(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const settled = await Promise.allSettled([
    fetchFromAPI<{ sales?: unknown[] }>(buildUrl('/api/erp/sales')),
    fetchFromAPI<{ orders?: unknown[] }>(buildUrl('/api/vendors/orders')),
    fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory')),
    fetchFromAPI<{ customers?: unknown[] }>(buildUrl('/api/erp/customers')),
    fetchFromAPI<{ suppliers?: unknown[] }>(buildUrl('/api/erp/suppliers')),
    fetchFromAPI<{ categories?: unknown[] }>(buildUrl('/api/erp/categories'))
  ])

  const salesResponse = settled[0].status === 'fulfilled' ? settled[0].value : {}
  const ordersResponse = settled[1].status === 'fulfilled' ? settled[1].value : {}
  const productsResponse = settled[2].status === 'fulfilled' ? settled[2].value : {}
  const customersResponse = settled[3].status === 'fulfilled' ? settled[3].value : {}
  const suppliersResponse = settled[4].status === 'fulfilled' ? settled[4].value : {}
  const categoriesResponse = settled[5].status === 'fulfilled' ? settled[5].value : {}

  settled.forEach((result, index) => {
    if (result.status === 'rejected') {
      const labels = ['sales', 'orders', 'inventory', 'customers', 'suppliers', 'categories']
      console.warn(`[Vendor] Failed to refresh ${labels[index]}:`, result.reason)
    }
  })

  return {
    salesData: Array.isArray(salesResponse?.sales) ? salesResponse.sales : [],
    ordersData: Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [],
    productsData: Array.isArray(productsResponse?.products) ? productsResponse.products : [],
    customersData: Array.isArray(customersResponse?.customers) ? customersResponse.customers : [],
    suppliersData: Array.isArray(suppliersResponse?.suppliers) ? suppliersResponse.suppliers : [],
    categoriesData: Array.isArray(categoriesResponse?.categories) ? categoriesResponse.categories : []
  }
}

export async function fetchInventory(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const settled = await Promise.allSettled([
    fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory')),
    fetchFromAPI<{ categories?: unknown[] }>(buildUrl('/api/erp/categories'))
  ])

  const productsResponse = settled[0].status === 'fulfilled' ? settled[0].value : {}
  const categoriesResponse = settled[1].status === 'fulfilled' ? settled[1].value : {}

  if (settled[0].status === 'rejected') {
    console.warn('[Vendor] Failed to refresh inventory products:', settled[0].reason)
  }
  if (settled[1].status === 'rejected') {
    console.warn('[Vendor] Failed to refresh inventory categories:', settled[1].reason)
  }

  return {
    products: Array.isArray(productsResponse?.products) ? productsResponse.products : [],
    categories: Array.isArray(categoriesResponse?.categories) ? categoriesResponse.categories : []
  }
}

export async function fetchProducts(vendorId?: string): Promise<InventoryProduct[]> {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const response = await fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory'))
  return (Array.isArray(response?.products) ? response.products : []) as InventoryProduct[]
}

export async function fetchCustomers(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const response = await fetchFromAPI<{ customers?: unknown[] }>(buildUrl('/api/erp/customers'))
  return Array.isArray(response?.customers) ? response.customers : []
}

export async function fetchSuppliers(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const response = await fetchFromAPI<{ suppliers?: unknown[] }>(buildUrl('/api/erp/suppliers'))
  return Array.isArray(response?.suppliers) ? response.suppliers : []
}