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
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.close': 'Fermer',
  'common.remove': 'Retirer',
  'common.loadMore': 'Afficher plus',
  'products.search': 'Rechercher : nom, code-barres, SKU…',
  'products.allCategories': 'Toutes les catégories',
  'products.stockAll': 'Tout le stock',
  'products.stockLow': 'Stock bas',
  'products.stockOut': 'En rupture',
  'products.add': 'Ajouter un produit',
  'products.empty': 'Aucun produit pour l’instant. Ajoutez votre premier article.',
  'products.noMatch': 'Aucun produit ne correspond.',
  'products.count': 'produits',
  'products.colName': 'Produit',
  'products.colCategory': 'Catégorie',
  'products.colPrice': 'Prix',
  'products.colVariants': 'Variantes',
  'products.colStock': 'Stock',
  'editor.new': 'Nouveau produit',
  'editor.edit': 'Modifier le produit',
  'editor.name': 'Nom (arabe ou français)',
  'editor.nameAlt': 'Nom dans l’autre langue',
  'editor.category': 'Catégorie',
  'editor.noCategory': 'Sans catégorie',
  'editor.newCategory': '+ Nouvelle catégorie',
  'editor.newCategoryName': 'Nom de la catégorie',
  'editor.brand': 'Marque',
  'editor.costPrice': 'Prix d’achat (DA)',
  'editor.salePrice': 'Prix de vente (DA)',
  'editor.options': 'Options (taille, couleur…)',
  'editor.optionName': 'Option',
  'editor.optionValues': 'Valeurs, séparées par des virgules',
  'editor.generate': 'Créer les variantes',
  'editor.variants': 'Variantes',
  'editor.sku': 'SKU',
  'editor.skuAuto': 'auto',
  'editor.barcode': 'Code-barres',
  'editor.newBarcode': 'Générer',
  'editor.priceOverride': 'Prix (si différent)',
  'editor.lowStock': 'Alerte stock',
  'editor.stock': 'Stock',
  'editor.addVariant': '+ Variante',
  'editor.archive': 'Archiver le produit',
  'editor.archiveConfirm': 'Archiver ce produit ? Il disparaîtra des listes mais reste dans l’historique des ventes.',
  'editor.saved': 'Produit enregistré.',
  'error.DUPLICATE_BARCODE': 'Ce code-barres est déjà utilisé.',
  'error.DUPLICATE_SKU': 'Ce SKU est déjà utilisé.',
  'error.DUPLICATE_CATEGORY': 'Cette catégorie existe déjà.',
  'error.CONFLICT': 'Ce produit a été modifié ailleurs. Rechargez-le.',
  'error.INVALID_INPUT': 'Vérifiez les champs.',
  'error.FILE_TOO_LARGE': 'Fichier trop volumineux.',
  'error.UNSUPPORTED_FILE': 'Choisissez un fichier Excel (.xlsx) ou CSV.',
  'error.INVALID_FILE': 'Fichier illisible.',
  'error.EMPTY_FILE': 'Le fichier est vide.',
  'error.TOO_MANY_ROWS': 'Trop de lignes (20 000 maximum).',
  'error.IMPORT_EXPIRED': 'Choisissez à nouveau le fichier.',
  'import.button': 'Importer',
  'import.title': 'Importer des produits',
  'import.help': 'Une ligne par variante. Les lignes avec le même nom forment un seul produit. Fichiers .xlsx ou .csv, 20 000 lignes maximum.',
  'import.template': 'Télécharger le modèle',
  'import.templateSaved': 'Modèle enregistré :',
  'import.choose': 'Choisir un fichier…',
  'import.ready': 'Prêt à importer',
  'import.products': 'produits',
  'import.variants': 'variantes',
  'import.newCategories': 'Nouvelles catégories',
  'import.errors': 'Erreurs à corriger dans le fichier',
  'import.moreErrors': 'autres erreurs non affichées',
  'import.row': 'Ligne',
  'import.problem': 'Problème',
  'import.commit': 'Importer',
  'import.done': 'Import terminé :',
  'import.nothing': 'Aucun produit trouvé dans le fichier.',
  'issue.MISSING_COLUMN': 'Colonne obligatoire manquante',
  'issue.REQUIRED': 'Valeur obligatoire manquante',
  'issue.INVALID_NUMBER': 'Nombre invalide',
  'issue.NOT_WHOLE': 'Montant en dinars entiers uniquement',
  'issue.CONFLICTING_VALUE': 'Différent de la ligne',
  'issue.DUPLICATE_SKU': 'SKU répété — déjà à la ligne',
  'issue.DUPLICATE_BARCODE': 'Code-barres répété — déjà à la ligne',
  'issue.SKU_EXISTS': 'SKU déjà utilisé dans la boutique',
  'issue.BARCODE_EXISTS': 'Code-barres déjà utilisé dans la boutique',
  'issue.INVALID': 'Valeur incorrecte',
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
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.close': 'إغلاق',
  'common.remove': 'حذف',
  'common.loadMore': 'عرض المزيد',
  'products.search': 'بحث: الاسم، الباركود، SKU…',
  'products.allCategories': 'كل الأصناف',
  'products.stockAll': 'كل المخزون',
  'products.stockLow': 'مخزون منخفض',
  'products.stockOut': 'نفد من المخزون',
  'products.add': 'إضافة منتج',
  'products.empty': 'لا توجد منتجات بعد. أضف أول منتج.',
  'products.noMatch': 'لا توجد منتجات مطابقة.',
  'products.count': 'منتج',
  'products.colName': 'المنتج',
  'products.colCategory': 'الصنف',
  'products.colPrice': 'السعر',
  'products.colVariants': 'المتغيرات',
  'products.colStock': 'المخزون',
  'editor.new': 'منتج جديد',
  'editor.edit': 'تعديل المنتج',
  'editor.name': 'الاسم (بالعربية أو الفرنسية)',
  'editor.nameAlt': 'الاسم باللغة الأخرى',
  'editor.category': 'الصنف',
  'editor.noCategory': 'بدون صنف',
  'editor.newCategory': '+ صنف جديد',
  'editor.newCategoryName': 'اسم الصنف',
  'editor.brand': 'العلامة التجارية',
  'editor.costPrice': 'سعر الشراء (د.ج)',
  'editor.salePrice': 'سعر البيع (د.ج)',
  'editor.options': 'الخيارات (المقاس، اللون…)',
  'editor.optionName': 'الخيار',
  'editor.optionValues': 'القيم، مفصولة بفواصل',
  'editor.generate': 'إنشاء المتغيرات',
  'editor.variants': 'المتغيرات',
  'editor.sku': 'SKU',
  'editor.skuAuto': 'تلقائي',
  'editor.barcode': 'الباركود',
  'editor.newBarcode': 'توليد',
  'editor.priceOverride': 'السعر (إن كان مختلفاً)',
  'editor.lowStock': 'تنبيه المخزون',
  'editor.stock': 'المخزون',
  'editor.addVariant': '+ متغير',
  'editor.archive': 'أرشفة المنتج',
  'editor.archiveConfirm': 'أرشفة هذا المنتج؟ سيختفي من القوائم لكنه يبقى في سجل المبيعات.',
  'editor.saved': 'تم حفظ المنتج.',
  'error.DUPLICATE_BARCODE': 'هذا الباركود مستعمل من قبل.',
  'error.DUPLICATE_SKU': 'هذا الـSKU مستعمل من قبل.',
  'error.DUPLICATE_CATEGORY': 'هذا الصنف موجود من قبل.',
  'error.CONFLICT': 'تم تعديل هذا المنتج في مكان آخر. أعد تحميله.',
  'error.INVALID_INPUT': 'تحقق من الحقول.',
  'error.FILE_TOO_LARGE': 'الملف كبير جداً.',
  'error.UNSUPPORTED_FILE': 'اختر ملف Excel (.xlsx) أو CSV.',
  'error.INVALID_FILE': 'تعذرت قراءة الملف.',
  'error.EMPTY_FILE': 'الملف فارغ.',
  'error.TOO_MANY_ROWS': 'عدد الأسطر كبير جداً (20 000 كحد أقصى).',
  'error.IMPORT_EXPIRED': 'اختر الملف من جديد.',
  'import.button': 'استيراد',
  'import.title': 'استيراد المنتجات',
  'import.help': 'سطر لكل متغير. الأسطر التي تحمل نفس الاسم تُكوّن منتجاً واحداً. ملفات .xlsx أو .csv، حتى 20 000 سطر.',
  'import.template': 'تحميل النموذج',
  'import.templateSaved': 'تم حفظ النموذج:',
  'import.choose': 'اختيار ملف…',
  'import.ready': 'جاهز للاستيراد',
  'import.products': 'منتج',
  'import.variants': 'متغير',
  'import.newCategories': 'أصناف جديدة',
  'import.errors': 'أخطاء يجب تصحيحها في الملف',
  'import.moreErrors': 'أخطاء أخرى غير معروضة',
  'import.row': 'السطر',
  'import.problem': 'المشكلة',
  'import.commit': 'استيراد',
  'import.done': 'تم الاستيراد:',
  'import.nothing': 'لم يتم العثور على منتجات في الملف.',
  'issue.MISSING_COLUMN': 'عمود إلزامي ناقص',
  'issue.REQUIRED': 'قيمة إلزامية ناقصة',
  'issue.INVALID_NUMBER': 'رقم غير صالح',
  'issue.NOT_WHOLE': 'المبالغ بالدينار الكامل فقط',
  'issue.CONFLICTING_VALUE': 'يختلف عن السطر',
  'issue.DUPLICATE_SKU': 'SKU مكرر — موجود في السطر',
  'issue.DUPLICATE_BARCODE': 'باركود مكرر — موجود في السطر',
  'issue.SKU_EXISTS': 'SKU مستعمل من قبل في المتجر',
  'issue.BARCODE_EXISTS': 'باركود مستعمل من قبل في المتجر',
  'issue.INVALID': 'قيمة غير صحيحة',
}

const DICTIONARIES: Record<Language, Record<Key, string>> = { ar, fr }

interface I18n {
  lang: Language
  dir: 'rtl' | 'ltr'
  t: (key: Key) => string
  /** Message for an ApiError code, falling back to the server's message. */
  errorText: (err: unknown) => string
  /** 12500 → "12 500 د.ج" / "12 500 DA" */
  money: (n: number) => string
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

  const value = useMemo<I18n>(() => {
    const dict = DICTIONARIES[lang]
    return {
      lang,
      dir,
      t: (key) => dict[key],
      errorText: (err) => {
        const key = `error.${(err as { code?: string }).code ?? ''}` as Key
        return dict[key] ? `${dict[key]} ${(err as Error).message}` : `${dict['common.error']}: ${(err as Error).message}`
      },
      money: (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${lang === 'ar' ? 'د.ج' : 'DA'}`,
      setLang,
    }
  }, [lang, dir, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export type { Key as MessageKey }
