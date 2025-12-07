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
            <Image src="/logo.png" width={84} height={84} alt="ALBAZ FAST DELIVERY" className="h-[84px] w-auto" />
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

