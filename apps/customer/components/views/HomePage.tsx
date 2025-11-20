import { Search } from 'lucide-react'
import { Input, Card } from '@albaz/ui'
import type { HomePageProps } from '@/app/lib/types'

export function HomePage({
  categories,
  selectedLanguage,
  searchQuery,
  onSearchChange,
  onCategorySelect,
  onPackageDelivery,
  t,
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 bg-background sticky top-[57px] z-40 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('search', 'Découvrir...', 'اكتشف...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted border-none rounded-lg h-11"
          />
        </div>
      </div>

      <div className="px-4 py-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          {categories.map((category) => {
            const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
            const Icon = category.icon
            const handleClick = () => {
              if (category.id === 5) {
                onPackageDelivery()
              } else {
                onCategorySelect(category.id)
              }
            }
            return (
              <button key={category.id} onClick={handleClick} className="flex flex-col items-center gap-3 group">
                <div
                  className={`w-24 h-24 rounded-full ${category.color} dark:bg-gray-700 flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-all duration-300`}
                >
                  <Icon className={`w-12 h-12 ${category.iconColor} dark:text-gray-200 stroke-[2.5]`} />
                </div>
                <span className="text-sm font-semibold text-center text-gray-800 dark:text-gray-200 max-w-[90px]">
                  {categoryName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">{t('promotions', 'Promotions', 'العروض الترويجية')}</h2>
        <div className="space-y-4">
          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border">
            <div className="relative h-40 bg-gradient-to-r from-primary to-orange-500">
              <img src="/placeholder.jpg" alt="Promotion" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    {t('promo-title', 'Livraison Gratuite', 'توصيل مجاني')}
                  </h3>
                  <p className="text-sm">{t('promo-desc', 'Sur votre première commande', 'على طلبك الأول')}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border">
            <div className="relative h-40 bg-gradient-to-r from-green-400 to-emerald-500">
              <img src="/placeholder.jpg" alt="Promotion" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{t('discount', '-20% Réduction', 'خصم 20%-')}</h3>
                  <p className="text-sm">
                    {t('grocery-promo', "Sur tous les produits d'épicerie", 'على جميع منتجات البقالة')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

