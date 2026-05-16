"use client"

import { WebAuthnPasskeysCard } from "./WebAuthnPasskeysCard"
import { VendorDomainsCard } from "./VendorDomainsCard"

export interface VendorSecuritySettingsPanelProps {
  translate: (fr: string, ar: string) => string
  isElectronRuntime?: boolean
  managedVendorId?: string | null
}

/** Passkeys + vendor portal domains (canonical place for subdomain / custom domain). */
export function VendorSecuritySettingsPanel({
  translate,
  isElectronRuntime = false,
  managedVendorId,
}: VendorSecuritySettingsPanelProps) {
  return (
    <div className="mt-4 space-y-6 outline-none">
      <p className="max-w-2xl text-sm text-muted-foreground">
        {translate(
          "Gérez les passkeys et l'adresse web publique de votre vitrine (sous-domaine ou domaine personnalisé).",
          "أدِر مفاتيح التحقق وعنوان واجهتك العامة (نطاق فرعي أو نطاق مخصّص)."
        )}
      </p>
      <WebAuthnPasskeysCard translate={translate} />
      <VendorDomainsCard
        translate={translate}
        managedVendorId={managedVendorId ?? undefined}
      />
      {isElectronRuntime ? null : (
        <p className="text-xs text-muted-foreground">
          {translate(
            "Les domaines par magasin se configurent dans l'onglet « Vitrine en ligne ».",
            "تُضبط نطاقات كل متجر من تبويب «واجهة الويب العامة»."
          )}
        </p>
      )}
    </div>
  )
}
