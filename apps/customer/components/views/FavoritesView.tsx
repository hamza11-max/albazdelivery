'use client'

import { useCallback, useEffect, useState } from 'react'
import NextImage from 'next/image'
import { ArrowLeft, Heart, Store, Trash2 } from 'lucide-react'
import { Button, Card, CardContent } from '@albaz/ui'
import type { FavoritesViewProps } from '../../lib/types'
import { getFavoriteItems, removeFavoriteProductId, type FavoriteProductMeta } from '../../lib/favorite-products'

export function FavoritesView({ onBack, onGoToStore, t }: FavoritesViewProps) {
  const [items, setItems] = useState<{ id: string; meta?: FavoriteProductMeta }[]>(() => getFavoriteItems())

  const refresh = useCallback(() => {
    setItems(getFavoriteItems())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('albaz-favorites', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('albaz-favorites', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refresh])

  const remove = (id: string) => {
    removeFavoriteProductId(id)
  }

  return (
    <div className="albaz-shell min-h-screen pb-24">
      <div className="sticky top-0 z-50 bg-[var(--albaz-surface)] border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted" aria-label={t('back', 'Retour', 'رجوع', 'Back')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">
            {t('favorites-h1', 'Mes favoris', 'مفضلتي', 'Favorites')}
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>
                {t(
                  'favorites-empty',
                  'Aucun produit favori. Ouvrez un magasin et appuyez sur l\'étoile sur une fiche produit.',
                  'لا توجد منتجات مفضّلة. افتح متجراً واضغط النجمة في تفاصيل المنتج.',
                  'No favorites yet. Open a store and tap the star on a product.',
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          items.map(({ id, meta }) => (
            <Card key={id} className="overflow-hidden border-border">
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                    <NextImage
                      src={meta?.image || '/placeholder.svg'}
                      alt={meta?.name ?? id}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        if (el) el.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-2">{meta?.name ?? `Product ${id.slice(0, 8)}`}</p>
                    {meta ? (
                      <>
                        <p className="text-sm text-[var(--albaz-olive)] font-bold mt-1">
                          {meta.price} DZD
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 shrink-0" />
                          <span className="truncate">{meta.storeName ?? meta.storeId}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('favorites-missing-meta', 'Infos limitées — ouvrez le magasin pour mettre à jour.', 'معلومات محدودة', 'Limited info — open the store again to refresh.')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {meta ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={() => onGoToStore(meta.storeId, meta.categoryId)}
                      >
                        {t('favorites-see-store', 'Magasin', 'المتجر', 'Store')}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={t('favorites-remove', 'Retirer', 'إزالة', 'Remove')}
                      onClick={() => remove(id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
