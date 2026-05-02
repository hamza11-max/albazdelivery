'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStoredLanguage, toggleLanguage as cycleAppLanguage } from '@/lib/theme'

interface LanguageToggleProps {
  onLanguageChange?: (language: string) => void
}

export function LanguageToggle({ onLanguageChange }: LanguageToggleProps) {
  const [language, setLanguage] = useState('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const lang = getStoredLanguage()
    setLanguage(lang)
  }, [])

  if (!mounted) {
    return null
  }

  const onToggle = () => {
    const newLanguage = cycleAppLanguage()
    setLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
  }

  const nextLangTitle =
    language === 'fr' ? 'العربية' : language === 'ar' ? 'English' : 'Français'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      title={nextLangTitle}
      className="w-10 h-10"
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">{nextLangTitle}</span>
    </Button>
  )
}

