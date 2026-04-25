"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"

type GuestMenuProduct = {
  id: string
  name: string
  description?: string
  sellingPrice: number
  image?: string
  category?: string
}

type CartLine = { product: GuestMenuProduct; quantity: number }

function GuestMenuInner() {
  const searchParams = useSearchParams()
  const tableId = searchParams.get("tableId") || ""
  const [products, setProducts] = useState<GuestMenuProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!tableId) {
      setError("Lien invalide (table manquante).")
      setLoading(false)
      return
    }
    const silent = opts?.silent === true
    if (!silent) {
      setLoading(true)
      setError("")
    }
    try {
      const res = await fetch(`/api/guest/menu/products?tableId=${encodeURIComponent(tableId)}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (!silent) {
          setError(data?.error?.message || data?.message || "Impossible de charger le menu")
          setProducts([])
        }
        return
      }
      setError("")
      const next = Array.isArray(data?.data?.products) ? data.data.products : []
      setProducts(next)
      const allowed = new Set(next.map((p: GuestMenuProduct) => String(p.id)))
      setCart((prev) => prev.filter((line) => allowed.has(String(line.product.id))))
    } catch {
      setError("Erreur réseau")
      setProducts([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!tableId) return
    const id = window.setInterval(() => void load({ silent: true }), 6000)
    return () => window.clearInterval(id)
  }, [tableId, load])

  const addToCart = (p: GuestMenuProduct) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], quantity: next[i].quantity + 1 }
        return next
      }
      return [...prev, { product: p, quantity: 1 }]
    })
  }

  const total = useMemo(
    () => cart.reduce((s, l) => s + (Number(l.product.sellingPrice) || 0) * l.quantity, 0),
    [cart],
  )

  const submit = async () => {
    if (!tableId || cart.length === 0) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/guest/menu/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          note: note.trim() || undefined,
          items: cart.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            quantity: l.quantity,
            unitPrice: Number(l.product.sellingPrice) || 0,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error?.message || data?.message || "Commande refusée")
        return
      }
      setDone(true)
      setCart([])
    } catch {
      setError("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  if (!tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Lien QR invalide.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 gap-4">
        <h1 className="text-xl font-semibold text-emerald-900">Merci !</h1>
        <p className="text-center text-emerald-800 max-w-sm">
          Votre commande a été envoyée au restaurant. Un serveur la confirmera sous peu.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Menu</h1>
        <p className="text-xs text-slate-500">Commande invitée — paiement sur place selon l’établissement</p>
      </header>
      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-slate-500 text-sm">Chargement…</p>
        ) : products.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun article disponible pour le moment.</p>
        ) : (
          products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addToCart(p)}
              className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:scale-[0.99] transition"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className="shrink-0 text-teal-700 font-semibold">
                  {(Number(p.sellingPrice) || 0).toFixed(2)} DA
                </span>
              </div>
              {p.description ? (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              ) : null}
            </button>
          ))
        )}
      </div>
      {cart.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] space-y-3">
          <div className="max-h-32 overflow-y-auto text-sm space-y-1">
            {cart.map((l) => (
              <div key={l.product.id} className="flex justify-between gap-2">
                <span>
                  {l.quantity}× {l.product.name}
                </span>
                <span>{((Number(l.product.sellingPrice) || 0) * l.quantity).toFixed(2)} DA</span>
              </div>
            ))}
          </div>
          <Input
            placeholder="Note (allergies, etc.)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Total {total.toFixed(2)} DA</span>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Envoi…" : "Confirmer"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function GuestMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500">Chargement…</p>
        </div>
      }
    >
      <GuestMenuInner />
    </Suspense>
  )
}
