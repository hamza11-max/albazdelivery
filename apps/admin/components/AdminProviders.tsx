"use client"

import type React from "react"
import { AdminI18nProvider } from "../lib/AdminI18nProvider"

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <AdminI18nProvider>{children}</AdminI18nProvider>
}
