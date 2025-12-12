"use client"

import { useEffect, useMemo, useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MapPin, RefreshCw, ShieldCheck, Clock3, Phone, TicketPercent } from "lucide-react"
import { formatPrice } from "@albaz/shared/utils"
import type { DeliveryZone } from "@/lib/types"

interface CheckoutOrder {
  id: string
  items: {
    id: number
    name: string
    price: number
    quantity: number
  }[]
  subtotal: number
  deliveryFee: number
  total: number
}

interface CheckoutPageProps {
  order: CheckoutOrder
}

type PaymentStatus = "idle" | "processing" | "succeeded" | "requires_action" | "error"
type ZoneStatus = "idle" | "checking" | "valid" | "invalid"

const phoneRegex = /^0[567]\d{8}$/
const currency = "USD"
const promoRules: Record<
  string,
  { type: "percent" | "flat" | "shipping"; value: number; maxDiscountCents?: number }
> = {
  WELCOME10: { type: "percent", value: 10, maxDiscountCents: 2000 },
  FREESHIP: { type: "shipping", value: 1 },
  VIP200: { type: "flat", value: 2 },
}

const toMinorUnits = (value: number) => Math.max(0, Math.round(value * 100))

export function CheckoutPage({ order }: CheckoutPageProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()

  const [cardComplete, setCardComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")

  const [zone, setZone] = useState<DeliveryZone | null>(null)
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>("idle")
  const [zoneMessage, setZoneMessage] = useState<string | null>(null)

  const [promoInput, setPromoInput] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscountCents, setPromoDiscountCents] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)

  const [formErrors, setFormErrors] = useState<string[]>([])
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)

  const baseSubtotalCents = useMemo(() => toMinorUnits(order.subtotal), [order.subtotal])
  const fallbackDeliveryFeeCents = useMemo(() => toMinorUnits(order.deliveryFee), [order.deliveryFee])
  const deliveryFeeCents = useMemo(
    () => (zone ? toMinorUnits(zone.deliveryFee) : fallbackDeliveryFeeCents),
    [zone, fallbackDeliveryFeeCents]
  )
  const totalBeforeDiscount = baseSubtotalCents + deliveryFeeCents
  const totalCents = Math.max(totalBeforeDiscount - promoDiscountCents, 0)

  useEffect(() => {
    if (zone) {
      setEtaMinutes(zone.estimatedTime || null)
    }
  }, [zone])

  const validateForm = () => {
    const errors: string[] = []
    if (!fullName.trim()) errors.push("Veuillez renseigner votre nom complet.")
    if (!phoneRegex.test(phone)) errors.push("Numéro de téléphone invalide (format 0XXXXXXXXX).")
    if (address.trim().length < 8) errors.push("Adresse de livraison trop courte.")
    if (!city.trim()) errors.push("La ville est requise.")
    if (zoneStatus !== "valid") errors.push("Adresse en dehors de la zone couverte ou non vérifiée.")

    setFormErrors(errors)
    return errors.length === 0
  }

  const handleCheckZone = async () => {
    if (!city.trim()) {
      setZoneStatus("invalid")
      setZoneMessage("Veuillez saisir une ville pour vérifier la zone de livraison.")
      return
    }

    setZoneStatus("checking")
    setZoneMessage(null)
    try {
      const response = await fetch(`/api/delivery/zones?city=${encodeURIComponent(city.trim())}`)
      const payload = await response.json()
      const zones: DeliveryZone[] = payload?.data?.zones || payload?.zones || []

      const activeZone =
        zones.find((z) => (z as any).isActive !== false) ||
        zones.find((z) => Boolean(z))

      if (!activeZone) {
        setZoneStatus("invalid")
        setZone(null)
        setZoneMessage("Désolé, cette zone n'est pas encore desservie.")
        return
      }

      setZone(activeZone)
      setZoneStatus("valid")
      setZoneMessage(
        `Zone couverte: ${activeZone.name}. ${activeZone.activeDrivers ?? 0} livreurs actifs.`
      )
    } catch (error) {
      console.error("Zone check failed", error)
      setZoneStatus("invalid")
      setZoneMessage("Impossible de vérifier la zone pour le moment.")
    }
  }

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    setPromoError(null)
    setPromoDiscountCents(0)
    setPromoCode("")

    if (!code) return

    const rule = promoRules[code]
    if (!rule) {
      setPromoError("Code promo invalide ou expiré.")
      return
    }

    let discount = 0
    if (rule.type === "percent") {
      discount = Math.round((totalBeforeDiscount * rule.value) / 100)
      if (rule.maxDiscountCents) {
        discount = Math.min(discount, rule.maxDiscountCents)
      }
    } else if (rule.type === "flat") {
      discount = toMinorUnits(rule.value)
    } else if (rule.type === "shipping") {
      discount = deliveryFeeCents
    }

    if (discount <= 0) {
      setPromoError("Aucune réduction applicable.")
      return
    }

    setPromoDiscountCents(discount)
    setPromoCode(code)
    toast({
      title: "Code appliqué",
      description: `La remise ${code} est active.`,
    })
  }

  const handleClearPromo = () => {
    setPromoCode("")
    setPromoDiscountCents(0)
    setPromoInput("")
    setPromoError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPaymentError(null)
    setFormErrors([])

    if (!stripe || !elements) return

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setPaymentStatus("processing")

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: totalCents,
          currency,
          customerEmail: undefined,
          deliveryCity: city,
          deliveryAddress: address,
        }),
      })

      const payload = await response.json()
      const clientSecret = payload?.data?.clientSecret || payload?.clientSecret

      if (!clientSecret) {
        throw new Error(payload?.error?.message || "Initialisation du paiement impossible.")
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: fullName,
              phone,
              address: { line1: address, city },
            },
          },
        }
      )

      if (stripeError) {
        setPaymentStatus("error")
        setPaymentError(stripeError.message || "Le paiement a été refusé.")
        throw new Error(stripeError.message)
      }

      if (paymentIntent?.status === "requires_action") {
        setPaymentStatus("requires_action")
        setPaymentError("Action supplémentaire requise, vérifiez le challenge 3DS.")
        return
      }

      if (paymentIntent?.status === "succeeded") {
        setPaymentStatus("succeeded")
        toast({
          title: "Paiement réussi",
          description: "Votre commande est confirmée. Nous préparons votre livraison.",
        })
      } else {
        setPaymentStatus("error")
        setPaymentError("Statut de paiement inattendu, veuillez réessayer.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Erreur de paiement",
        description: error instanceof Error ? error.message : "Le paiement a échoué. Merci de réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isPayDisabled =
    !stripe ||
    !cardComplete ||
    isLoading ||
    zoneStatus === "invalid" ||
    paymentStatus === "succeeded"

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Paiement de commande</CardTitle>
        <CardDescription>
          Vérifiez la zone de livraison, appliquez un code promo, puis validez votre paiement 3D Secure.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} id="payment-form" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Infos livraison</CardTitle>
                <CardDescription>Adresse et contact pour le livreur.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nom Prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0XXXXXXXXX"
                      inputMode="tel"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rue, bâtiment, étage..."
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <div className="flex gap-2">
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Alger..."
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckZone}
                      disabled={zoneStatus === "checking"}
                    >
                      {zoneStatus === "checking" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Vérifier
                        </>
                      )}
                    </Button>
                  </div>
                  {zoneMessage && (
                    <p className={`text-sm ${zoneStatus === "valid" ? "text-green-600" : "text-destructive"}`}>
                      {zoneMessage}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Instructions (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Digicode, point de repère..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Paiement sécurisé</CardTitle>
                <CardDescription>3D Secure activé automatiquement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-3">
                  <Label className="text-sm mb-2 block">Détails de la carte</Label>
                  <CardElement
                    id="card-element"
                    className="p-3 border rounded-md"
                    onChange={(e) => {
                      setCardComplete(e.complete)
                      if (e.error) setPaymentError(e.error.message || null)
                    }}
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          fontSmoothing: "antialiased",
                          color: "#111827",
                          "::placeholder": { color: "#9ca3af" },
                        },
                        invalid: { color: "#ef4444" },
                      },
                    }}
                    data-testid="card-number-input"
                  />
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    3DS/SCA prêt : une étape d'authentification peut être demandée par votre banque.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(baseSubtotalCents, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de livraison</span>
                    <span>{formatPrice(deliveryFeeCents, currency)}</span>
                  </div>
                  {promoDiscountCents > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Remise {promoCode}</span>
                      <span>-{formatPrice(promoDiscountCents, currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(totalCents, currency)}</span>
                  </div>
                  {etaMinutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      ETA estimée : {etaMinutes} min
                    </div>
                  )}
                  {zone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {zone.activeDrivers ?? 0} livreurs actifs
                      </Badge>
                      <Badge variant="outline">{zone.name}</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <TicketPercent className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm">Code promo</Label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="WELCOME10, FREESHIP..."
                    />
                    <Button type="button" variant="outline" onClick={handleApplyPromo}>
                      Appliquer
                    </Button>
                    {promoCode && (
                      <Button type="button" variant="ghost" onClick={handleClearPromo}>
                        Retirer
                      </Button>
                    )}
                  </div>
                  {promoError && <p className="text-sm text-destructive">{promoError}</p>}
                  {promoCode && !promoError && (
                    <p className="text-sm text-green-700">Code {promoCode} appliqué.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {formErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Veuillez corriger les champs suivants</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {formErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {paymentError && (
            <Alert variant="destructive">
              <AlertTitle>Le paiement a été refusé</AlertTitle>
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          type="submit"
          form="payment-form"
          className="w-full"
          disabled={isPayDisabled}
          data-testid="pay-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            `Payer ${formatPrice(totalCents, currency)}`
          )}
        </Button>
        {paymentStatus === "requires_action" && (
          <p className="text-sm text-muted-foreground text-center">
            Veuillez finaliser la vérification 3DS dans la fenêtre bancaire, puis réessayez si nécessaire.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}