import type { ReactNode } from 'react'
import { Home, Package, ShoppingCart, User } from 'lucide-react'
import type { PageView, TranslationFn } from '@/app/lib/types'

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
      className={`flex flex-col items-center gap-1 py-1 transition-colors ${
        currentPage === page ? 'text-primary' : 'text-muted-foreground'
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around py-2 px-4">
        {navButton('home', <Home className="w-6 h-6" />, t('home', 'Accueil', 'الرئيسية'))}
        {navButton(
          'checkout',
          <ShoppingCart className="w-6 h-6" />,
          t('cart', 'Panier', 'السلة'),
          cartItemCount > 0 ? (
            <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          ) : null
        )}
        {navButton('orders', <Package className="w-6 h-6" />, t('orders', 'Commandes', 'الطلبات'))}
        {navButton('profile', <User className="w-6 h-6" />, t('profile', 'Profil', 'الملف الشخصي'))}
      </div>
    </nav>
  )
}

