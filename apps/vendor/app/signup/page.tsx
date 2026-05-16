"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/root/components/ui/card"
import { VendorSignupForm } from "@/root/components/auth/VendorSignupForm"
import { withApiBaseUrl } from "@/lib/config/api-base-url"
import { BRAND_MARK_SRC } from "@/lib/brand-mark"
import { useToast } from "@/hooks/use-toast"
import { VendorRegistrationLinks } from "../../components/auth/VendorRegistrationLinks"

export const dynamic = "force-dynamic"

export default function VendorSignupPage() {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg border-border/80 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={BRAND_MARK_SRC} alt="ALBAZ Vendor" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">Créer un compte vendeur</CardTitle>
          <CardDescription>
            Votre demande est créée dans l&apos;administration Albaz (onglet{" "}
            <strong>Approbations</strong>) avant activation du compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorSignupForm
            loginHref="/login"
            registerPath={withApiBaseUrl("/api/auth/register")}
            onSuccess={() => {
              toast({
                title: "Demande envoyée",
                description:
                  "Votre demande d'inscription est en cours d'examen. Vous pourrez vous connecter une fois approuvée.",
              })
              router.push("/login")
            }}
            onError={(message) => {
              toast({
                title: "Erreur",
                description: message,
                variant: "destructive",
              })
            }}
          />
          <VendorRegistrationLinks
            variant="inline"
            showSignupAction={false}
            className="mt-6 border-t pt-4"
          />
        </CardContent>
      </Card>
    </div>
  )
}

