import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@albaz/ui"
import { SessionProvider } from "next-auth/react"
import { ThemeInitializer } from "../../../components/ThemeInitializer"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: "AL-baz Admin Panel",
  description: "Admin control panel for AL-baz delivery platform",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.variable}>
        <SessionProvider>
          <ThemeInitializer />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}

