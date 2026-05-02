"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@albaz/ui"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ordersAPI, reviewsAPI } from "../../../lib/api-client"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { useToast } from "../../../hooks/use-toast"
import { useProfileI18n } from "../../../hooks/use-profile-i18n"

export const dynamic = "force-dynamic"

type OrderLite = { id: string; vendorId?: string | null; vendor?: { id?: string; name?: string }; total?: number; createdAt?: string }

export default function ReviewsPage() {
  const router = useRouter()
  const { status } = useSession()
  const { handleError } = useErrorHandler()
  const { toast } = useToast()
  const t = useProfileI18n()
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")
  const [rating, setRating] = useState("5")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    setLoading(true)
    ordersAPI
      .list({ status: "DELIVERED" })
      .then((r: { success?: boolean; data?: { orders?: OrderLite[] } }) => {
        if (r.success && Array.isArray(r.data?.orders)) setOrders(r.data!.orders!)
        else setOrders([])
      })
      .catch((e) => {
        handleError(e as Error, { showToast: true })
        setOrders([])
      })
      .finally(() => setLoading(false))
  }, [status, handleError])

  const selected = orders.find((o) => o.id === selectedId)
  const vendorId = selected?.vendorId ?? selected?.vendor?.id ?? ""

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !vendorId) {
      handleError(
        new Error(t("rev-pick", "Choisissez une commande livrée.", "اختر طلباً تم توصيله.", "Choose a delivered order.")),
        {
          showToast: true,
        },
      )
      return
    }
    const r = parseInt(rating, 10)
    if (Number.isNaN(r) || r < 1 || r > 5) {
      handleError(new Error(t("rev-rate", "Note entre 1 et 5.", "التقييم من 1 إلى 5.", "Rating must be 1–5.")), {
        showToast: true,
      })
      return
    }
    if (comment.trim().length < 10) {
      handleError(
        new Error(t("rev-comment", "Commentaire ≥ 10 caractères.", "التعليق 10 أحرف على الأقل.", "Comment must be at least 10 characters.")),
        {
          showToast: true,
        },
      )
      return
    }
    setSubmitting(true)
    try {
      await reviewsAPI.create({
        orderId: selectedId,
        vendorId,
        rating: r,
        comment: comment.trim(),
      })
      setComment("")
      setSelectedId("")
      toast({
        title: t("rev-thanks-title", "Merci !", "شكراً!", "Thanks!"),
        description: t("rev-thanks-desc", "Avis enregistré.", "تم حفظ التقييم.", "Review saved."),
      })
    } catch (err) {
      handleError(err as Error, { showToast: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
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
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{t("rev-h1", "Avis", "التقييمات", "Reviews")}</h1>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          {t(
            "rev-intro",
            "Une seule évaluation par commande livrée. Si une erreur apparaît, la commande a peut‑être déjà été notée.",
            "تقييم واحد لكل طلب تم توصيله. إن ظهر خطأ، ربما تم التقييم مسبقاً.",
            "One review per delivered order. If you see an error, it may already be reviewed.",
          )}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("rev-leave", "Laisser un avis", "اترك تقييماً", "Leave a review")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void submit(e)}>
              <div>
                <Label>{t("rev-order", "Commande livrée", "طلب تم توصيله", "Delivered order")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">{t("rev-chose", "— Choisir —", "— اختر —", "— Choose —")}</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 12)}… · {o.vendor?.name ?? t("rev-vendor", "Vendeur", "البائع", "Vendor")} · {o.total}{" "}
                      DZD
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t("rev-rating", "Note (1–5)", "التقييم (1–5)", "Rating (1–5)")}</Label>
                <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div>
                <Label>{t("rev-comment-l", "Commentaire", "تعليق", "Comment")}</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !selectedId}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t("rev-publish", "Publier", "نشر", "Publish")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
