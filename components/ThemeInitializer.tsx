'use client'

import { useEffect } from 'react'
import { initializeThemeAndLanguage, getStoredTheme, getStoredLanguage } from '@/root/lib/theme'

/**
 * Client-side component to initialize theme and language on app load
 * Should be placed in the root layout
 */
export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme and language immediately
    initializeThemeAndLanguage()
    
    // Also sync with HTML element attributes
    const theme = getStoredTheme()
    const language = getStoredLanguage()
    
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      
      // Apply theme
      const isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      html.classList.remove('light', 'dark')
      html.classList.add(isDark ? 'dark' : 'light')
      html.style.colorScheme = isDark ? 'dark' : 'light'
      
      // Apply language
      html.lang = language
      html.dir = language === 'ar' ? 'rtl' : 'ltr'
      if (language === 'ar') {
        html.classList.add('rtl')
      } else {
        html.classList.remove('rtl')
      }
    }
  }, [])

  return null
}

