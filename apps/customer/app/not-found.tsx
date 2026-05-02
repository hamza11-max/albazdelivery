"use client"

import Link from "next/link"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { Home } from "lucide-react"
import { useProfileI18n } from "../hooks/use-profile-i18n"

export default function NotFound() {
  const t = useProfileI18n()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-orange-500/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-primary mb-2">404</CardTitle>
          <CardTitle className="text-xl">
            {t("not-found-title", "Page non trouvée", "الصفحة غير موجودة", "Page not found")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t(
              "not-found-desc",
              "La page que vous recherchez n'existe pas ou a été déplacée.",
              "الصفحة التي تبحث عنها غير موجودة أو نُقلت.",
              "The page you are looking for does not exist or has been moved.",
            )}
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              {t("not-found-home", "Retour à l'accueil", "العودة للرئيسية", "Back to home")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
