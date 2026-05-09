"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  applyAdminLanguageToDocument,
  createAdminT,
  getInitialAdminLanguage,
  persistAdminLanguage,
  type AdminLanguage,
} from "./i18n-admin"

type AdminT = ReturnType<typeof createAdminT>

type AdminI18nContextValue = {
  language: AdminLanguage
  setLanguage: (lang: AdminLanguage) => void
  t: AdminT
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null)

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>(() => getInitialAdminLanguage())

  const setLanguage = useCallback((lang: AdminLanguage) => {
    setLanguageState(lang)
  }, [])

  useEffect(() => {
    persistAdminLanguage(language)
    applyAdminLanguageToDocument(language)
  }, [language])

  const t = useMemo(() => createAdminT(language), [language])

  const value = useMemo<AdminI18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  )

  return <AdminI18nContext.Provider value={value}>{children}</AdminI18nContext.Provider>
}

export function useAdminI18n(): AdminI18nContextValue {
  const ctx = useContext(AdminI18nContext)
  if (!ctx) {
    throw new Error("useAdminI18n must be used within AdminI18nProvider")
  }
  return ctx
}
