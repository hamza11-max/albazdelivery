import React from 'react'
import { Search, MapPin, Sun, Moon, Bell } from 'lucide-react'
import { Input } from '@albaz/ui'
import { customerCopy } from '@albaz/shared'
import type { HomePageProps } from '../../lib/types'
import { CategoryIcon } from '../CategoryIcon'

export const HomePage = React.memo(function HomePage({
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
  searchInputRef,
  t,
}: HomePageProps) {
  const firstRowCategories = categories.slice(0, 5)
  const packageCategory = firstRowCategories.find((c) => c.id === 5)
  const surroundingCategories = firstRowCategories.filter((c) => c.id !== 5)

  return (
    <div className="albaz-shell min-h-screen pb-24 flex flex-col animate-[fadeSlideUp_0.6s_ease]">
      <div className="albaz-hero px-5 pt-6 pb-6 space-y-5">
        {/* Top bar: logo (left) | location pill (center) | theme + notifications (right) */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--albaz-border)] pb-4 -mx-5 px-5">
          <div className="w-[100px] h-9 flex items-center shrink-0">
            <img src="/logo.png" alt="ALBAZ" className="h-9 w-auto max-w-[100px] object-contain object-left animate-[fadeSlideUp_0.8s_ease]" />
          </div>

          <button className="albaz-location-pill px-3 py-2 flex items-center gap-2 text-sm font-semibold animate-[fadeSlideUp_0.75s_ease] whitespace-nowrap rounded-full bg-[var(--albaz-orange)] text-white">
            <MapPin className="w-4 h-4" />
            <span>{selectedCity}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--albaz-text)] dark:text-white/90"
              aria-label={isDarkMode ? t('light-mode', 'Light mode', 'وضع النهار') : t('dark-mode', 'Dark mode', 'الوضع الليلي')}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--albaz-text)] dark:text-white/90"
              aria-label={t('notifications', 'Notifications', 'الإشعارات')}
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 min-w-0 max-w-4xl">
          <div className="albaz-search px-4 py-[11px] flex items-center gap-3 animate-[fadeSlideUp_0.65s_ease]">
            <Search className="w-5 h-5 text-[var(--albaz-text-soft)] shrink-0" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t('search', customerCopy.search.placeholder, 'ابحث عن أي شيء...')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-[var(--albaz-text)] dark:text-white placeholder:text-[var(--albaz-text-soft)] border-none shadow-none focus-visible:ring-0 min-w-0"
            />
          </div>
        </div>

        {/* Circular category layout with package delivery center */}
        <div className="pt-1">
          <div className="hidden sm:block">
            <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72 md:h-80 md:w-80">
              {surroundingCategories.map((category, index) => {
                const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
                const angle = (index / Math.max(surroundingCategories.length, 1)) * Math.PI * 2
                const radius = 90
                const x = 50 + Math.cos(angle) * (radius / 2)
                const y = 50 + Math.sin(angle) * (radius / 2)

                return (
                  <button
                    key={category.id}
                    onClick={() => onCategorySelect(category.id)}
                    className="absolute flex flex-col items-center gap-2 group"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow ring-4 ring-white">
                      <div className="w-12 h-12 flex items-center justify-center p-2 rounded-full bg-white">
                        <CategoryIcon category={category} size={40} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-center text-[var(--albaz-text)] dark:text-white/90 max-w-[90px] leading-tight">
                      {categoryName}
                    </span>
                  </button>
                )
              })}

              {packageCategory && (
                <button
                  onClick={onPackageDelivery}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#ff9933] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow border-4 border-white ring-4 ring-white/60">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/90">
                      <CategoryIcon category={packageCategory} size={52} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-center text-[var(--albaz-text)] dark:text-white/90">
                    {selectedLanguage === 'ar'
                      ? 'توصيل الطرود'
                      : selectedLanguage === 'fr'
                        ? 'Livraison colis'
                        : 'Package Delivery'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile grid fallback */}
          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-4">
              {firstRowCategories.map((category) => {
                const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
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
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-14 h-14 rounded-full ${
                        category.id === 5 ? 'bg-[#ff9933]' : 'bg-[var(--albaz-olive)]'
                      } flex items-center justify-center shadow-md hover:shadow-lg transition-shadow ring-2 ring-white`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center p-2 rounded-full bg-white">
                        <CategoryIcon category={category} size={category.id === 5 ? 36 : 32} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-center text-[var(--albaz-text)] dark:text-white/90 max-w-[90px] leading-tight">
                      {categoryName}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ads/promo placed above bottom nav */}
      <div className="px-5 mt-auto mb-8">
        <div className="albaz-promo p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="ALBAZ bird" className="w-8 h-8 albaz-promo-bird" />
          </div>
          <div className="flex-1 relative z-10">
            <p className="text-sm font-semibold">
              {t('exclusive-offers', 'Exclusive Offers!', 'عروض حصرية!')}
            </p>
            <p className="text-xs opacity-90">
              {t('tap-to-learn', 'Tap to Learn More.', 'اضغط لمعرفة المزيد.')}
            </p>
          </div>
          <button className="relative z-10 px-3 py-2 rounded-full bg-white/90 text-[var(--albaz-olive)] font-semibold shadow-md hover:-translate-y-[1px] transition">
            {t('learn-more', 'En savoir plus', 'اعرف المزيد')}
          </button>
        </div>
      </div>
    </div>
  )
})
