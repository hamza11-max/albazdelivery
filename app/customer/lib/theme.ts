/**
 * Theme management utilities
 */

export type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'albaz-theme'
const LANG_STORAGE_KEY = 'albaz-language'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return (stored as Theme) || 'system'
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return

  const html = document.documentElement
  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Remove existing theme class
  html.classList.remove('light', 'dark')
  
  // Add new theme class
  if (isDark) {
    html.classList.add('dark')
  } else {
    html.classList.add('light')
  }

  // Update CSS variables
  if (isDark) {
    html.style.colorScheme = 'dark'
  } else {
    html.style.colorScheme = 'light'
  }
}

export function toggleTheme(): Theme {
  const current = getStoredTheme()
  let next: Theme

  if (current === 'light') {
    next = 'dark'
  } else if (current === 'dark') {
    next = 'system'
  } else {
    next = 'light'
  }

  setStoredTheme(next)
  return next
}

export function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'fr'
  return localStorage.getItem(LANG_STORAGE_KEY) || 'fr'
}

export function setStoredLanguage(language: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_STORAGE_KEY, language)
  applyLanguage(language)
}

export function applyLanguage(language: string): void {
  if (typeof window === 'undefined') return

  const html = document.documentElement
  html.lang = language
  html.dir = language === 'ar' ? 'rtl' : 'ltr'

  // Add/remove RTL class for Tailwind if needed
  if (language === 'ar') {
    html.classList.add('rtl')
  } else {
    html.classList.remove('rtl')
  }
}

export function toggleLanguage(): string {
  const current = getStoredLanguage()
  const next = current === 'fr' ? 'ar' : 'fr'
  setStoredLanguage(next)
  return next
}

/**
 * Listen to theme changes from system preferences
 */
export function listenToThemeChanges(callback: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = () => {
    const stored = getStoredTheme()
    if (stored === 'system') {
      callback('system')
      applyTheme('system')
    }
  }

  mediaQuery.addEventListener('change', handleChange)

  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * Initialize theme and language on app load
 */
export function initializeThemeAndLanguage(): void {
  if (typeof window === 'undefined') return

  // Apply stored theme
  const theme = getStoredTheme()
  applyTheme(theme)

  // Apply stored language
  const language = getStoredLanguage()
  applyLanguage(language)
}

