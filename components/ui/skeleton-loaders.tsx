import { Skeleton } from './skeleton'
import { Card, CardContent } from './card'

/**
 * Skeleton loader for category cards
 */
export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="h-4 w-16 rounded" />
    </div>
  )
}

/**
 * Skeleton loader for store cards
 */
export function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton loader for product cards
 */
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-3 w-2/3 mb-2" />
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton loader for order cards
 */
export function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton loader for cart items
 */
export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 pb-4 border-b">
      <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="text-right shrink-0">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  )
}

/**
 * Skeleton loader for homepage
 */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20 flex flex-col">
      {/* Logo skeleton */}
      <div className="px-4 pt-6 pb-4 flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search bar skeleton */}
      <div className="px-4 mb-6 flex items-center gap-3">
        <Skeleton className="flex-1 h-12 rounded-full" />
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>

      {/* Categories skeleton */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          {[...Array(5)].map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Second row skeleton */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Banner skeleton */}
      <div className="px-4 mb-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  )
}

/**
 * Skeleton loader for store list
 */
export function StoreListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <StoreCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton loader for product grid
 */
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton loader for order list
 */
export function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

