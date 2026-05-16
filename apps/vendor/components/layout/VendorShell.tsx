"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent } from "@/root/components/ui/tabs"
import { ErrorBoundary } from "../ErrorBoundary"
import { VendorTopbar } from "../navigation/VendorTopbar"
import { VendorMenuGrid } from "../navigation/VendorMenuGrid"
import { VendorSubscriptionTrialPanel } from "../VendorSubscriptionTrialPanel"
import { AdminVendorSelector } from "../AdminVendorSelector"
import { setLightDarkTheme } from "@/root/lib/theme"
import type { User as UserType } from "@/root/lib/types"

export interface VendorShellProps {
  isArabic: boolean
  isElectronRuntime: boolean
  isDarkMode: boolean
  setIsDarkMode: (v: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  allowedTabIds: string[]
  translate: (fr: string, ar: string) => string
  unreadNotificationCount: number
  onOpenProfile: () => void
  onOpenNotifications: () => void
  onOpenHelp: () => void
  onMinimize: () => void
  onLogout: () => void
  isAdmin: boolean
  selectedVendorId: string | null
  setSelectedVendorId: (id: string | null) => void
  availableVendors: UserType[]
  isLoadingVendors: boolean
  subscription: unknown
  subscriptionLoading: boolean
  onSubscriptionUpdated: () => Promise<void>
  children: ReactNode
}

export function VendorShell({
  isArabic,
  isElectronRuntime,
  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab,
  allowedTabIds,
  translate,
  unreadNotificationCount,
  onOpenProfile,
  onOpenNotifications,
  onOpenHelp,
  onMinimize,
  onLogout,
  isAdmin,
  selectedVendorId,
  setSelectedVendorId,
  availableVendors,
  isLoadingVendors,
  subscription,
  subscriptionLoading,
  onSubscriptionUpdated,
  children,
}: VendorShellProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-transparent" dir={isArabic ? "rtl" : "ltr"}>
        <main className="w-full min-w-0 overflow-x-hidden" dir={isArabic ? "rtl" : "ltr"}>
          <div className="mx-auto h-full w-full max-w-[1900px] px-2 pb-4 pt-0 sm:px-4 sm:pb-6 2xl:px-6">
            <AdminVendorSelector
              isAdmin={isAdmin}
              selectedVendorId={selectedVendorId}
              setSelectedVendorId={setSelectedVendorId}
              availableVendors={availableVendors}
              isLoadingVendors={isLoadingVendors}
              translate={translate}
            />

            <VendorTopbar
              isElectronRuntime={isElectronRuntime}
              isArabic={isArabic}
              isDarkMode={isDarkMode}
              notificationCount={unreadNotificationCount}
              translate={translate}
              onOpenDashboard={() => setActiveTab("dashboard")}
              onOpenSettings={() => setActiveTab("settings")}
              onOpenProfile={onOpenProfile}
              onOpenNotifications={onOpenNotifications}
              onOpenMenuPage={() => setActiveTab("menu")}
              onOpenHelp={onOpenHelp}
              onMinimize={onMinimize}
              onLogout={onLogout}
              onToggleTheme={() => {
                const next = !isDarkMode
                setLightDarkTheme(next)
                setIsDarkMode(next)
              }}
            />

            <VendorSubscriptionTrialPanel
              variant="banner"
              translate={translate}
              subscription={subscription as any}
              loading={subscriptionLoading}
              onUpdated={onSubscriptionUpdated}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent
                value="menu"
                className="space-y-4 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6"
              >
                <VendorMenuGrid
                  allowedTabIds={allowedTabIds}
                  activeTab={activeTab}
                  translate={translate}
                  onSelectTab={setActiveTab}
                />
              </TabsContent>
              {children}
            </Tabs>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
