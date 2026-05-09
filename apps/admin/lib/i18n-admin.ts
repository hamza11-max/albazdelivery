import { createTranslator, getDirection, getLangAttribute } from "@/root/lib/i18n"
import { ADMIN_TRANSLATIONS } from "./admin-translations"

export type AdminLanguage = "fr" | "ar"

const STORAGE_KEY = "albaz.admin.language"

function applyInterpolation(
  s: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return s
  let out = s
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v))
  }
  return out
}

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
  return (
    key: string,
    fallbackFr?: string,
    fallbackAr?: string,
    vars?: Record<string, string | number>
  ) => {
    const row = ADMIN_TRANSLATIONS[key]
    if (row) {
      const raw = lang === "ar" ? row.ar : row.fr
      return applyInterpolation(raw, vars)
    }
    const out = tt(key)
    if (out !== key) return applyInterpolation(out, vars)
    const fb = lang === "ar" ? fallbackAr ?? fallbackFr : fallbackFr ?? fallbackAr
    return applyInterpolation(fb ?? key, vars)
  }
}

