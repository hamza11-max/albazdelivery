import 'server-only'
import { prisma } from '@/lib/prisma'

export interface StorefrontCatalogProduct {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  image: string | null
  available: boolean
  category: string | null
  rating: number
}

export interface StorefrontCatalogStore {
  id: string
  name: string
  type: string
  address: string
  city: string
  phone: string | null
  rating: number
  deliveryTime: string
  isActive: boolean
  products: StorefrontCatalogProduct[]
}

export interface StorefrontCatalog {
  stores: StorefrontCatalogStore[]
  totalProducts: number
}

export async function getVendorCatalog(
  vendorId: string
): Promise<StorefrontCatalog> {
  const stores = await prisma.store.findMany({
    where: { vendorId, isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      city: true,
      phone: true,
      rating: true,
      deliveryTime: true,
      isActive: true,
      products: {
        where: { available: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          storeId: true,
          name: true,
          description: true,
          price: true,
          image: true,
          available: true,
          category: true,
          rating: true,
        },
      },
    },
  })

  const totalProducts = stores.reduce((acc, s) => acc + s.products.length, 0)

  return { stores, totalProducts }
}

export async function getVendorProduct(
  vendorId: string,
  productId: string
): Promise<{
  product: StorefrontCatalogProduct
  store: Pick<StorefrontCatalogStore, 'id' | 'name' | 'deliveryTime' | 'city'>
} | null> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      store: { vendorId, isActive: true },
    },
    select: {
      id: true,
      storeId: true,
      name: true,
      description: true,
      price: true,
      image: true,
      available: true,
      category: true,
      rating: true,
      store: {
        select: {
          id: true,
          name: true,
          deliveryTime: true,
          city: true,
        },
      },
    },
  })

  if (!product) return null

  const { store, ...productOnly } = product
  return { product: productOnly, store }
}
