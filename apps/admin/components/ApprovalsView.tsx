"use client"

import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@albaz/ui"
import { UserCheck, Truck, Store, UserX } from "lucide-react"
import type { RegistrationRequest } from "@/root/lib/types"
import { useEffect, useState } from "react"
import { useAdminI18n } from "../lib/AdminI18nProvider"

interface ApprovalsViewProps {
  requests: RegistrationRequest[]
  selectedRequest: RegistrationRequest | null
  showDialog: boolean
  onRequestClick: (request: RegistrationRequest) => void
  onDialogChange: (open: boolean) => void
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}

export function ApprovalsView({
  requests,
  selectedRequest,
  showDialog,
  onRequestClick,
  onDialogChange,
  onApprove,
  onReject,
}: ApprovalsViewProps) {
  const { t, language } = useAdminI18n()
  const [vendorProfiles, setVendorProfiles] = useState<Record<string, any>>({})

  useEffect(() => {
    const vendorIds = requests.filter((r) => r.role === "vendor").map((r) => r.id)
    const unique = Array.from(new Set(vendorIds)).filter(Boolean)
    if (!unique.length) return
    let cancelled = false
    unique.forEach(async (id) => {
      if (vendorProfiles[id]) return
      try {
        const res = await fetch(`/api/vendor/profile?vendorId=${id}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.success && data.profile) {
          setVendorProfiles((prev) => ({ ...prev, [id]: data.profile }))
        }
      } catch {
        // ignore
      }
    })
    return () => {
      cancelled = true
    }
  }, [requests, vendorProfiles])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("approvals.title")}</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {t("approvals.pendingBadge", undefined, undefined, { count: String(requests.length) })}
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t("approvals.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {request.role === "driver" ? (
                          <Truck className="w-7 h-7 text-primary" />
                        ) : vendorProfiles[request.id]?.logo ? (
                          // If vendor and logo available
                          <img src={vendorProfiles[request.id].logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-7 h-7 text-primary" />
                        )}
                      </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg">{vendorProfiles[request.id]?.name || request.name}</p>
                          <Badge variant="outline">
                            {request.role === "driver" ? t("approvals.roleDriver") : t("approvals.roleVendor")}
                          </Badge>
                      </div>
                        <p className="text-sm text-muted-foreground">{vendorProfiles[request.id]?.email || request.email}</p>
                        <p className="text-sm text-muted-foreground">{vendorProfiles[request.id]?.phone || request.phone}</p>
                        {vendorProfiles[request.id]?.address && (
                          <p className="text-xs text-muted-foreground">{vendorProfiles[request.id].address}</p>
                        )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("approvals.requestedOn")}{" "}
                        {new Date(request.createdAt).toLocaleDateString(language === "ar" ? "ar-DZ" : "fr-DZ")}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => onRequestClick(request)}>
                    {t("approvals.examine")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={onDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("approvals.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("approvals.dialogDesc")}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("common.role")}</p>
                <p className="text-lg">
                  {selectedRequest.role === "driver" ? t("approvals.roleDriver") : t("approvals.roleVendor")}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("common.name")}</p>
                <p className="text-lg">{selectedRequest.name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("common.email")}</p>
                <p className="text-lg">{selectedRequest.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("common.phone")}</p>
                <p className="text-lg">{selectedRequest.phone}</p>
              </div>

              {selectedRequest.licenseNumber && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t("approvals.license")}</p>
                  <p className="text-lg">{selectedRequest.licenseNumber}</p>
                </div>
              )}

              {selectedRequest.shopType && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t("approvals.shopType")}</p>
                  <p className="text-lg">
                    {selectedRequest.shopType === "restaurant"
                      ? t("approvals.shop.restaurant")
                      : selectedRequest.shopType === "grocery"
                        ? t("approvals.shop.grocery")
                        : selectedRequest.shopType === "parapharmacy"
                          ? t("approvals.shop.parapharmacy")
                          : t("approvals.shop.gifts")}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedRequest && onReject(selectedRequest.id)}
              className="flex-1"
            >
              <UserX className="w-4 h-4 mr-2" />
              {t("approvals.reject")}
            </Button>
            <Button
              onClick={() => selectedRequest && onApprove(selectedRequest.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {t("approvals.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

