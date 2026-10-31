import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { Language } from '../shared/ipc'
import { call } from './api'

const fr = {
  'app.name': 'AL-baz POS',
  'nav.sell': 'Vente',
  'nav.history': 'Historique',
  'nav.products': 'Produits',
  'nav.stock': 'Stock',
  'nav.reports': 'Rapports',
  'nav.settings': 'Réglages',
  'status.local': 'Local uniquement',
  'empty.sell': 'L’écran de vente arrivera ici : scanner, panier, paiement.',
  'empty.history': 'Les ventes, retours et réimpressions apparaîtront ici.',
  'empty.products': 'Ajoutez vos produits, tailles et couleurs, et importez depuis Excel.',
  'empty.stock': 'Réception de marchandise, ajustements et alertes de stock bas.',
  'empty.reports': 'Ventes du jour, marges et clôtures de caisse.',
  'empty.soon': 'Bientôt disponible',
  'settings.language': 'Langue',
  'settings.database': 'Base de données',
  'settings.dbVersion': 'Version du schéma',
  'settings.dbPath': 'Fichier',
  'settings.migrations': 'Migrations appliquées',
  'settings.app': 'Application',
  'settings.printTest': 'Test d’impression',
  'print.language': 'Langue du ticket',
  'print.paper': 'Papier',
  'print.printer': 'Imprimante Windows',
  'print.noPrinters': 'Aucune imprimante trouvée',
  'print.preview': 'Aperçu',
  'print.raster': 'Imprimer (image)',
  'print.driver': 'Imprimer (pilote)',
  'print.drawer': 'Ouvrir le tiroir',
  'print.sent': 'Envoyé à l’imprimante.',
  'common.loading': 'Chargement…',
  'common.error': 'Erreur',
}

type Key = keyof typeof fr

const ar: Record<Key, string> = {
  'app.name': 'الباز - نقطة البيع',
  'nav.sell': 'البيع',
  'nav.history': 'السجل',
  'nav.products': 'المنتجات',
  'nav.stock': 'المخزون',
  'nav.reports': 'التقارير',
  'nav.settings': 'الإعدادات',
  'status.local': 'محلي فقط',
  'empty.sell': 'شاشة البيع ستكون هنا: المسح، السلة، الدفع.',
  'empty.history': 'ستظهر هنا المبيعات والمرتجعات وإعادة الطباعة.',
  'empty.products': 'أضف منتجاتك ومقاساتها وألوانها، واستوردها من Excel.',
  'empty.stock': 'استلام البضاعة والتعديلات وتنبيهات نفاد المخزون.',
  'empty.reports': 'مبيعات اليوم والأرباح وإغلاق الصندوق.',
  'empty.soon': 'قريباً',
  'settings.language': 'اللغة',
  'settings.database': 'قاعدة البيانات',
  'settings.dbVersion': 'إصدار المخطط',
  'settings.dbPath': 'الملف',
  'settings.migrations': 'الترحيلات المطبقة',
  'settings.app': 'التطبيق',
  'settings.printTest': 'تجربة الطباعة',
  'print.language': 'لغة الوصل',
  'print.paper': 'الورق',
  'print.printer': 'طابعة ويندوز',
  'print.noPrinters': 'لم يتم العثور على طابعة',
  'print.preview': 'معاينة',
  'print.raster': 'طباعة (صورة)',
  'print.driver': 'طباعة (برنامج التشغيل)',
  'print.drawer': 'فتح الدرج',
  'print.sent': 'تم الإرسال إلى الطابعة.',
  'common.loading': 'جارٍ التحميل…',
  'common.error': 'خطأ',
}

const DICTIONARIES: Record<Language, Record<Key, string>> = { ar, fr }

interface I18n {
  lang: Language
  dir: 'rtl' | 'ltr'
  t: (key: Key) => string
  setLang: (lang: Language) => Promise<void>
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ initial, children }: { initial: Language; children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initial)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback(async (next: Language) => {
    await call('settings:setLanguage', { lang: next })
    setLangState(next)
  }, [])

  const value = useMemo<I18n>(() => ({ lang, dir, t: (key) => DICTIONARIES[lang][key], setLang }), [lang, dir, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export type { Key as MessageKey }
