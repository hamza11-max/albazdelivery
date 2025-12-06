import React from 'react'
import { Search, MapPin, Sun, Moon } from 'lucide-react'
import { Input } from '@albaz/ui'
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
  t,
}: HomePageProps) {
  return (
    <div className="albaz-shell min-h-screen pb-24 animate-[fadeSlideUp_0.6s_ease]">
      <div className="albaz-hero px-5 pt-6 pb-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ALBAZ" className="h-10 w-auto animate-[fadeSlideUp_0.8s_ease]" />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--albaz-text-soft)]">
              Livraison rapide
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="rounded-full px-3 py-2 bg-white/80 dark:bg-white/5 border border-[var(--albaz-border)] shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-[var(--albaz-text)] dark:text-white/90"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 albaz-search px-4 py-[11px] flex items-center gap-3 animate-[fadeSlideUp_0.65s_ease]">
            <Search className="w-5 h-5 text-[var(--albaz-text-soft)]" />
            <Input
              type="text"
              placeholder={t('search', 'Search anything...', 'ابحث عن أي شيء...')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-[var(--albaz-text)] dark:text-white placeholder:text-[var(--albaz-text-soft)] border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <button className="albaz-location-pill px-3 py-3 flex items-center gap-2 text-sm font-semibold animate-[fadeSlideUp_0.75s_ease]">
            <MapPin className="w-4 h-4" />
            <span>{selectedCity}</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-1">
          {categories.slice(0, 5).map((category, idx) => {
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
                className="group flex flex-col items-center gap-2 focus:outline-none"
                style={{ animation: `popIn 0.45s ease ${idx * 60}ms both` }}
              >
                <div className="albaz-category w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:scale-95">
                  <CategoryIcon category={category} size={36} className="w-10 h-10" />
                </div>
                <span className="text-[11px] font-semibold text-center text-[var(--albaz-text)] dark:text-white/90 max-w-[90px] leading-tight">
                  {categoryName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
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
