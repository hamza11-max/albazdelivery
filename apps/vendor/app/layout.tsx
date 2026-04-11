import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@albaz/ui"
import { ThemeInitializer } from "../../../components/ThemeInitializer"
import { ErrorBoundary } from "../../../components/ErrorBoundary"
import { SessionProvider } from "@/root/components/providers/SessionProvider"
import { PwaRegistration } from "../components/PwaRegistration"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: "AL-baz Vendor Dashboard",
  description: "Vendor dashboard for AL-baz delivery platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#3f5f2a",
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
          <PwaRegistration />
          <ThemeInitializer />
          <ErrorBoundary>
            <div className="min-h-screen bg-transparent text-foreground">
              {/* Sidebar is handled inside the vendor page component */}
              {children}
            </div>
          </ErrorBoundary>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}

