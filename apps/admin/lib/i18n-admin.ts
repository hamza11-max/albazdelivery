import { createTranslator, getDirection, getLangAttribute } from "@/root/lib/i18n"

export type AdminLanguage = "fr" | "ar"

const STORAGE_KEY = "albaz.admin.language"

export function getInitialAdminLanguage(): AdminLanguage {
  if (typeof window === "undefined") return "fr"
  const raw = String(window.localStorage.getItem(STORAGE_KEY) || "").toLowerCase()
  return raw === "ar" ? "ar" : "fr"
}

export function persistAdminLanguage(lang: AdminLanguage) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, lang)
}

export function applyAdminLanguageToDocument(lang: AdminLanguage) {
  if (typeof document === "undefined") return
  document.documentElement.dir = getDirection(lang)
  document.documentElement.lang = getLangAttribute(lang)
}

export function createAdminT(lang: AdminLanguage) {
  const tt = createTranslator(lang)
  return (key: string, fallbackFr?: string, fallbackAr?: string) => {
    // Prefer shared translation keys when present; otherwise use inline fallback.
    const out = tt(key)
    if (out !== key) return out
    if (lang === "ar" && fallbackAr) return fallbackAr
    if (lang === "fr" && fallbackFr) return fallbackFr
    return fallbackFr ?? fallbackAr ?? key
  }
}

