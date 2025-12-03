"use client"

import { Label } from "@/root/components/ui/label"

interface AdminVendorSelectorProps {
  isAdmin: boolean
  selectedVendorId: string | null
  setSelectedVendorId: (id: string | null) => void
  availableVendors: Array<{ id: string; name: string }>
  isLoadingVendors: boolean
  translate: (fr: string, ar: string) => string
}

export function AdminVendorSelector({
  isAdmin,
  selectedVendorId,
  setSelectedVendorId,
  availableVendors,
  isLoadingVendors,
  translate,
}: AdminVendorSelectorProps) {
  if (!isAdmin) return null

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold">
          {translate("Mode administrateur", "وضع المسؤول")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate(
            "Sélectionnez un vendeur pour consulter et gérer ses données.",
            "اختر تاجراً لعرض بياناته وإدارتها."
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {translate("Vendeur", "التاجر")}
        </Label>
        <select
          className="h-10 rounded-md border px-3 text-sm bg-background"
          value={selectedVendorId ?? ""}
          onChange={(event) => setSelectedVendorId(event.target.value || null)}
          disabled={isLoadingVendors || availableVendors.length === 0}
        >
          {availableVendors.length === 0 && (
            <option value="">
              {isLoadingVendors
                ? translate("Chargement...", "جار التحميل...")
                : translate("Aucun vendeur disponible", "لا يوجد تجار متاحون")}
            </option>
          )}
          {availableVendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

