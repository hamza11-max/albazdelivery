'use client'

import { useEffect } from 'react'
import { initializeThemeAndLanguage } from '@/lib/theme'

/**
 * Client-side component to initialize theme and language on app load
 * Should be placed in the root layout
 */
export function ThemeInitializer() {
  useEffect(() => {
    initializeThemeAndLanguage()
  }, [])

  return null
}

