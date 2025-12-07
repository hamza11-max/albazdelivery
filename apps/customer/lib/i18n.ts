/**
 * i18n - Internationalization module for Arabic and French
 */

type Language = 'en' | 'fr' | 'ar'

type Translation = {
  [key: string]: {
    en: string
    fr: string
    ar: string
  }
}

export const translations: Translation = {
  // Navigation
  'nav.home': {
    en: 'Home',
    fr: 'Accueil',
    ar: 'الرئيسية',
  },
  'nav.profile': {
    en: 'Profile',
    fr: 'Profil',
    ar: 'الملف الشخصي',
  },
  'nav.orders': {
    en: 'Orders',
    fr: 'Commandes',
    ar: 'الطلبات',
  },
  'nav.notifications': {
    en: 'Notifications',
    fr: 'Notifications',
    ar: 'الإشعارات',
  },
  'nav.settings': {
    en: 'Settings',
    fr: 'Paramètres',
    ar: 'الإعدادات',
  },

  // Common
  'common.search': {
    en: 'Search',
    fr: 'Rechercher',
    ar: 'بحث',
  },
  'common.loading': {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'جاري التحميل...',
  },
  'common.error': {
    en: 'Error',
    fr: 'Erreur',
    ar: 'خطأ',
  },
  'common.success': {
    en: 'Success',
    fr: 'Succès',
    ar: 'نجح',
  },
  'common.cancel': {
    en: 'Cancel',
    fr: 'Annuler',
    ar: 'إلغاء',
  },
  'common.delete': {
    en: 'Delete',
    fr: 'Supprimer',
    ar: 'حذف',
  },
  'common.edit': {
    en: 'Edit',
    fr: 'Modifier',
    ar: 'تعديل',
  },
  'common.save': {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ',
  },
  'common.close': {
    en: 'Close',
    fr: 'Fermer',
    ar: 'إغلاق',
  },

  // Auth
  'auth.login': {
    en: 'Sign In',
    fr: 'Se connecter',
    ar: 'تسجيل الدخول',
  },
  'auth.logout': {
    en: 'Sign Out',
    fr: 'Se déconnecter',
    ar: 'تسجيل الخروج',
  },
  'auth.signup': {
    en: 'Sign Up',
    fr: 'S\'inscrire',
    ar: 'إنشاء حساب',
  },
  'auth.email': {
    en: 'Email',
    fr: 'Email',
    ar: 'البريد الإلكتروني',
  },
  'auth.password': {
    en: 'Password',
    fr: 'Mot de passe',
    ar: 'كلمة المرور',
  },

  // Orders
  'order.title': {
    en: 'Orders',
    fr: 'Commandes',
    ar: 'الطلبات',
  },
  'order.status.pending': {
    en: 'Pending',
    fr: 'En attente',
    ar: 'قيد الانتظار',
  },
  'order.status.confirmed': {
    en: 'Confirmed',
    fr: 'Confirmée',
    ar: 'مؤكدة',
  },
  'order.status.processing': {
    en: 'Processing',
    fr: 'En traitement',
    ar: 'قيد المعالجة',
  },
  'order.status.ready': {
    en: 'Ready',
    fr: 'Prêt',
    ar: 'جاهز',
  },
  'order.status.shipped': {
    en: 'Shipped',
    fr: 'Expédié',
    ar: 'تم الشحن',
  },
  'order.status.delivered': {
    en: 'Delivered',
    fr: 'Livré',
    ar: 'تم التسليم',
  },
  'order.status.cancelled': {
    en: 'Cancelled',
    fr: 'Annulée',
    ar: 'ملغاة',
  },

  // Categories
  'category.shops': {
    en: 'Shops',
    fr: 'Boutiques',
    ar: 'متاجر',
  },
  'category.pharmacy': {
    en: 'Pharmacy & Beauty',
    fr: 'Pharmacie & Beauté',
    ar: 'صيدلية وتجميل',
  },
  'category.groceries': {
    en: 'Groceries',
    fr: 'Épicerie',
    ar: 'بقالة',
  },
  'category.food': {
    en: 'Food',
    fr: 'Nourriture',
    ar: 'طعام',
  },
  'category.delivery': {
    en: 'Package Delivery',
    fr: 'Livraison de colis',
    ar: 'توصيل الطرود',
  },

  // Theme
  'theme.darkMode': {
    en: 'Dark Mode',
    fr: 'Mode Sombre',
    ar: 'الوضع الداكن',
  },
  'theme.lightMode': {
    en: 'Light Mode',
    fr: 'Mode Clair',
    ar: 'الوضع الفاتح',
  },

  // Language
  'lang.french': {
    en: 'French',
    fr: 'Français',
    ar: 'الفرنسية',
  },
  'lang.arabic': {
    en: 'Arabic',
    fr: 'Arabe',
    ar: 'العربية',
  },
  'lang.english': {
    en: 'English',
    fr: 'Anglais',
    ar: 'الإنجليزية',
  },
}

/**
 * Get translated text
 * @param key - Translation key (e.g., 'nav.home')
 * @param language - Language code (en, fr, ar)
 * @returns Translated string or key if not found
 */
export function t(key: string, language: Language = 'en'): string {
  const translationKey = key as keyof typeof translations
  if (translations[translationKey]) {
    return translations[translationKey][language]
  }
  return key
}

/**
 * Create a translation function with predefined language
 */
export function createTranslator(language: Language) {
  return (key: string) => t(key, language)
}

/**
 * Check if language is RTL (Right-to-Left)
 */
export function isRTL(language: Language): boolean {
  return language === 'ar'
}

/**
 * Get HTML dir attribute value
 */
export function getDirection(language: Language): 'ltr' | 'rtl' {
  return isRTL(language) ? 'rtl' : 'ltr'
}

/**
 * Get HTML lang attribute value
 */
export function getLangAttribute(language: Language): string {
  if (language === 'ar') return 'ar-SA'
  if (language === 'fr') return 'fr-FR'
  return 'en-US'
}

