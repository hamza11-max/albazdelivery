"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from "@albaz/ui"
import { Users, Truck, Store, ArrowLeft } from "lucide-react"
import { useProfileI18n } from "../../hooks/use-profile-i18n"

// Force dynamic rendering to avoid static generation issues
export const dynamic = "force-dynamic"

type UserRole = "customer" | "driver" | "vendor"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useProfileI18n()
  const [step, setStep] = useState<"role" | "form">("role")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [shopType, setShopType] = useState("")

  const roleLabel =
    selectedRole === "customer"
      ? t("signup-role-customer", "Client", "عميل", "Customer")
      : selectedRole === "driver"
        ? t("signup-role-driver", "Livreur", "سائق توصيل", "Driver")
        : t("signup-role-vendor", "Vendeur", "بائع", "Vendor")

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: t("signup-toast-error-title", "Erreur", "خطأ", "Error"),
        description: t(
          "signup-password-mismatch",
          "Les mots de passe ne correspondent pas",
          "كلمتا المرور غير متطابقتين",
          "Passwords do not match",
        ),
        variant: "destructive",
      })
      return
    }

    if (selectedRole === "vendor" && !shopType) {
      toast({
        title: t("signup-toast-error-title", "Erreur", "خطأ", "Error"),
        description: t(
          "signup-shop-type-required",
          "Veuillez sélectionner un type de magasin",
          "يُرجى اختيار نوع المتجر",
          "Please select a store type",
        ),
        variant: "destructive",
      })
      return
    }

    const normalizePhone = (p: string) => {
      const digits = p.replace(/\D/g, "")
      if (digits.startsWith("213")) {
        const rest = digits.slice(3)
        return rest.startsWith("0") ? rest : `0${rest}`
      }
      return digits.startsWith("0") ? digits : p
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole ? selectedRole.toUpperCase() : undefined,
          name,
          phone: normalizePhone(phone),
          email,
          password,
          licenseNumber: selectedRole === "driver" ? licenseNumber : undefined,
          vehicleType: selectedRole === "driver" ? vehicleType : undefined,
          photoUrl: photoUrl || undefined,
          shopType: selectedRole === "vendor" ? shopType : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("signup-toast-sent-title", "Demande envoyée", "تم إرسال الطلب", "Request sent"),
          description: t(
            "signup-toast-sent-desc",
            "Votre demande d'inscription est en cours d'examen. Vous recevrez une notification une fois approuvée.",
            "طلب التسجيل قيد المراجعة. سيتم إشعارك عند الموافقة.",
            "Your registration is under review. You will be notified once it is approved.",
          ),
        })
        router.push("/login")
      } else {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
              t(
                "signup-generic-error",
                "Une erreur s'est produite",
                "حدث خطأ",
                "Something went wrong",
              )
        toast({
          title: t("signup-toast-error-title", "Erreur", "خطأ", "Error"),
          description: message,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("signup-toast-error-title", "Erreur", "خطأ", "Error"),
        description: t(
          "signup-submit-failed",
          "Impossible de soumettre la demande",
          "تعذّر إرسال الطلب",
          "Could not submit the request",
        ),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt={t("signup-logo-alt", "ALBAZ FAST DELIVERY", "اللباز توصيل سريع", "ALBAZ FAST DELIVERY")}
              className="h-32 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "role"
              ? t("signup-title-role", "Choisissez votre rôle", "اختر دورك", "Choose your role")
              : t("signup-title-form", "Créer un compte", "إنشاء حساب", "Create an account")}
          </CardTitle>
          <CardDescription>
            {step === "role"
              ? t(
                  "signup-desc-role",
                  "Sélectionnez le type de compte que vous souhaitez créer",
                  "اختر نوع الحساب الذي تريد إنشاءه",
                  "Select the account type you want to create",
                )
              : `${t("signup-registering-as", "Inscription en tant que", "التسجيل كـ", "Registering as")} ${roleLabel}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "role" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect("customer")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {t("signup-role-customer", "Client", "عميل", "Customer")}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t(
                      "signup-role-customer-desc",
                      "Commander des produits et services",
                      "طلب المنتجات والخدمات",
                      "Order products and services",
                    )}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("driver")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {t("signup-role-driver", "Livreur", "سائق توصيل", "Driver")}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t(
                      "signup-role-driver-desc",
                      "Livrer des commandes aux clients",
                      "توصيل الطلبات للعملاء",
                      "Deliver orders to customers",
                    )}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("vendor")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {t("signup-role-vendor", "Vendeur", "بائع", "Vendor")}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t(
                      "signup-role-vendor-desc",
                      "Vendre vos produits en ligne",
                      "بيع منتجاتك عبر الإنترنت",
                      "Sell your products online",
                    )}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Button type="button" variant="ghost" onClick={() => setStep("role")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("signup-back", "Retour", "رجوع", "Back")}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {selectedRole === "vendor"
                    ? t(
                        "signup-label-name-vendor",
                        "Nom complet / Nom de l'entreprise",
                        "الاسم الكامل / اسم الشركة",
                        "Full name / Business name",
                      )
                    : t("signup-label-name", "Nom complet", "الاسم الكامل", "Full name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("signup-ph-name", "Votre nom", "اسمك", "Your name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t("signup-label-phone", "Numéro de téléphone", "رقم الهاتف", "Phone number")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t(
                    "signup-ph-phone",
                    "+213 555 123 456",
                    "+213 555 123 456",
                    "+213 555 123 456",
                  )}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("signup-label-email", "Adresse email", "البريد الإلكتروني", "Email address")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t(
                    "signup-ph-email",
                    "votre@email.com",
                    "بريدك@example.com",
                    "you@example.com",
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("signup-label-password", "Mot de passe", "كلمة المرور", "Password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("signup-ph-password", "••••••••", "••••••••", "••••••••")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("signup-label-confirm-password", "Confirmer le mot de passe", "تأكيد كلمة المرور", "Confirm password")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("signup-ph-password", "••••••••", "••••••••", "••••••••")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {selectedRole === "driver" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="license">
                      {t("signup-label-license", "Numéro de permis de conduire", "رقم رخصة القيادة", "Driver license number")}
                    </Label>
                    <Input
                      id="license"
                      type="text"
                      placeholder={t("signup-ph-license", "ABC123456", "ABC123456", "ABC123456")}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">
                      {t("signup-label-vehicle", "Type de véhicule", "نوع المركبة", "Vehicle type")}
                    </Label>
                    <Select value={vehicleType} onValueChange={setVehicleType} required>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "signup-select-vehicle-placeholder",
                            "Sélectionnez un type",
                            "اختر النوع",
                            "Select a type",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">
                          {t("signup-vehicle-motorcycle", "Moto / Scooter", "دراجة نارية / سكوتر", "Motorcycle / Scooter")}
                        </SelectItem>
                        <SelectItem value="car">
                          {t("signup-vehicle-car", "Voiture", "سيارة", "Car")}
                        </SelectItem>
                        <SelectItem value="van">
                          {t("signup-vehicle-van", "Camionnette", "شاحنة صغيرة", "Van")}
                        </SelectItem>
                        <SelectItem value="bicycle">
                          {t("signup-vehicle-bicycle", "Vélo", "دراجة", "Bicycle")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">
                      {t("signup-label-photo-vehicle", "Photo du véhicule (URL)", "صورة المركبة (رابط)", "Vehicle photo (URL)")}
                    </Label>
                    <Input
                      id="photo"
                      type="url"
                      placeholder={t(
                        "signup-ph-photo-url",
                        "https://exemple.com/photo-vehicule.jpg",
                        "https://example.com/vehicle.jpg",
                        "https://example.com/vehicle.jpg",
                      )}
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "signup-hint-photo-vehicle",
                        "Fournissez une URL de votre véhicule (optionnel)",
                        "أدخل رابط صورة مركبتك (اختياري)",
                        "Provide a URL of your vehicle (optional)",
                      )}
                    </p>
                  </div>
                </>
              )}

              {selectedRole === "vendor" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shopType">
                      {t("signup-label-shop-type", "Type de magasin", "نوع المتجر", "Store type")}
                    </Label>
                    <Select value={shopType} onValueChange={setShopType} required>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "signup-select-shop-placeholder",
                            "Sélectionnez un type",
                            "اختر النوع",
                            "Select a type",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">
                          {t("signup-shop-restaurant", "Restaurant / Plats préparés", "مطعم / وجبات جاهزة", "Restaurant / Prepared food")}
                        </SelectItem>
                        <SelectItem value="Épicerie">
                          {t("signup-shop-grocery", "Épicerie", "بقالة", "Grocery")}
                        </SelectItem>
                        <SelectItem value="Parapharmacie">
                          {t("signup-shop-parapharmacy", "Parapharmacie & Beauté", "مستحضرات تجميل وعناية", "Parapharmacy & beauty")}
                        </SelectItem>
                        <SelectItem value="Cadeaux">
                          {t("signup-shop-gifts", "Boutique de cadeaux", "هدايا", "Gift shop")}
                        </SelectItem>
                        <SelectItem value="Boulangerie">
                          {t("signup-shop-bakery", "Boulangerie / Pâtisserie", "مخبزة / حلويات", "Bakery / Pastry")}
                        </SelectItem>
                        <SelectItem value="Café">
                          {t("signup-shop-cafe", "Café / Salon de thé", "مقهى / صالون شاي", "Café / Tea room")}
                        </SelectItem>
                        <SelectItem value="Fast-food">
                          {t("signup-shop-fastfood", "Fast-food", "وجبات سريعة", "Fast food")}
                        </SelectItem>
                        <SelectItem value="Autre">
                          {t("signup-shop-other", "Autre", "أخرى", "Other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo-vendor">
                      {t("signup-label-logo", "Logo du magasin (URL)", "شعار المتجر (رابط)", "Store logo (URL)")}
                    </Label>
                    <Input
                      id="photo-vendor"
                      type="url"
                      placeholder={t(
                        "signup-ph-logo-url",
                        "https://exemple.com/logo-magasin.jpg",
                        "https://example.com/logo.jpg",
                        "https://example.com/logo.jpg",
                      )}
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "signup-hint-logo",
                        "Fournissez une URL du logo de votre magasin (optionnel)",
                        "أدخل رابط شعار متجرك (اختياري)",
                        "Provide a URL for your store logo (optional)",
                      )}
                    </p>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-orange-500 text-white">
                {selectedRole === "customer"
                  ? t("signup-submit-customer", "Créer un compte", "إنشاء حساب", "Create account")
                  : t(
                      "signup-submit-approval",
                      "Soumettre pour approbation",
                      "إرسال للمراجعة",
                      "Submit for approval",
                    )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-primary hover:underline"
            >
              {t(
                "signup-has-account",
                "Vous avez déjà un compte? Se connecter",
                "لديك حساب بالفعل؟ تسجيل الدخول",
                "Already have an account? Sign in",
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
