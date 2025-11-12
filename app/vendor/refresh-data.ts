import { useDashboardData } from "./fetch-data";

export async function fetchDashboardData(vendorId?: string) {
  const { 
    fetchSales,
    fetchOrders,
    fetchProducts,
    fetchCustomers,
    fetchSuppliers,
    fetchCategories
  } = useDashboardData()

  const [
    salesData,
    ordersData,
    productsData,
    customersData,
    suppliersData,
    categoriesData
  ] = await Promise.all([
    fetchSales(vendorId),
    fetchOrders(vendorId),
    fetchProducts(vendorId),
    fetchCustomers(vendorId),
    fetchSuppliers(vendorId),
    fetchCategories(vendorId)
  ])

  return {
    salesData,
    ordersData,
    productsData,
    customersData,
    suppliersData,
    categoriesData
  }
}

export async function fetchInventory(vendorId?: string) {
  const { fetchProducts, fetchCategories } = useDashboardData()
  const [products, categories] = await Promise.all([
    fetchProducts(vendorId),
    fetchCategories(vendorId)
  ])
  return { products, categories }
}