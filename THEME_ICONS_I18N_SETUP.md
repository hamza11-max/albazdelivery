# Theme, Icons, and i18n Setup Guide

This document explains the theme management, icon usage, and internationalization (i18n) setup for the AL-baz Delivery application.

## Table of Contents
1. [Icon System](#icon-system)
2. [Theme Management](#theme-management)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [RTL Support for Arabic](#rtl-support-for-arabic)

---

## Icon System

### Using Lucide React Icons

All icons in the application come from the **lucide-react** library, which is already installed.

#### Basic Icon Usage

```tsx
import { ShoppingCart, Home, Menu, X, ChevronRight } from 'lucide-react'

export function MyComponent() {
  return (
    <div>
      <ShoppingCart className="w-5 h-5 text-blue-500" />
      <Home className="w-5 h-5" />
      <ChevronRight className="w-6 h-6" />
    </div>
  )
}
```

#### Icon Sizing Classes

- `w-4 h-4` - Small (16x16px)
- `w-5 h-5` - Default (20x20px)
- `w-6 h-6` - Medium (24x24px)
- `w-8 h-8` - Large (32x32px)
- `w-10 h-10` - Extra Large (40x40px)

#### Common Icons

```tsx
// Navigation
import { Home, ShoppingCart, User, Menu, Search } from 'lucide-react'

// Status
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'

// Actions
import { Plus, Minus, Trash2, Edit, Copy, Share2 } from 'lucide-react'

// Theme
import { Sun, Moon } from 'lucide-react'

// Communication
import { Bell, Mail, MessageSquare, Phone } from 'lucide-react'

// Location
import { MapPin, Navigation, Map } from 'lucide-react'

// Transport
import { Truck, Package, Bike } from 'lucide-react'

// Other
import { Globe, Settings, LogOut, MoreVertical } from 'lucide-react'
```

#### Fixing Missing Icons

If icons are not appearing:

1. **Clear Node Modules**: Icons might be corrupted
   ```bash
   npm install
   ```

2. **Check Import Statement**: Ensure you're importing from 'lucide-react'
   ```tsx
   // ✅ Correct
   import { Home } from 'lucide-react'
   
   // ❌ Wrong
   import { Home } from '@/components/icons'
   ```

3. **Verify Icon Name**: Icons are case-sensitive
   ```tsx
   // ✅ Correct (PascalCase)
   <ShoppingCart />
   
   // ❌ Wrong (snake_case)
   <shopping_cart />
   ```

---

## Theme Management

The application supports **light**, **dark**, and **system** themes with persistent storage.

### Theme Functions

Located in `lib/theme.ts`:

```tsx
import {
  getStoredTheme,      // Get current theme from localStorage
  setStoredTheme,      // Set and apply theme
  toggleTheme,         // Cycle: light → dark → system → light
  applyTheme,          // Apply theme to DOM
  getStoredLanguage,   // Get current language
  setStoredLanguage,   // Set and apply language
  toggleLanguage,      // Toggle between languages
  applyLanguage,       // Apply language and RTL settings
  initializeThemeAndLanguage, // Initialize on app load
} from '@/lib/theme'
```

### Using ThemeToggle Component

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  )
}
```

### Using ThemeInitializer

Already included in `app/layout.tsx` - automatically initializes theme and language on page load:

```tsx
import { ThemeInitializer } from '@/components/ThemeInitializer'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ThemeInitializer /> {/* Initializes theme on load */}
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Dark Mode in Components

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getStoredTheme } from '@/lib/theme'

export function MyComponent() {
  const [theme, setTheme] = useState('system')

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  return (
    <div className="bg-white dark:bg-slate-900 text-black dark:text-white">
      Current theme: {theme}
    </div>
  )
}
```

### CSS for Dark Mode

Use Tailwind's `dark:` prefix:

```tsx
<div className="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-800
">
  Content
</div>
```

---

## Internationalization (i18n)

The application supports **French (fr)** and **Arabic (ar)** with a simple translation system.

### Translation System

Located in `lib/i18n.ts`:

```tsx
import { t, createTranslator, isRTL, getDirection } from '@/lib/i18n'

// Simple usage
const welcomeText = t('nav.home', 'en')  // Returns: 'Home'
const welcomeTextFr = t('nav.home', 'fr') // Returns: 'Accueil'
const welcomeTextAr = t('nav.home', 'ar') // Returns: 'الرئيسية'

