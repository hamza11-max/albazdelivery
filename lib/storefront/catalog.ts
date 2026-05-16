import 'server-only'
import { prisma } from '@/lib/prisma'

export type StorefrontCatalogSort =
  | 'name_asc'
  | 'price_asc'
  | 'price_desc'
  | 'popular'

export interface StorefrontCatalogFilters {
  category?: string | null
  search?: string | null
  sort?: StorefrontCatalogSort | string | null
  limitPerStore?: number
}

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

export interface StorefrontCategory {
  id: string
  slug: string
  name: string
  productCount: number
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
  categories: StorefrontCategory[]
  featuredProducts: StorefrontCatalogProduct[]
  totalProducts: number
}

export async function getVendorCatalog(
  vendorId: string,
  filters: StorefrontCatalogFilters = {}
): Promise<StorefrontCatalog> {
  const categoryFilter = normalizeCategorySlug(filters.category)
  const search = filters.search?.trim()
  const take = normalizeLimit(filters.limitPerStore)

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
        where: {
          available: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  {
                    description: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: getProductOrderBy(filters.sort),
        ...(take ? { take } : {}),
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

  const categoryMap = new Map<string, StorefrontCategory>()
  const mappedStores = stores.map((store) => {
    const products = store.products
      .map((product) => {
        const slug = normalizeCategorySlug(product.category)
        if (slug && product.category) {
          const existing = categoryMap.get(slug)
          categoryMap.set(slug, {
            id: slug,
            slug,
            name: existing?.name || product.category,
            productCount: (existing?.productCount || 0) + 1,
          })
        }
        return product
      })
      .filter((product) => {
        if (!categoryFilter) return true
        return normalizeCategorySlug(product.category) === categoryFilter
      })

    return { ...store, products }
  })

  const totalProducts = mappedStores.reduce(
    (acc, store) => acc + store.products.length,
    0
  )
  const featuredProducts = mappedStores
    .flatMap((store) => store.products)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, 8)
  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return { stores: mappedStores, categories, featuredProducts, totalProducts }
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

export async function getVendorCategories(
  vendorId: string
): Promise<StorefrontCategory[]> {
  const catalog = await getVendorCatalog(vendorId)
  return catalog.categories
}

export function normalizeCategorySlug(value?: string | null): string | null {
  const raw = value?.trim()
  if (!raw) return null
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeLimit(value?: number): number | undefined {
  if (!value || !Number.isFinite(value)) return undefined
  return Math.min(Math.max(Math.trunc(value), 1), 48)
}

function getProductOrderBy(sort?: StorefrontCatalogSort | string | null) {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' as const }, { name: 'asc' as const }]
    case 'price_desc':
      return [{ price: 'desc' as const }, { name: 'asc' as const }]
    case 'popular':
      return [{ rating: 'desc' as const }, { name: 'asc' as const }]
    case 'name_asc':
    default:
      return [{ name: 'asc' as const }]
  }
}
