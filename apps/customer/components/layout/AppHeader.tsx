'use client'

import Image from 'next/image'
import { MapPin, Moon, Sun, Bell } from 'lucide-react'
import { useProfileI18n } from '../../hooks/use-profile-i18n'

interface AppHeaderProps {
  selectedCity: string
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onGoHome: () => void
  /** e.g. navigate to orders / activity */
  onOpenNotifications?: () => void
}

export function AppHeader({
  selectedCity,
  isDarkMode,
  onToggleDarkMode,
  onGoHome,
  onOpenNotifications,
}: AppHeaderProps) {
  const t = useProfileI18n()

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2"
            aria-label={t('app-header-go-home', "Aller à l'accueil", 'الصفحة الرئيسية', 'Go home')}
          >
            <Image
              src="/logo.png"
              width={84}
              height={84}
              alt={t('signup-logo-alt', 'ALBAZ FAST DELIVERY', 'اللباز توصيل سريع', 'ALBAZ FAST DELIVERY')}
              className="h-[84px] w-auto"
            />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2 max-w-xs">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedCity}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={
                isDarkMode
                  ? t('light-mode', 'Mode clair', 'وضع النهار', 'Light mode')
                  : t('dark-mode', 'Mode sombre', 'الوضع الليلي', 'Dark mode')
              }
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => onOpenNotifications?.()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={t('notifications', 'Notifications', 'الإشعارات', 'Notifications')}
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
