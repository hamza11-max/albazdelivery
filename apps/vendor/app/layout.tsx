import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@albaz/ui"
import { ThemeInitializer } from "../../../components/ThemeInitializer"
import { ErrorBoundary } from "../../../components/ErrorBoundary"
import { SessionProvider } from "@/root/components/providers/SessionProvider"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: "AL-baz Vendor Dashboard",
  description: "Vendor dashboard for AL-baz delivery platform",
}

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.variable}>
        <SessionProvider>
          <ThemeInitializer />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}

