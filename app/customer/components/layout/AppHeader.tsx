import Image from 'next/image'
import { MapPin, Moon, Sun } from 'lucide-react'

interface AppHeaderProps {
  selectedCity: string
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onGoHome: () => void
}

export function AppHeader({ selectedCity, isDarkMode, onToggleDarkMode, onGoHome }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onGoHome} className="flex items-center gap-2" aria-label="Go home">
            <Image
              src="/logo.png"
              width={32}
              height={32}
              alt="ALBAZ FAST DELIVERY"
              className="h-8 w-auto"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                img.onerror = null
                img.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='36' viewBox='0 0 120 36'%3E%3Crect width='120' height='36' rx='10' fill='%232f5b2f'/%3E%3Ctext x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter,Arial' font-size='12' font-weight='700'%3EALBAZ%3C/text%3E%3C/svg%3E"
              }}
            />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2 max-w-xs">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedCity}</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  )
}

