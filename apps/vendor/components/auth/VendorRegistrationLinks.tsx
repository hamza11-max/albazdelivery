"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/root/components/ui/button"
import { getAdminApprovalsUrl } from "@/root/lib/config/admin-app-url"

export interface VendorRegistrationLinksProps {
  showSignupAction?: boolean
  variant?: "footer" | "pending" | "inline"
  className?: string
}

/** Signup entry + copy linking vendor registration to admin Approbations. */
export function VendorRegistrationLinks({
  showSignupAction = true,
  variant = "footer",
  className = "",
}: VendorRegistrationLinksProps) {
  const router = useRouter()
  const adminApprovalsUrl = getAdminApprovalsUrl()

  const goSignup = () => {
    router.push("/signup")
  }

  const openAdminApprovals = () => {
    if (!adminApprovalsUrl) return
    window.open(adminApprovalsUrl, "_blank", "noopener,noreferrer")
  }

  if (variant === "pending") {
    return (
      <div className={`space-y-3 text-sm text-gray-600 ${className}`}>
        <p>
          Votre demande est enregistrée dans l&apos;espace{" "}
          <strong>Approbations</strong> de l&apos;application administrateur Albaz. Un
          administrateur doit valider votre compte avant la première connexion.
        </p>
        {adminApprovalsUrl ? (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={openAdminApprovals}>
            Ouvrir l&apos;espace admin (équipe Albaz)
          </Button>
        ) : null}
        {showSignupAction ? (
          <p className="text-xs text-gray-500">
            <button type="button" className="text-teal-600 hover:underline" onClick={goSignup}>
              Créer un autre compte
            </button>
          </p>
        ) : null}
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-xs text-gray-500">
          L&apos;inscription crée une demande d&apos;approbation traitée dans l&apos;admin Albaz
          (onglet Approbations).
        </p>
        {showSignupAction ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
            onClick={goSignup}
          >
            Créer un compte vendeur
          </Button>
        ) : null}
        {adminApprovalsUrl ? (
          <button
            type="button"
            onClick={openAdminApprovals}
            className="w-full text-xs text-teal-600 hover:underline"
          >
            Espace administrateur (équipe Albaz)
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`mt-6 space-y-3 text-center text-sm text-gray-600 ${className}`}>
      <p>Vous n&apos;avez pas de compte ?</p>
      {showSignupAction ? (
        <Link
          href="/signup"
          className="inline-block font-medium text-teal-600 hover:text-teal-700"
        >
          Créer un compte vendeur
        </Link>
      ) : null}
      <p className="text-xs leading-relaxed text-gray-500">
        Après inscription, votre demande apparaît dans{" "}
        <strong>Admin → Approbations</strong> pour validation avant activation.
      </p>
      {adminApprovalsUrl ? (
        <button
          type="button"
          onClick={openAdminApprovals}
          className="text-xs text-teal-600 hover:underline"
        >
          Accès espace administrateur (équipe Albaz)
        </button>
      ) : null}
    </div>
  )
}