// Create translator for specific language
const translator = createTranslator('ar')
const text = translator('nav.home') // Returns: 'الرئيسية'

// Check RTL
if (isRTL('ar')) {
  // Apply RTL styles
}

// Get direction
const dir = getDirection('ar') // Returns: 'rtl'
```

### Adding New Translations

Edit `lib/i18n.ts`:

```tsx
export const translations: Translation = {
  // ... existing translations
  
  // Add new translation
  'myfeature.title': {
    en: 'My Feature',
    fr: 'Ma Fonctionnalité',
    ar: 'ميزتي',
  },
}
```

### Using Translations in Components

```tsx
'use client'

import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'
import { getStoredLanguage } from '@/lib/theme'

export function MyComponent() {
  const [language, setLanguage] = useState('fr')

  useEffect(() => {
    setLanguage(getStoredLanguage())
  }, [])

  return (
    <div>
      <h1>{t('nav.home', language as any)}</h1>
      <p>{t('common.search', language as any)}</p>
    </div>
  )
}
```

### Using LanguageToggle Component

```tsx
import { LanguageToggle } from '@/components/LanguageToggle'

export function Header() {
  const [language, setLanguage] = useState('fr')

  return (
    <header>
      <LanguageToggle onLanguageChange={setLanguage} />
    </header>
  )
}
```

---

## RTL Support for Arabic

Arabic requires Right-to-Left (RTL) text direction. This is automatically handled by the theme system.

### Automatic RTL Handling

When language is set to 'ar':
- HTML `dir` attribute is set to `rtl`
- CSS class `rtl` is added to `<html>`
- Text direction and alignment are automatically reversed

### RTL Utilities in CSS

In `app/globals.css`:

```css
html.rtl,
html[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* RTL margin utilities */
.rtl .ml-auto { margin-right: auto; margin-left: 0; }
.rtl .mr-auto { margin-left: auto; margin-right: 0; }
.rtl .text-left { text-align: right; }
.rtl .text-right { text-align: left; }
```

### Manual RTL Support in Components

```tsx
import { isRTL, getDirection } from '@/lib/i18n'

export function MyComponent({ language }: { language: string }) {
  const isArabic = isRTL(language as any)
  const direction = getDirection(language as any)

  return (
    <div dir={direction}>
      <p className={isArabic ? 'text-right' : 'text-left'}>
        Content
      </p>
    </div>
  )
}
```

---

## Complete Example: Header with Theme, Language, and Icons

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Globe, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import {
  toggleTheme,
  getStoredTheme,
  toggleLanguage,
  getStoredLanguage,
} from '@/lib/theme'

export default function Header() {
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(getStoredTheme())
    setLanguage(getStoredLanguage())
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <header className="
      sticky top-0 z-50
      bg-gradient-to-r from-primary to-orange-500
      text-white shadow-lg
    ">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">AL-baz</h1>
            <p className="text-xs text-white/80">Delivery</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                toggleTheme()
                setTheme(getStoredTheme())
              }}
              className="text-white hover:bg-white/20"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                toggleLanguage()
                setLanguage(getStoredLanguage())
              }}
              className="text-white hover:bg-white/20"
              title={language === 'fr' ? 'العربية' : 'Français'}
            >
              <Globe className="w-5 h-5" />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title={t('auth.logout', language as any)}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
```

---

## Troubleshooting

### Icons not showing
- ✅ Ensure lucide-react is installed: `npm list lucide-react`
- ✅ Check import path: `from 'lucide-react'` (not from custom paths)
- ✅ Verify icon name in docs: https://lucide.dev

### Theme not persisting
- ✅ Check localStorage is enabled in browser
- ✅ Verify `ThemeInitializer` is in layout
- ✅ Clear browser cache: Cmd+Shift+Delete

### RTL text not working
- ✅ Ensure language is set to 'ar'
- ✅ Check `ThemeInitializer` runs on page load
- ✅ Verify HTML element has `dir="rtl"` attribute

### Translations not appearing
- ✅ Add key to `lib/i18n.ts` translations object
- ✅ Use correct language code: 'en', 'fr', 'ar'
- ✅ Check key syntax: lowercase with dots (e.g., 'nav.home')

---

## References

- Lucide Icons: https://lucide.dev
- Tailwind Dark Mode: https://tailwindcss.com/docs/dark-mode
- i18n Best Practices: https://developer.mozilla.org/en-US/docs/Glossary/i18n
- RTL Support: https://www.w3.org/International/questions/qa-html-dir

