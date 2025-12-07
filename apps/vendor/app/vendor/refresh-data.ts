// Direct API fetch functions - do not use hooks here
// These functions are called from components that already have the hook context

async function fetchFromAPI<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchDashboardData(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const [
    salesResponse,
    ordersResponse,
    productsResponse,
    customersResponse,
    suppliersResponse,
    categoriesResponse
  ] = await Promise.all([
    fetchFromAPI<{ sales?: unknown[] }>(buildUrl('/api/erp/sales')),
    fetchFromAPI<{ orders?: unknown[] }>(buildUrl('/api/vendors/orders')),
    fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory')),
    fetchFromAPI<{ customers?: unknown[] }>(buildUrl('/api/erp/customers')),
    fetchFromAPI<{ suppliers?: unknown[] }>(buildUrl('/api/erp/suppliers')),
    fetchFromAPI<{ categories?: unknown[] }>(buildUrl('/api/erp/categories'))
  ])

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

  const [productsResponse, categoriesResponse] = await Promise.all([
    fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory')),
    fetchFromAPI<{ categories?: unknown[] }>(buildUrl('/api/erp/categories'))
  ])

  return {
    products: Array.isArray(productsResponse?.products) ? productsResponse.products : [],
    categories: Array.isArray(categoriesResponse?.categories) ? categoriesResponse.categories : []
  }
}

export async function fetchProducts(vendorId?: string) {
  const buildUrl = (basePath: string) => {
    if (!vendorId) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}vendorId=${vendorId}`
  }

  const response = await fetchFromAPI<{ products?: unknown[] }>(buildUrl('/api/erp/inventory'))
  return Array.isArray(response?.products) ? response.products : []
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