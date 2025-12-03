"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  MapPin,
  Package,
  Gift,
  Phone,
  ChevronDown,
  ChevronRight,
  Tag,
  CreditCard,
  Bike,
  Truck,
} from "lucide-react"

export default function PackageDeliveryPage() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState("fr")
  const [deliveryOption, setDeliveryOption] = useState("standard")
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [showPromoCode, setShowPromoCode] = useState(false)
  const [vehicleType, setVehicleType] = useState("motorcycle")
  const [showVehicleOptions, setShowVehicleOptions] = useState(false)
  const [whoPays, setWhoPays] = useState("sender")
  const [showWhoPaysOptions, setShowWhoPaysOptions] = useState(false)

  // Form state
  const [packageDescription, setPackageDescription] = useState("")
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [senderPhone, setSenderPhone] = useState("")
  const [promoCode, setPromoCode] = useState("")

  const t = (key: string, fr: string, ar: string) => {
    if (selectedLanguage === "ar") return ar
    return fr
  }

  const serviceFee = 500
  const total = serviceFee

  const vehicleOptions = [
    { id: "motorcycle", name: "Moto", nameAr: "دراجة نارية", icon: Bike },
    { id: "minitruck", name: "Mini Camion", nameAr: "شاحنة صغيرة", icon: Truck },
    { id: "fourgon", name: "Fourgon", nameAr: "فان", icon: Truck },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                {t("checkout", "Commande de Livraison", "طلب التوصيل")}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLanguage(selectedLanguage === "fr" ? "ar" : "fr")}
              className="text-xs"
            >
              {selectedLanguage === "fr" ? "العربية" : "Français"}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <Card className="bg-muted border-border">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Package className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "pricing-info",
                  "Vous serez facturé 50 DZD pour chaque 5 minutes d'attente supplémentaires à votre arrivée. Le prix du service est de 500 DZD.",
                  "سيتم فرض رسوم عليك بمبلغ 50 دج لكل 5 دقائق انتظار إضافية عند وصول السائق. سعر الخدمة هو 500 دج.",
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Order Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">{t("your-order", "Votre commande", "طلبك")}</h2>
          <p className="text-sm font-semibold text-muted-foreground mb-3">{t("courier", "Coursier", "السائق")}</p>

          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {t("what-transporting", "Que devez-vous transporter?", "ماذا تحتاج لنقله؟")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("purchases-not-allowed", "Les achats ne sont pas autorisés", "المشتريات غير مسموح بها")}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
              <Textarea
                placeholder={t(
                  "describe-package",
                  "Décrivez votre colis (ex: documents, vêtements, etc.)",
                  "صف طردك (مثل: مستندات، ملابس، إلخ)",
                )}
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                className="mt-3 min-h-[80px] bg-background"
              />
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t("delivery-details", "Détails de livraison", "تفاصيل التوصيل")}
          </h2>

          {/* Map Placeholder */}
          <div className="w-full h-32 bg-muted rounded-lg mb-4 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,50 L20,30 L40,60 L60,20 L80,70 L100,40" stroke="white" strokeWidth="2" fill="none" />
                  <path d="M0,60 L25,40 L50,80 L75,30 L100,50" stroke="white" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>

          {/* Location Inputs */}
          <div className="space-y-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <Input
                    placeholder={t("where-from", "D'où?", "من أين؟")}
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="border-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <Input
                    placeholder={t("where-to", "Où?", "إلى أين؟")}
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="border-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sending to Someone Else */}
          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer mt-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {t("sending-someone-else", "Envoi à quelqu'un d'autre?", "إرسال لشخص آخر؟")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "add-details-courier",
                      "Ajoutez leurs coordonnées pour aider le coursier",
                      "أضف تفاصيلهم لمساعدة السائق",
                    )}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
              <div className="mt-3 space-y-2">
                <Input
                  placeholder={t("recipient-name", "Nom du destinataire", "اسم المستلم")}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="bg-background"
                />
                <Input
                  placeholder={t("recipient-phone", "Téléphone du destinataire", "هاتف المستلم")}
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Phone Number */}
          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer mt-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {t("add-phone", "Ajoutez votre numéro de téléphone", "أضف رقم هاتفك")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "validate-message",
                      "Nous vous enverrons un message pour le valider",
                      "سنرسل لك رسالة للتحقق منه",
                    )}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
              <Input
                placeholder={t("phone-number", "Numéro de téléphone", "رقم الهاتف")}
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="mt-3 bg-background"
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">{t("who-pays", "Qui paie?", "من يدفع؟")}</h2>

          <Card className="border-border">
            <CardContent className="p-4">
              <button
                onClick={() => setShowWhoPaysOptions(!showWhoPaysOptions)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {whoPays === "sender"
                      ? t("sender-pays", "L'expéditeur paie", "المرسل يدفع")
                      : t("receiver-pays", "Le destinataire paie", "المستقبل يدفع")}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${showWhoPaysOptions ? "rotate-180" : ""}`}
                />
              </button>

              {showWhoPaysOptions && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setWhoPays("sender")
                      setShowWhoPaysOptions(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      whoPays === "sender" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">
                      {t("sender-pays", "L'expéditeur paie", "المرسل يدفع")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("sender-pays-desc", "Vous payez les frais de livraison", "أنت تدفع رسوم التوصيل")}
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setWhoPays("receiver")
                      setShowWhoPaysOptions(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      whoPays === "receiver" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">
                      {t("receiver-pays", "Le destinataire paie", "المستقبل يدفع")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("receiver-pays-desc", "Le destinataire paie à la livraison", "المستقبل يدفع عند الاستلام")}
                    </p>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t("vehicle-type", "Type de véhicule", "نوع المركبة")}
          </h2>

          <Card className="border-border">
            <CardContent className="p-4">
              <button
                onClick={() => setShowVehicleOptions(!showVehicleOptions)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {vehicleOptions.find((v) => v.id === vehicleType)?.[selectedLanguage === "ar" ? "nameAr" : "name"]}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${showVehicleOptions ? "rotate-180" : ""}`}
                />
              </button>

              {showVehicleOptions && (
                <div className="mt-4 space-y-2">
                  {vehicleOptions.map((vehicle) => {
                    const VehicleIcon = vehicle.icon
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => {
                          setVehicleType(vehicle.id)
                          setShowVehicleOptions(false)
                        }}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors flex items-center gap-3 ${
                          vehicleType === vehicle.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <VehicleIcon className="w-5 h-5" />
                        <p className="font-semibold text-foreground">
                          {vehicle[selectedLanguage === "ar" ? "nameAr" : "name"]}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delivery Options */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            {t("delivery-options", "Options de livraison", "خيارات التوصيل")}
            <button className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <span className="text-xs text-muted-foreground">i</span>
            </button>
          </h2>

          <Card className="border-border">
            <CardContent className="p-4">
              <button
                onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {deliveryOption === "standard"
                      ? t("standard", "Standard", "عادي")
                      : t("schedule", "Programmer", "جدولة")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryOption === "standard"
                      ? t("asap", "Dès que possible", "في أقرب وقت ممكن")
                      : t("select-time", "Sélectionner l'heure", "اختر الوقت")}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${showDeliveryOptions ? "rotate-180" : ""}`}
                />
              </button>

              {showDeliveryOptions && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setDeliveryOption("standard")
                      setShowDeliveryOptions(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      deliveryOption === "standard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{t("standard", "Standard", "عادي")}</p>
                    <p className="text-sm text-muted-foreground">{t("asap", "Dès que possible", "في أقرب وقت ممكن")}</p>
                  </button>

                  <button
                    onClick={() => {
                      setDeliveryOption("schedule")
                      setShowDeliveryOptions(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      deliveryOption === "schedule"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{t("schedule", "Programmer", "جدولة")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("select-time", "Sélectionner l'heure", "اختر الوقت")}
                    </p>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t("payment-method", "Mode de paiement", "طريقة الدفع")}
          </h2>

          <Card className="border-border">
            <CardContent className="p-4">
              <button
                onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {paymentMethod === "cash"
                      ? t("cash", "Espèces", "نقدي")
                      : t("google-pay", "Google Pay", "Google Pay")}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${showPaymentMethods ? "rotate-180" : ""}`}
                />
              </button>

              {showPaymentMethods && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setPaymentMethod("cash")
                      setShowPaymentMethods(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{t("cash", "Espèces", "نقدي")}</p>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod("google-pay")
                      setShowPaymentMethods(false)
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === "google-pay"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{t("google-pay", "Google Pay", "Google Pay")}</p>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Promo Code */}
        <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <button
              onClick={() => setShowPromoCode(!showPromoCode)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {t("promo-code", "Vous avez un code promo?", "هل لديك رمز ترويجي؟")}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {showPromoCode && (
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder={t("enter-code", "Entrez le code", "أدخل الرمز")}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="bg-background"
                />
                <Button variant="outline">{t("apply", "Appliquer", "تطبيق")}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">{t("summary", "Résumé", "الملخص")}</h2>

          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("services", "Services", "الخدمات")}</span>
                  <button className="w-4 h-4 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">i</span>
                  </button>
                </div>
                <span className="font-semibold text-foreground">{serviceFee} DZD</span>
              </div>

              <div className="flex justify-between text-xl font-bold pt-3 border-t border-border">
                <span className="text-foreground">TOTAL</span>
                <span className="text-foreground">{total} DZD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pay Button */}
        <Button
          size="lg"
          className="w-full bg-black hover:bg-black/90 text-white font-bold py-6 rounded-full text-lg"
          onClick={async () => {
            if (!fromLocation || !toLocation || !recipientPhone || !senderPhone) {
              alert(t("fill-all", "Veuillez remplir tous les champs", "يرجى ملء جميع الحقول"))
              return
            }

            try {
              const response = await fetch("/api/package-delivery/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerId: "customer-1",
                  fromLocation,
                  toLocation,
                  packageDescription,
                  recipientName,
                  recipientPhone,
                  senderPhone,
                  vehicleType,
                  paymentMethod,
                  whoPays,
                  deliveryOption,
                  total: serviceFee,
                }),
              })

              const data = await response.json()
              if (data.success) {
                alert(t("delivery-created", "Livraison créée avec succès!", "تم إنشاء التوصيل بنجاح!"))
                router.push("/")
              } else {
                alert(t("error", "Erreur lors de la création", "خطأ في الإنشاء"))
              }
            } catch (error) {
              console.error("[v0] Error creating delivery:", error)
              alert(t("error", "Erreur lors de la création", "خطأ في الإنشاء"))
            }
          }}
        >
          {paymentMethod === "google-pay" ? (
            <div className="flex items-center gap-2">
              <span>{t("pay-with", "Payer avec", "ادفع مع")}</span>
              <span className="text-white">G</span>
              <span className="text-white">Pay</span>
            </div>
          ) : (
            t("confirm-order", "Confirmer la commande", "تأكيد الطلب")
          )}
        </Button>
      </div>
    </div>
  )
}
