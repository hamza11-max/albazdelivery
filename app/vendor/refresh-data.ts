import { useDashboardData } from "./fetch-data";

export async function fetchDashboardData() {
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
    fetchSales(),
    fetchOrders(),
    fetchProducts(),
    fetchCustomers(), 
    fetchSuppliers(),
    fetchCategories()
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

export async function fetchInventory() {
  const { fetchProducts, fetchCategories } = useDashboardData()
  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories()
  ])
  return { products, categories }
}