"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { ArrowLeft, MapPin, Plus, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAddressesQuery, useCreateAddress, useUpdateAddress, useDeleteAddress } from "../../../hooks/use-addresses-query"
import { useErrorHandler } from "../../../hooks/use-error-handler"

export const dynamic = "force-dynamic"

export default function AddressesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { handleError } = useErrorHandler()
  const { data: addresses = [], isLoading } = useAddressesQuery()
  const createAddr = useCreateAddress()
  const updateAddr = useUpdateAddress()
  const deleteAddr = useDeleteAddress()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLabel, setFormLabel] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formDefault, setFormDefault] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const resetForm = () => {
    setEditingId(null)
    setShowForm(false)
    setFormLabel("")
    setFormAddress("")
    setFormCity("")
    setFormDefault(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formLabel.trim() || !formAddress.trim() || formAddress.length < 10 || !formCity.trim()) {
      handleError(new Error("Veuillez remplir tous les champs (adresse min 10 caractères)"), { showToast: true })
      return
    }
    try {
      if (editingId) {
        await updateAddr.mutateAsync({
          id: editingId,
          data: { label: formLabel.trim(), address: formAddress.trim(), city: formCity.trim(), isDefault: formDefault },
        })
      } else {
        await createAddr.mutateAsync({
          label: formLabel.trim(),
          address: formAddress.trim(),
          city: formCity.trim(),
          isDefault: formDefault,
        })
      }
      resetForm()
    } catch (err) {
      handleError(err as Error, { showToast: true })
    }
  }

  const handleEdit = (addr: { id: string; label: string; address: string; city: string; isDefault: boolean }) => {
    setEditingId(addr.id)
    setFormLabel(addr.label)
    setFormAddress(addr.address)
    setFormCity(addr.city)
    setFormDefault(addr.isDefault)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette adresse ?")) return
    try {
      await deleteAddr.mutateAsync(id)
      if (editingId === id) resetForm()
    } catch (err) {
      handleError(err as Error, { showToast: true })
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4d1a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Mes adresses</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0">
                <MapPin className="w-5 h-5 text-[#1a4d1a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{addr.label}</p>
                  <p className="text-sm text-muted-foreground">{addr.address}, {addr.city}</p>
                  {addr.isDefault && (
                    <span className="text-xs text-[#1a4d1a] font-medium">Par défaut</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)}>
                  Modifier
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Modifier l'adresse" : "Nouvelle adresse"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nom (ex: Maison, Travail)</Label>
                  <Input
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Maison"
                    required
                  />
                </div>
                <div>
                  <Label>Adresse complète</Label>
                  <Input
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Rue, numéro, quartier..."
                    required
                    minLength={10}
                  />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Alger"
                    required
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formDefault}
                    onChange={(e) => setFormDefault(e.target.checked)}
                  />
                  <span>Définir comme adresse par défaut</span>
                </label>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createAddr.isPending || updateAddr.isPending}>
                    {(createAddr.isPending || updateAddr.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingId ? "Enregistrer" : "Ajouter"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!showForm && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une adresse
          </Button>
        )}
      </div>
    </div>
  )
}
