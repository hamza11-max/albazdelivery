# Quick Start: Theme, Icons & i18n

## 🚀 Quick Reference

### Using Icons
```tsx
import { ShoppingCart, Home, Menu, Sun, Moon } from 'lucide-react'

<ShoppingCart className="w-5 h-5 text-blue-500" />
```

### Using Translations
```tsx
import { t } from '@/lib/i18n'

const text = t('nav.home', 'fr')  // Returns: 'Accueil'
const text = t('nav.home', 'ar')  // Returns: 'الرئيسية'
```

### Theme Toggle
```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle />
```

### Language Toggle
```tsx
import { LanguageToggle } from '@/components/LanguageToggle'

<LanguageToggle onLanguageChange={(lang) => console.log(lang)} />
```

---

## 📋 Common Tasks

### Add a New Translation
1. Open `lib/i18n.ts`
2. Add to `translations` object:
   ```tsx
   'mykey.text': {
     en: 'English text',
     fr: 'Texte français',
     ar: 'النص العربي',
   }
   ```
3. Use in component:
   ```tsx
   const text = t('mykey.text', language)
   ```

### Fix Missing Icons
1. Check import: `import { IconName } from 'lucide-react'`
2. Icon names are PascalCase (e.g., `ShoppingCart`, not `shopping_cart`)
3. Run: `npm install`
4. Clear browser cache

### Apply Dark Mode to Component
```tsx
<div className="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-gray-100
">
  This adapts to dark mode!
</div>
```

### Support RTL (Arabic)
The app automatically handles RTL when language is 'ar'. No additional code needed!

---

## 🔧 Components Available

| Component | Purpose |
|-----------|---------|
| `ThemeToggle` | Button to switch themes |
| `LanguageToggle` | Button to switch languages |
| `ThemeInitializer` | Initializes theme on app load |
| `Header` | Pre-built header with all features |

---

## 📚 Full Documentation

See `THEME_ICONS_I18N_SETUP.md` for complete documentation.

