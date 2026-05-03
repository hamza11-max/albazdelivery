"use client"

import { Button, Card, CardContent, Badge, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@albaz/ui"
import { UserCheck, Truck, Store, UserX } from "lucide-react"
import type { RegistrationRequest } from "@/root/lib/types"
import { useEffect, useState } from "react"

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
        <h2 className="text-2xl font-bold">Demandes d'inscription en attente</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {requests.length} en attente
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Aucune demande en attente</p>
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
                          <Badge variant="outline">{request.role === "driver" ? "Livreur" : "Vendeur"}</Badge>
                      </div>
                        <p className="text-sm text-muted-foreground">{vendorProfiles[request.id]?.email || request.email}</p>
                        <p className="text-sm text-muted-foreground">{vendorProfiles[request.id]?.phone || request.phone}</p>
                        {vendorProfiles[request.id]?.address && (
                          <p className="text-xs text-muted-foreground">{vendorProfiles[request.id].address}</p>
                        )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Demandé le {new Date(request.createdAt).toLocaleDateString("fr-DZ")}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => onRequestClick(request)}>
                    Examiner
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
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>Examinez les informations et approuvez ou rejetez la demande</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Rôle</p>
                <p className="text-lg">{selectedRequest.role === "driver" ? "Livreur" : "Vendeur"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Nom</p>
                <p className="text-lg">{selectedRequest.name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Email</p>
                <p className="text-lg">{selectedRequest.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Téléphone</p>
                <p className="text-lg">{selectedRequest.phone}</p>
              </div>

              {selectedRequest.licenseNumber && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Permis de conduire</p>
                  <p className="text-lg">{selectedRequest.licenseNumber}</p>
                </div>
              )}

              {selectedRequest.shopType && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type de magasin</p>
                  <p className="text-lg">
                    {selectedRequest.shopType === "restaurant"
                      ? "Restaurant / Plats préparés"
                      : selectedRequest.shopType === "grocery"
                        ? "Épicerie"
                        : selectedRequest.shopType === "parapharmacy"
                          ? "Parapharmacie & Beauté"
                          : "Boutique de cadeaux"}
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
              Rejeter
            </Button>
            <Button
              onClick={() => selectedRequest && onApprove(selectedRequest.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

