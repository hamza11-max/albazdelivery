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
    fetchFromAPI(buildUrl('/api/erp/sales')),
    fetchFromAPI(buildUrl('/api/vendors/orders')),
    fetchFromAPI(buildUrl('/api/erp/inventory')),
    fetchFromAPI(buildUrl('/api/erp/customers')),
    fetchFromAPI(buildUrl('/api/erp/suppliers')),
    fetchFromAPI(buildUrl('/api/erp/categories'))
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
    fetchFromAPI(buildUrl('/api/erp/inventory')),
    fetchFromAPI(buildUrl('/api/erp/categories'))
  ])

  return {
    products: Array.isArray(productsResponse?.products) ? productsResponse.products : [],
    categories: Array.isArray(categoriesResponse?.categories) ? categoriesResponse.categories : []
  }
}