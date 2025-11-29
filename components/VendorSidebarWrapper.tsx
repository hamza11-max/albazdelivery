"use client"

import { useState } from "react"
import VendorSidebar from "./VendorSidebar"

export default function VendorSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [language, setLanguage] = useState("fr")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const translate = (fr: string, ar: string) => (language === "fr" ? fr : ar)

  return (
    <div>
      <VendorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        translate={translate}
      />

      <main className="min-h-screen md:pl-20 lg:pl-[240px] pb-24">
        {children}
      </main>
    </div>
  )
}
