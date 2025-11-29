import { useState, useEffect } from 'react'
import { Search, MapPin, Moon, Sun } from 'lucide-react'
import { Input, Card } from '@albaz/ui'
import type { HomePageProps } from '@/app/lib/types'
import { CategoryIcon } from '../CategoryIcon'

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
    if (typeof window === 'undefined') return 130
    return window.innerWidth < 640 ? 110 : window.innerWidth < 1024 ? 150 : 170
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
    return { x, y }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 flex flex-col">
      {/* Top Bar: Location (left) and Theme Toggle (right) */}
      <div className="px-4 py-4 flex items-center justify-between z-50">
        {/* Location Section - Top Left */}
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-teal-100 dark:border-teal-900">
          <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-medium text-teal-800 dark:text-teal-200">{selectedCity}</span>
        </div>

        {/* Theme Toggle - Top Right */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-orange-50 dark:hover:bg-gray-700 transition-all shadow-sm border border-orange-100 dark:border-orange-900"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          ) : (
            <Moon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          )}
        </button>
      </div>

      {/* Ads Section - Moved Up */}
      <div className="px-4 mb-8">
        <div className="space-y-3 max-w-2xl mx-auto">
          <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-r from-teal-500 via-cyan-400 to-orange-500 rounded-2xl">
            <div className="relative h-32 md:h-40">
              <img src="/placeholder.jpg" alt="Promotion" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
              <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
                <div className="text-white max-w-[70%]">
                  <h3 className="text-2xl md:text-3xl font-bold mb-1 drop-shadow-md">
                    {t('promo-title', 'Livraison Gratuite', 'توصيل مجاني')}
                  </h3>
                  <p className="text-sm md:text-lg font-medium opacity-90">
                    {t('promo-desc', 'Sur votre première commande', 'على طلبك الأول')}
                  </p>
                </div>
                <div className="hidden md:block text-4xl">🛵</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Central Hub: Search & Circular Categories */}
      <div className="flex-1 flex items-center justify-center relative min-h-[400px] md:min-h-[500px] overflow-hidden">
        
        {/* Center Search Bar */}
        <div className="absolute z-20 w-64 md:w-80 transform -translate-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <Input
                type="text"
                placeholder={t('search', 'Que cherchez-vous ?', 'ما الذي تبحث عنه؟')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 py-6 w-full border-0 bg-transparent focus:ring-0 text-lg placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Circular Categories */}
        <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
          {categories.map((category, index) => {
            const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
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
                className="absolute flex flex-col items-center gap-2 group transform transition-all duration-500 hover:scale-110 hover:z-10"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%)`,
                }}
              >
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl rotate-45 group-hover:rotate-0 transition-transform duration-300 ${category.color} dark:bg-gray-700 flex items-center justify-center shadow-lg group-hover:shadow-xl border-2 border-white dark:border-gray-600 overflow-hidden`}
                >
                  <div className="-rotate-45 group-hover:rotate-0 transition-transform duration-300 w-full h-full flex items-center justify-center p-2">
                    <CategoryIcon
                      category={category}
                      size={64}
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <span className="text-xs md:text-sm font-bold text-center text-gray-700 dark:text-gray-300 max-w-[90px] bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-2 py-1 rounded-lg">
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
