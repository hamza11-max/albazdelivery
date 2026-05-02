import React, { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { ArrowLeft, Minus, Plus, Share2, Star, UtensilsCrossed, AlertCircle } from 'lucide-react'
import { Button, Card, CardContent, useToast } from '@albaz/ui'
import { customerCopy } from '@albaz/shared'
import type { StoreViewProps } from '../../lib/types'
import { ProductGridSkeleton } from '../ui/skeleton-loaders'
import { useErrorHandler } from '../../hooks/use-error-handler'
import { getFavoriteProductIds, toggleFavoriteProductId } from '../../lib/favorite-products'

export const StoreView = React.memo(function StoreView({ selectedStore, stores, products, isLoading = false, onBack, addToCart, t, vendorProfile }: StoreViewProps) {
  const { handleError } = useErrorHandler()
  const { toast } = useToast()
  
  const store = stores.find((s) => String(s.id) === String(selectedStore))
  const storeProducts = products.filter((p) => String(p.storeId) === String(selectedStore))
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [productDetailQty, setProductDetailQty] = useState(1)
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([])

  useEffect(() => {
    setFavoriteProductIds(getFavoriteProductIds())
  }, [])

  useEffect(() => {
    setProductDetailQty(1)
  }, [selectedProduct])

  if (isLoading) {
    return <ProductGridSkeleton />
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {t("store-not-found", "Magasin non trouvé", "المتجر غير موجود", "Store not found")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t("store-not-found-desc", "Le magasin demandé n'existe pas", "المتجر المطلوب غير موجود", "This store does not exist")}
          </p>
          <Button onClick={onBack}>{t("back", "Retour", "رجوع", "Back")}</Button>
        </div>
      </div>
    )
  }

  if (selectedProduct) {
    const product = products.find((p) => String(p.id) === String(selectedProduct))
    if (!product) return null

    const productId = String(product.id)
    const isFavorite = favoriteProductIds.includes(productId)

    const handleToggleFavorite = () => {
      toggleFavoriteProductId(productId, {
        storeId: String(product.storeId),
        categoryId: store.categoryId,
        name: product.name,
        price: product.price,
        image: typeof product.image === 'string' ? product.image : undefined,
        storeName: store.name,
      })
      setFavoriteProductIds(getFavoriteProductIds())
    }

    const handleShare = async () => {
      const line = `${product.name} — ${product.price} DZD`
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: product.name,
            text: line,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          })
          return
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${line}\n${typeof window !== 'undefined' ? window.location.href : ''}`)
          toast({
            title: t('share-copied-title', 'Lien copié', 'تم نسخ الرابط', 'Link copied'),
            description: t(
              'share-copied-desc',
              'Collagez le lien pour partager ce produit.',
              'الصق الرابط لمشاركة هذا المنتج.',
              'Paste the link to share this product.',
            ),
          })
          return
        }
        toast({
          title: t('share-unavailable-title', 'Partage indisponible', 'المشاركة غير متاحة', 'Sharing unavailable'),
          description: t(
            'share-unavailable-desc',
            'Utilisez le menu du navigateur pour copier le lien.',
            'استخدم قائمة المتصفح لنسخ الرابط.',
            'Use your browser menu to copy the page link.',
          ),
          variant: 'destructive',
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        handleError(err, { showToast: true })
      }
    }

    return (
      <div className="albaz-shell min-h-screen pb-24">
        <div className="sticky top-0 z-50 bg-[var(--albaz-surface)] border-b border-border px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedProduct(null)} 
              className="hover:bg-muted" 
              aria-label={t("back-to-store", "Retour au magasin", "العودة إلى المتجر", "Back to store")}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-muted"
                type="button"
                onClick={handleToggleFavorite}
                aria-label={
                  isFavorite
                    ? t('favorite-remove', 'Retirer des favoris', 'إزالة من المفضلة', 'Remove from favorites')
                    : t('favorite', 'Ajouter aux favoris', 'إضافة إلى المفضلة', 'Add to favorites')
                }
              >
                <Star
                  className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                  aria-hidden="true"
                />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-muted"
                type="button"
                onClick={() => void handleShare()}
                aria-label={t("share", "Partager", "مشاركة", "Share")}
              >
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full aspect-square flex items-center justify-center p-8">
          <div className="w-full h-full max-w-md mx-auto rounded-full overflow-hidden shadow-xl bg-card">
            <NextImage src={product.image || '/placeholder.svg'} alt={product.name} width={400} height={400} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; if (el) el.src = '/placeholder.svg' }} />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6 bg-card rounded-t-3xl -mt-6 relative z-10 shadow-lg">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-bold text-foreground flex-1">{product.name}</h2>
              <div className="text-right">
                <span className="text-3xl font-bold text-[var(--albaz-olive)]">{product.price}</span>
                <span className="text-sm text-muted-foreground ml-1">DZD</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-3">
              <button
                type="button"
                aria-label={t('qty-decrease', 'Diminuer la quantité', 'تقليل الكمية', 'Decrease quantity')}
                className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                disabled={productDetailQty <= 1}
                onClick={() => setProductDetailQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-lg font-bold min-w-[2.5rem] text-center text-foreground tabular-nums">
                {String(productDetailQty).padStart(2, '0')}
              </span>
              <button
                type="button"
                aria-label={t('qty-increase', 'Augmenter la quantité', 'زيادة الكمية', 'Increase quantity')}
                className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                disabled={productDetailQty >= 99}
                onClick={() => setProductDetailQty((q) => Math.min(99, q + 1))}
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Button
              className="flex-1 bg-[var(--albaz-olive)] hover:brightness-95 text-white font-bold py-6 rounded-full text-lg shadow-lg"
              onClick={() => {
                for (let i = 0; i < productDetailQty; i++) addToCart(String(product.id))
                setSelectedProduct(null)
              }}
              aria-label={t("add-to-cart", "Ajouter au panier", "أضف إلى السلة", "Add to cart") + ": " + product.name}
            >
              {t("add-to-cart", customerCopy.actions.addToCart, "أضف إلى السلة", "Add to cart")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="albaz-shell min-h-screen pb-24">
      <div className="sticky top-0 z-50 bg-[var(--albaz-surface)] border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-muted"
            aria-label={t('back-to-category', 'Retour à la catégorie', 'العودة إلى الفئة', 'Back to category')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="bg-card p-6 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-xl bg-[var(--albaz-olive)]/15 flex items-center justify-center overflow-hidden">
            {vendorProfile?.logo ? (
              <NextImage src={vendorProfile.logo} alt={store.name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-10 h-10 text-[var(--albaz-olive)]" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{vendorProfile?.name || store.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">{vendorProfile?.description || store.type}</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{store.rating}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{store.deliveryTime}</span>
            </div>
            {(vendorProfile?.address || vendorProfile?.phone || vendorProfile?.email) && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {vendorProfile.address && <p>{vendorProfile.address}</p>}
                {vendorProfile.phone && <p>{vendorProfile.phone}</p>}
                {vendorProfile.email && <p>{vendorProfile.email}</p>}
              </div>
            )}
          </div>
        </div>
        {vendorProfile?.cover && (
          <div className="w-full h-32 rounded-lg overflow-hidden border">
            <NextImage src={vendorProfile.cover} alt="Cover" width={800} height={160} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="px-4 py-6">
        <h3 className="text-lg font-bold text-foreground mb-4">{t("menu", "Menu", "القائمة", "Menu")}</h3>
        {isLoading ? (
          <ProductGridSkeleton />
        ) : storeProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {t("no-products", customerCopy.empty.noProducts, "لا توجد منتجات متاحة", "No products in this store")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {storeProducts.map((product) => (
            <Card
              key={product.id}
              className="albaz-card overflow-hidden cursor-pointer transition-shadow border-border bg-card focus-within:ring-2 focus-within:ring-[var(--albaz-olive)] focus-within:ring-offset-2"
              onClick={() => setSelectedProduct(String(product.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedProduct(String(product.id))
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={t("view-product", "Voir le produit", "عرض المنتج", "View product") + ": " + product.name}
            >
              <div className="aspect-square relative bg-muted flex items-center justify-center">
                <NextImage src={product.image || '/placeholder.svg'} alt={product.name} width={400} height={400} className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; if (el) el.src = '/placeholder.svg' }} />
              </div>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{product.name}</h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1a4d1a]">{product.price} DZD</span>
                  <Button
                    size="sm"
                    className="bg-[#1a4d1a] hover:bg-[#1a5d1a] text-white rounded-full px-4 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(String(product.id))
                    }}
                  >
                    {t("add", "Ajouter", "أضف", "Add")}
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

