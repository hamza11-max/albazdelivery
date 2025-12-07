"use client"

import type { ProductForm, CustomerForm } from "../app/vendor/types"

export function resetProductForm(): ProductForm {
  return {
    sku: "",
    name: "",
    category: "",
    description: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    price: "",
    stock: 0,
    lowStockThreshold: 0,
    barcode: "",
    image: ""
  }
}

export function resetCustomerForm(): CustomerForm {
  return {
    name: "",
    email: "",
    phone: "",
    address: ""
  }
}

