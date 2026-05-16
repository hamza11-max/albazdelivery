"use client"

import { useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { AlertCircle, Truck, CheckCircle, X, Mail, Phone, Loader2 } from "lucide-react"
import { Switch } from "@/root/components/ui/switch"

interface DriversTabProps {
  loadingDrivers: boolean
  pendingDriverRequests: any[]
  connectedDrivers: any[]
  translate: (fr: string, ar: string) => string
  respondToDriverRequest: (connectionId: string, action: "accept" | "reject") => Promise<void>
  /** Professional+ — invitations are blocked server-side otherwise */
  driverFleetAllowed: boolean
  onInviteDriver: (params: {
    email?: string
    phone?: string
  }) => Promise<void>
  /** Toggle vendor dispatch pool (PATCH /api/vendors/drivers/:id/status) */
  onDriverDispatchChange?: (driverId: string, availableForDispatch: boolean) => Promise<void>
}

export function DriversTab({
  loadingDrivers,
  pendingDriverRequests,
  connectedDrivers,
  translate,
  respondToDriverRequest,
  driverFleetAllowed,
  onInviteDriver,
  onDriverDispatchChange,
}: DriversTabProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePhone, setInvitePhone] = useState("")
  const [inviting, setInviting] = useState(false)

  const handleInvite = async () => {
    const email = inviteEmail.trim()
    const phone = invitePhone.trim()
    if (!email && !phone) return
    setInviting(true)
    try {
      await onInviteDriver(email ? { email } : { phone })
      setInviteEmail("")
      setInvitePhone("")
    } finally {
      setInviting(false)
    }
  }

  const isVendorInvitedPending = (r: any) =>
    String(r?.connectionSource || "").toUpperCase() === "VENDOR_INVITED"

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {translate("Gestion des Chauffeurs", "إدارة السائقين")}
        </h2>
      </div>

      {!driverFleetAllowed ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 text-sm">
            <p className="text-amber-900 dark:text-amber-100 font-medium">
              {translate(
                "Les invitations chauffeur et les outils d’équipe ne sont disponibles qu’à partir du plan Professionnel.",
                "دعوة السائقين والمزايا المتقدمة متوفرة من باقة بروفيشنال فما فوق.",
              )}
            </p>
            <Button
              className="mt-3 bg-albaz-green-gradient text-white hover:opacity-90"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("switchTab", { detail: "settings" }))
              }}
            >
              {translate("Voir les abonnements", "عرض الاشتراك")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-teal-600" />
              {translate("Inviter un chauffeur", "دعوة سائق")}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              {translate(
                "Le chauffeur doit déjà avoir un compte Chauffeur approuvé. Indiquez son e-mail ou son téléphone (pas les deux).",
                "يجب أن يكون لدى السائق حسابًا معتمدًا. أدخل بريده أو هاتفه (ليس كلاهما).",
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">{translate("E-mail", "البريد")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="driver@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    if (e.target.value) setInvitePhone("")
                  }}
                  disabled={inviting || Boolean(invitePhone)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-phone">{translate("Téléphone", "الهاتف")}</Label>
                <Input
                  id="invite-phone"
                  type="tel"
                  placeholder="+213 ..."
                  value={invitePhone}
                  onChange={(e) => {
                    setInvitePhone(e.target.value)
                    if (e.target.value) setInviteEmail("")
                  }}
                  disabled={inviting || Boolean(inviteEmail)}
                />
              </div>
            </div>
            <Button
              className="bg-albaz-green-gradient text-white hover:opacity-90"
              disabled={inviting || (!inviteEmail.trim() && !invitePhone.trim())}
              onClick={() => void handleInvite()}
            >
              {inviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {translate("Envoi…", "جارٍ الإرسال…")}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {translate("Envoyer l’invitation", "إرسال الدعوة")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {loadingDrivers ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingDriverRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  {translate("Demandes en attente", "الطلبات المعلقة")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {pendingDriverRequests.map((request: any) => (
                    <Card key={request.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                              {request.driver?.name?.charAt(0) || "D"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.driver?.name || "N/A"}</h3>
                              <p className="text-sm text-muted-foreground">
                                {translate("Téléphone", "الهاتف")}: {request.driver?.phone || "N/A"}
                              </p>
                              {request.driver?.vehicleType && (
                                <p className="text-sm text-muted-foreground">
                                  {translate("Véhicule", "المركبة")}: {request.driver.vehicleType}
                                </p>
                              )}
                              {request.driver?.licenseNumber && (
                                <p className="text-sm text-muted-foreground">
                                  {translate("Permis", "الترخيص")}: {request.driver.licenseNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {isVendorInvitedPending(request) ? (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">
                                {translate("En attente du chauffeur", "بانتظار قبول السائق")}
                              </Badge>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  className="bg-albaz-green-gradient hover:opacity-90 text-white"
                                  onClick={() => respondToDriverRequest(request.connectionId, "accept")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {translate("Accepter", "قبول")}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => respondToDriverRequest(request.connectionId, "reject")}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  {translate("Refuser", "رفض")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connected Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-500" />
                {translate("Chauffeurs connectés", "السائقون المتصلون")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {connectedDrivers.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    {translate("Aucun chauffeur connecté", "لا يوجد سائقون متصلون")}
                  </p>
                  {pendingDriverRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {translate("Les demandes de connexion apparaîtront ici", "ستظهر طلبات الاتصال هنا")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedDrivers.map((connection: any) => (
                    <Card key={connection.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                            {connection.driver?.name?.charAt(0) || "D"}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{connection.driver?.name || "N/A"}</h3>
                            <p className="text-sm text-muted-foreground">
                              {translate("Téléphone", "الهاتف")}: {connection.driver?.phone || "N/A"}
                            </p>
                            {connection.driver?.vehicleType && (
                              <p className="text-sm text-muted-foreground">
                                {translate("Véhicule", "المركبة")}: {connection.driver.vehicleType}
                              </p>
                            )}
                            {connection.driver?.licenseNumber && (
                              <p className="text-sm text-muted-foreground">
                                {translate("Permis", "الترخيص")}: {connection.driver.licenseNumber}
                              </p>
                            )}
                            <Badge className="mt-2 bg-green-500">
                              {translate("Connecté", "متصل")}
                            </Badge>
                            {driverFleetAllowed && onDriverDispatchChange && connection.driver?.id && (
                              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                                <Label
                                  htmlFor={`dispatch-${connection.driver.id}`}
                                  className="text-xs font-normal cursor-pointer flex-1"
                                >
                                  {translate("Disponible pour les livraisons", "متاح للتوصيل")}
                                </Label>
                                <Switch
                                  id={`dispatch-${connection.driver.id}`}
                                  checked={connection.availableForDispatch !== false}
                                  onCheckedChange={(v) =>
                                    void onDriverDispatchChange(connection.driver.id, Boolean(v))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

