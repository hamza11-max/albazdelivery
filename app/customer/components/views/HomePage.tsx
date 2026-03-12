import React from 'react'
import { Search, MapPin, Sun, Moon, Bell, Settings, Shield, Building2 } from 'lucide-react'
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
  t,
}: HomePageProps) {
  // First row categories (5 main categories)
  const firstRowCategories = categories.slice(0, 5)
  const packageCategory = firstRowCategories.find((c) => c.id === 5)
  
  // Second row icons (additional features)
  const secondRowIcons = [
    { id: 'settings', icon: Settings, label: t('settings', 'Settings', 'الإعدادات') },
    { id: 'shield', icon: Shield, label: t('security', 'Security', 'الأمان') },
    { id: 'building', icon: Building2, label: t('business', 'Business', 'الأعمال') },
  ]

  return (
    <div className="min-h-screen bg-white pb-20 flex flex-col">
      {/* Top bar: logo (left) | location pill (center) | theme + notifications (right) */}
      <div className="px-4 pt-6 pb-3 border-b border-[#1a4d1a]/10">
        <div className="flex items-center justify-between gap-3">
          <div className="w-[100px] h-9 flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="ALBAZ"
              className="h-9 w-auto max-w-[100px] object-contain object-left"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.text-logo')) {
                  const textLogo = document.createElement('div')
                  textLogo.className = 'text-logo text-lg font-bold text-[#1a4d1a]'
                  textLogo.textContent = 'ALBAZ'
                  parent.appendChild(textLogo)
                }
              }}
            />
          </div>

          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#ff9933] text-white font-semibold hover:bg-[#ff8800] transition-colors shadow-sm text-sm whitespace-nowrap">
            <MapPin className="w-4 h-4" />
            <span>{selectedCity}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full hover:bg-[#1a4d1a]/10 transition-colors text-[#1a4d1a]"
              aria-label={isDarkMode ? t('light-mode', 'Light mode', 'وضع النهار') : t('dark-mode', 'Dark mode', 'الوضع الليلي')}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="p-2 rounded-full hover:bg-[#1a4d1a]/10 transition-colors text-[#1a4d1a]"
              aria-label={t('notifications', 'Notifications', 'الإشعارات')}
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-4">
        <div className="max-w-3xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a4d1a]" />
          <Input
            type="text"
            placeholder={t('search', customerCopy.search.placeholder, 'بحث...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.currentTarget.blur()
              }
            }}
            className="pl-12 pr-4 py-3 w-full rounded-full bg-[#c8e6c9] border-0 focus:ring-2 focus:ring-[#ff9933] text-[#1a4d1a] placeholder:text-[#1a4d1a]/60"
            aria-label={t('search', 'Rechercher des produits et magasins', 'البحث عن المنتجات والمتاجر')}
          />
        </div>
      </div>

      {/* Circular category layout with package delivery at center (desktop) */}
      <div className="px-4 mb-8">
        <div className="hidden sm:block">
          <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72 md:h-80 md:w-80">
            {firstRowCategories
              .filter((c) => c.id !== 5)
              .map((category, index) => {
                const categoryName = selectedLanguage === 'ar' ? category.nameAr : category.nameFr
                const angle = (index / Math.max(firstRowCategories.length - 1, 1)) * Math.PI * 2
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
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#1a4d1a] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow ring-4 ring-white">
                      <div className="w-12 h-12 flex items-center justify-center p-2 rounded-full bg-white">
                        <CategoryIcon category={category} size={40} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-center text-[#1a4d1a] max-w-[80px]">
                      {categoryName}
                    </span>
                  </button>
                )
              })}

            {/* Center package delivery */}
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
                <span className="text-sm font-semibold text-center text-[#1a4d1a]">
                  {selectedLanguage === 'ar' ? 'توصيل الطرود' : selectedLanguage === 'fr' ? 'Livraison colis' : 'Package Delivery'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile fallback: simple grid */}
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
                  <div className={`w-14 h-14 rounded-full ${category.id === 5 ? 'bg-[#ff9933]' : 'bg-[#1a4d1a]'} flex items-center justify-center shadow-md hover:shadow-lg transition-shadow ring-2 ring-white`}>
                    <div className="w-10 h-10 flex items-center justify-center p-2 rounded-full bg-white">
                      <CategoryIcon category={category} size={category.id === 5 ? 36 : 32} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-center text-[#1a4d1a]">
                    {categoryName}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Second Row of Icons */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {secondRowIcons.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1a4d1a] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff9933]" />
                </div>
                <span className="text-xs font-medium text-center text-[#1a4d1a]">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Promotional Banner positioned above bottom nav */}
      <div className="px-4 mb-8">
        <div className="bg-[#1a4d1a] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1a5d1a] transition-colors shadow-md">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#ff9933] flex items-center justify-center">
              <span className="text-2xl">🦅</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-lg">
              {t('exclusive-offers', 'Exclusive Offers! Tap to Learn More.', 'عروض حصرية! اضغط لمعرفة المزيد.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
