"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserCheck, Truck, Store, UserX } from "lucide-react"
import type { RegistrationRequest } from "@/root/lib/types"

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
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      {request.role === "driver" ? (
                        <Truck className="w-7 h-7 text-primary" />
                      ) : (
                        <Store className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg">{request.name}</p>
                        <Badge variant="outline">{request.role === "driver" ? "Livreur" : "Vendeur"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-sm text-muted-foreground">{request.phone}</p>
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

