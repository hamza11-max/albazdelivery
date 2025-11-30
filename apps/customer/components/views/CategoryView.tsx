import { ArrowLeft, Clock, Star } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@albaz/ui'
import type { CategoryViewProps } from '@/app/lib/types'
import { CategoryIcon } from '../CategoryIcon'

export function CategoryView({
  selectedCategory,
  categories,
  filteredStores,
  onBack,
  onStoreSelect,
  selectedLanguage,
  t,
}: CategoryViewProps) {
  const category = categories.find((c) => c.id === selectedCategory)
  if (!category) return null

  const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-[57px] z-40 bg-background border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{categoryName}</h1>
        </div>
      </div>

      <div className="bg-[#1a4d1a] px-4 py-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-1">{categoryName}</h1>
          <p className="text-white/90 text-sm">{t('fast-delivery', 'Livraison rapide à votre porte', 'توصيل سريع إلى بابك')}</p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
          <CategoryIcon category={category} size={128} className="text-white" />
        </div>
      </div>

      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          {t('available-stores', 'Magasins disponibles', 'المتاجر المتاحة')}
        </h2>
        <div className="space-y-4">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => onStoreSelect(store.id)}
            >
              <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50">
                <img src="/placeholder.jpg" alt={store.name} className="w-full h-full object-cover" />
                <Badge className="absolute top-2 left-2 bg-[#ff9933] text-white text-xs px-2 py-1">
                  {t('free', 'Gratuit', 'مجاني')}
                </Badge>
              </div>

              <CardContent className="p-3">
                <h3 className="font-bold text-base mb-1 text-foreground">{store.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{store.rating}%</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{store.deliveryTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

