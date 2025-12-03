"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, Truck, Store, ArrowLeft } from "lucide-react"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

type UserRole = "customer" | "driver" | "vendor"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
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

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    if (selectedRole === "vendor" && !shopType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de magasin",
        variant: "destructive",
      })
      return
    }

    // Normalize payload for API
    const normalizePhone = (p: string) => {
      const digits = p.replace(/\D/g, "")
      if (digits.startsWith("213")) {
        const rest = digits.slice(3)
        return rest.startsWith("0") ? rest : `0${rest}`
      }
      return digits.startsWith("0") ? digits : p
    }

    // Submit registration request
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
          title: "Demande envoyée",
          description:
            "Votre demande d'inscription est en cours d'examen. Vous recevrez une notification une fois approuvée.",
        })
        router.push("/login")
      } else {
        const message = typeof data.error === "string" ? data.error : data.error?.message || "Une erreur s'est produite"
        toast({ title: "Erreur", description: message, variant: "destructive" })
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la demande",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="ALBAZ FAST DELIVERY" className="h-32 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "role" ? "Choisissez votre rôle" : "Créer un compte"}
          </CardTitle>
          <CardDescription>
            {step === "role"
              ? "Sélectionnez le type de compte que vous souhaitez créer"
              : `Inscription en tant que ${selectedRole === "customer" ? "Client" : selectedRole === "driver" ? "Livreur" : "Vendeur"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "role" ? (
            // Role selection
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleRoleSelect("customer")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Client</h3>
                  <p className="text-sm text-muted-foreground text-center">Commander des produits et services</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("driver")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Livreur</h3>
                  <p className="text-sm text-muted-foreground text-center">Livrer des commandes aux clients</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("vendor")}
                className="p-6 border-2 border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Vendeur</h3>
                  <p className="text-sm text-muted-foreground text-center">Vendre vos produits en ligne</p>
                </div>
              </button>
            </div>
          ) : (
            // Registration form
            <form onSubmit={handleSubmit} className="space-y-4">
              <Button type="button" variant="ghost" onClick={() => setStep("role")} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {selectedRole === "vendor" ? "Nom complet / Nom de l'entreprise" : "Nom complet"}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+213 555 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {selectedRole === "driver" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="license">Numéro de permis de conduire</Label>
                    <Input
                      id="license"
                      type="text"
                      placeholder="ABC123456"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Type de véhicule</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">Moto / Scooter</SelectItem>
                        <SelectItem value="car">Voiture</SelectItem>
                        <SelectItem value="van">Camionnette</SelectItem>
                        <SelectItem value="bicycle">Vélo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo du véhicule (URL)</Label>
                    <Input
                      id="photo"
                      type="url"
                      placeholder="https://exemple.com/photo-vehicule.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Fournissez une URL de votre véhicule (optionnel)</p>
                  </div>
                </>
              )}

              {selectedRole === "vendor" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shopType">Type de magasin</Label>
                    <Select value={shopType} onValueChange={setShopType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">Restaurant / Plats préparés</SelectItem>
                        <SelectItem value="Épicerie">Épicerie</SelectItem>
                        <SelectItem value="Parapharmacie">Parapharmacie & Beauté</SelectItem>
                        <SelectItem value="Cadeaux">Boutique de cadeaux</SelectItem>
                        <SelectItem value="Boulangerie">Boulangerie / Pâtisserie</SelectItem>
                        <SelectItem value="Café">Café / Salon de thé</SelectItem>
                        <SelectItem value="Fast-food">Fast-food</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Logo du magasin (URL)</Label>
                    <Input
                      id="photo"
                      type="url"
                      placeholder="https://exemple.com/logo-magasin.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Fournissez une URL du logo de votre magasin (optionnel)</p>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-orange-500 text-white">
                {selectedRole === "customer" ? "Créer un compte" : "Soumettre pour approbation"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-primary hover:underline"
            >
              Vous avez déjà un compte? Se connecter
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
