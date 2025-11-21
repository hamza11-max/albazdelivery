'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/root/components/ui/button'
import { getStoredLanguage, setStoredLanguage } from '@/root/lib/theme'

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

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'ar' : 'fr'
    setStoredLanguage(newLanguage)
    setLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      title={language === 'fr' ? 'العربية' : 'Français'}
      className="w-10 h-10"
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">Toggle language</span>
    </Button>
  )
}

