"use client"

import { useCallback, useEffect, useState } from "react"
import { getStoredLanguage } from "../lib/theme"
import type { TranslationFn } from "../lib/types"

/**
 * Same contract as main app `t(key, fr, ar, en?)`; reads language from localStorage (`albaz-language`).
 * English is optional on each call; when omitted, English falls back to French.
 */
export function useProfileI18n(): TranslationFn {
  const [lang, setLang] = useState<string>("fr")

  useEffect(() => {
    const refresh = () => setLang(getStoredLanguage())
    refresh()
    window.addEventListener("storage", refresh)
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("albaz-language", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("albaz-language", refresh)
    }
  }, [])

  return useCallback(
    (_: string, fr: string, ar: string, en?: string) => {
      if (lang === "ar") return ar
      if (lang === "en") return en ?? fr
      return fr
    },
    [lang],
  )
}
