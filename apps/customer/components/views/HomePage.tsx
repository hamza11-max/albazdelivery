import { useState, useEffect } from 'react'
import { Search, MapPin, Moon, Sun } from 'lucide-react'
import { Input, Card } from '@albaz/ui'
import type { HomePageProps } from '@/app/lib/types'

export function HomePage({
  categories,
  selectedLanguage,
  searchQuery,
  onSearchChange,
  onCategorySelect,
  onPackageDelivery,
  selectedCity,
  isDarkMode,
  onToggleDarkMode,
  onGoHome,
  t,
}: HomePageProps) {
  // Calculate positions for circular arrangement - responsive radius
  const categoryCount = categories.length
  const getRadius = () => {
    if (typeof window === 'undefined') return 120
    return window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 140 : 160
  }
  const [radius, setRadius] = useState(getRadius())

  // Update radius on window resize
  useEffect(() => {
    const handleResize = () => setRadius(getRadius())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCategoryPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // Start from top
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    return { x, y, angle }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      {/* Top Bar: Location (left) and Theme Toggle (right) */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Location Section - Top Left */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-lg px-3 py-2 border border-teal-200 dark:border-teal-800">
            <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{selectedCity}</span>
          </div>

          {/* Theme Toggle - Top Right */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 hover:from-orange-200 hover:to-amber-200 dark:hover:from-orange-800/40 dark:hover:to-amber-800/40 transition-all border border-orange-200 dark:border-orange-800"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            ) : (
              <Moon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            )}
          </button>
        </div>
      </div>

      {/* Search Section - Middle */}
      <div className="px-4 py-4 bg-transparent">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 dark:text-teal-400" />
          <Input
            type="text"
            placeholder={t('search', 'Découvrir...', 'اكتشف...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-2 border-teal-200 dark:border-teal-800 rounded-xl h-12 focus:border-orange-400 dark:focus:border-orange-600 shadow-lg focus:shadow-xl transition-all"
          />
        </div>
      </div>

      {/* Ads Section - Between Search and Categories */}
      <div className="px-4 py-4">
        <div className="space-y-3 max-w-2xl mx-auto">
          <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-teal-500 via-cyan-400 to-orange-500">
            <div className="relative h-32 bg-gradient-to-r from-teal-500 via-cyan-400 to-orange-500">
              <img src="/placeholder.jpg" alt="Promotion" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
                    {t('promo-title', 'Livraison Gratuite', 'توصيل مجاني')}
                  </h3>
                  <p className="text-sm md:text-base drop-shadow-md">
                    {t('promo-desc', 'Sur votre première commande', 'على طلبك الأول')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500">
            <div className="relative h-32 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500">
              <img src="/placeholder.jpg" alt="Promotion" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
                    {t('discount', '-20% Réduction', 'خصم 20%-')}
                  </h3>
                  <p className="text-sm md:text-base drop-shadow-md">
                    {t('grocery-promo', "Sur tous les produits d'épicerie", 'على جميع منتجات البقالة')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Category Buttons - Circular Arrangement Centered */}
      <div className="px-4 py-8 flex items-center justify-center min-h-[400px] md:min-h-[500px]">
        <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
          {categories.map((category, index) => {
            const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
            const Icon = category.icon
            const { x, y } = getCategoryPosition(index, categoryCount)

            const handleClick = () => {
              if (category.id === 5) {
                onPackageDelivery()
              } else {
                onCategorySelect(category.id)
              }
            }

            return (
              <button
                key={category.id}
                onClick={handleClick}
                className="absolute flex flex-col items-center gap-2 group transform transition-all duration-300 hover:scale-110"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%)`,
                }}
              >
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${category.color} dark:bg-gray-700 flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition-all duration-300 border-2 border-white dark:border-gray-600`}
                >
                  <Icon className={`w-8 h-8 md:w-10 md:h-10 ${category.iconColor} dark:text-gray-200 stroke-[2.5]`} />
                </div>
                <span className="text-xs md:text-sm font-semibold text-center text-gray-800 dark:text-gray-200 max-w-[80px] md:max-w-[100px] bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-lg shadow-sm">
                  {categoryName}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
