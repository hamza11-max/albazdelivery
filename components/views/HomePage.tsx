import React, { useRef, useEffect } from 'react'
import NextImage from 'next/image'
import { Search, MapPin, Settings, Shield, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
  
  // Second row icons (additional features)
  const secondRowIcons = [
    { id: 'settings', icon: Settings, label: t('settings', 'Settings', 'الإعدادات') },
    { id: 'shield', icon: Shield, label: t('security', 'Security', 'الأمان') },
    { id: 'building', icon: Building2, label: t('business', 'Business', 'الأعمال') },
  ]

  return (
    <div className="min-h-screen bg-white pb-20 flex flex-col">
      {/* Header with Logo */}
      <div className="px-4 pt-6 pb-4 flex justify-center">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="ALBAZ" 
            className="h-10 w-auto"
            onError={(e) => {
              // Fallback to text logo if image fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.text-logo')) {
                const textLogo = document.createElement('div')
                textLogo.className = 'text-logo text-3xl font-bold text-[#1a4d1a]'
                textLogo.textContent = 'ALBAZ'
                parent.appendChild(textLogo)
              }
            }}
          />
          <span className="text-3xl font-bold text-[#1a4d1a] tracking-tight">ALBAZ</span>
        </div>
      </div>

      {/* Search Bar and Location Selector */}
      <div className="px-4 mb-6 flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a4d1a]" />
          <Input
            type="text"
            placeholder={t('search', 'Search...', 'بحث...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                // Search is handled by parent component
                e.currentTarget.blur()
              }
            }}
            className="pl-12 pr-4 py-3 w-full rounded-full bg-[#c8e6c9] border-0 focus:ring-2 focus:ring-[#ff9933] text-[#1a4d1a] placeholder:text-[#1a4d1a]/60"
            aria-label={t('search', 'Rechercher des produits et magasins', 'البحث عن المنتجات والمتاجر')}
          />
        </div>

        {/* Location Selector */}
        <button className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#ff9933] text-white font-medium hover:bg-[#ff8800] transition-colors">
          <MapPin className="w-4 h-4" />
          <span className="text-sm whitespace-nowrap">{selectedCity}</span>
        </button>
      </div>

      {/* First Row of Category Icons */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between gap-3">
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
                className="flex flex-col items-center gap-2 flex-1 group"
              >
                <div className="w-16 h-16 rounded-full bg-[#1a4d1a] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow group">
                  <div className="w-12 h-12 flex items-center justify-center p-2 [&>img]:brightness-0 [&>img]:invert [&>img]:sepia [&>img]:saturate-[10] [&>img]:hue-rotate-[15deg] [&>img]:brightness-[1.2]">
                    <CategoryIcon
                      category={category}
                      size={40}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-center text-[#1a4d1a] max-w-[80px]">
                  {categoryName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Second Row of Icons */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-8">
          {secondRowIcons.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-20 h-20 rounded-full bg-[#1a4d1a] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-[#ff9933]" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="px-4 mb-6">
        <div className="bg-[#1a4d1a] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1a5d1a] transition-colors shadow-md">
          <div className="flex-shrink-0">
            {/* Bird icon placeholder - you can replace this with an actual bird icon */}
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
