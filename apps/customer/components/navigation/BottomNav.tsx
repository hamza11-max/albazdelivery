import type { ReactNode } from 'react'
import { Home, Search, ShoppingCart, Bell, User } from 'lucide-react'
import type { PageView, TranslationFn } from '@/lib/types'

interface BottomNavProps {
  currentPage: PageView
  cartItemCount: number
  onNavigate: (page: PageView) => void
  onResetSelection: () => void
  t: TranslationFn
}

export function BottomNav({ currentPage, cartItemCount, onNavigate, onResetSelection, t }: BottomNavProps) {
  const handleNavigate = (page: PageView) => {
    if (page === 'home') {
      onResetSelection()
    }
    onNavigate(page)
  }

  const navButton = (
    page: PageView,
    icon: ReactNode,
    label: string,
    extra?: ReactNode
  ) => (
    <button
      onClick={() => handleNavigate(page)}
      className={`flex flex-col items-center gap-1 py-2 transition-colors ${
        currentPage === page ? 'active' : 'text-muted-foreground'
      }`}
    >
      <div className="relative">
        {icon}
        {extra}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )

  return (
    <nav className="albaz-nav fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navButton('home', <Home className="w-6 h-6" />, t('home', 'Home', 'الرئيسية'))}
        <button
          onClick={() => {
            onResetSelection()
            onNavigate('home')
          }}
          className={`flex flex-col items-center gap-1 py-2 transition-colors ${
            currentPage === 'home' ? 'active' : 'text-muted-foreground'
          }`}
        >
          <Search className="w-6 h-6" />
          <span className="text-xs font-medium">{t('search', 'Search', 'بحث')}</span>
        </button>
        {navButton(
          'checkout',
          <ShoppingCart className="w-6 h-6" />,
          t('shop', 'Shop', 'تسوق'),
          cartItemCount > 0 ? (
            <span className="absolute -top-1 -right-2 bg-[var(--albaz-orange)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          ) : null
        )}
        {navButton('orders', <Bell className="w-6 h-6" />, t('dats', 'Dats', 'الإشعارات'))}
        {navButton('profile', <User className="w-6 h-6" />, t('profile', 'Profile', 'الملف الشخصي'))}
      </div>
    </nav>
  )
}

