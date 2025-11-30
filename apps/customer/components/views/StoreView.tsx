import { useState } from 'react'
import { ArrowLeft, Minus, Plus, Share2, Star, UtensilsCrossed } from 'lucide-react'
import { Button, Card, CardContent } from '@albaz/ui'
import type { StoreViewProps } from '@/app/lib/types'

export function StoreView({ selectedStore, stores, products, onBack, addToCart, t }: StoreViewProps) {
  const store = stores.find((s) => s.id === selectedStore)
  const storeProducts = products.filter((p) => p.storeId === selectedStore)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)

  if (!store) return null

  if (selectedProduct) {
    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return null

    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)} className="hover:bg-muted" aria-label="Back to store">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Star className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full aspect-square bg-background flex items-center justify-center p-8">
          <div className="w-full h-full max-w-md mx-auto rounded-full overflow-hidden shadow-xl">
            <img src={product.image || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6 bg-card rounded-t-3xl -mt-6 relative z-10 shadow-lg">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-bold text-foreground flex-1">{product.name}</h2>
              <div className="text-right">
                <span className="text-3xl font-bold text-[#1a4d1a]">{product.price}</span>
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

          <p className="text-sm text-muted-foreground leading-relaxed">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut
            laoreet dolore magna aliquam erat volutpat.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-3">
              <button aria-label="Decrease quantity" className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-lg font-bold w-12 text-center text-foreground">01</span>
              <button aria-label="Increase quantity" className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Button
              className="flex-1 bg-[#1a4d1a] hover:bg-[#1a5d1a] text-white font-bold py-6 rounded-full text-lg shadow-lg"
              onClick={() => {
                addToCart(product.id)
                setSelectedProduct(null)
              }}
            >
              {t('add-to-cart', 'Ajouter au Panier', 'أضف إلى السلة')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted" aria-label="Back to category">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="bg-card p-6 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-xl bg-[#1a4d1a]/20 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-[#1a4d1a]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{store.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">{store.type}</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{store.rating}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{store.deliveryTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <h3 className="text-lg font-bold text-foreground mb-4">{t('menu', 'Menu', 'القائمة')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {storeProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
              onClick={() => setSelectedProduct(product.id)}
            >
              <div className="aspect-square relative bg-muted flex items-center justify-center">
                <img src={product.image || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
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
                      addToCart(product.id)
                    }}
                  >
                    {t('add', 'Ajouter', 'أضف')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

