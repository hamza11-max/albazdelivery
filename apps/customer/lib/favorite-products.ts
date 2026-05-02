const STORAGE_KEY = 'albaz-favorite-product-ids'
const META_KEY = 'albaz-favorite-product-meta'

export type FavoriteProductMeta = {
  storeId: string
  categoryId: number
  name: string
  price: number
  image?: string
  storeName?: string
}

export function getFavoriteProductIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function setFavoriteProductIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

function notifyFavoritesChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('albaz-favorites'))
}

export function getFavoriteMetaMap(): Record<string, FavoriteProductMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, FavoriteProductMeta>
  } catch {
    return {}
  }
}

function setFavoriteMetaMap(map: Record<string, FavoriteProductMeta>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(META_KEY, JSON.stringify(map))
}

export function upsertFavoriteMeta(productId: string, meta: FavoriteProductMeta): void {
  const map = { ...getFavoriteMetaMap(), [productId]: meta }
  setFavoriteMetaMap(map)
}

export function removeFavoriteMeta(productId: string): void {
  const map = { ...getFavoriteMetaMap() }
  delete map[productId]
  setFavoriteMetaMap(map)
}

export function getFavoriteItems(): { id: string; meta?: FavoriteProductMeta }[] {
  const metaMap = getFavoriteMetaMap()
  return getFavoriteProductIds().map((id) => ({
    id,
    meta: metaMap[id],
  }))
}

/** Returns true if the product is favorited after toggle. */
export function toggleFavoriteProductId(productId: string, meta?: FavoriteProductMeta): boolean {
  const set = new Set(getFavoriteProductIds())
  const had = set.has(productId)
  if (had) {
    set.delete(productId)
    removeFavoriteMeta(productId)
  } else {
    set.add(productId)
    if (meta) upsertFavoriteMeta(productId, meta)
  }
  setFavoriteProductIds([...set])
  notifyFavoritesChanged()
  return !had
}

/** Remove from favorites if present (no-op if not favorited). */
export function removeFavoriteProductId(productId: string): void {
  const set = new Set(getFavoriteProductIds())
  if (!set.has(productId)) return
  set.delete(productId)
  setFavoriteProductIds([...set])
  removeFavoriteMeta(productId)
  notifyFavoritesChanged()
}
