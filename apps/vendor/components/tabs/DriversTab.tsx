"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { AlertCircle, Truck, CheckCircle, X } from "lucide-react"

interface DriversTabProps {
  loadingDrivers: boolean
  pendingDriverRequests: any[]
  connectedDrivers: any[]
  translate: (fr: string, ar: string) => string
  respondToDriverRequest: (connectionId: string, action: "accept" | "reject") => Promise<void>
}

export function DriversTab({
  loadingDrivers,
  pendingDriverRequests,
  connectedDrivers,
  translate,
  respondToDriverRequest,
}: DriversTabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {translate("Gestion des Chauffeurs", "إدارة السائقين")}
        </h2>
      </div>

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

