"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@albaz/ui"
import { ArrowLeft, Loader2 } from "lucide-react"
import { supportAPI } from "../../../lib/api-client"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { useProfileI18n } from "../../../hooks/use-profile-i18n"
import {
  formatSupportTicketPriority,
  formatSupportTicketStatus,
} from "../../../lib/profile-display-labels"

export const dynamic = "force-dynamic"

type Ticket = {
  id: string
  subject?: string
  status?: string
  priority?: string
  category?: string
  createdAt?: string
}

export default function SupportPage() {
  const router = useRouter()
  const t = useProfileI18n()
  const { status } = useSession()
  const { handleError } = useErrorHandler()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<"ORDER" | "DELIVERY" | "PAYMENT" | "ACCOUNT" | "OTHER">("OTHER")
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    supportAPI
      .list({ limit: 30 })
      .then((r: { success?: boolean; data?: { tickets?: Ticket[] } }) => {
        if (r.success && Array.isArray(r.data?.tickets)) setTickets(r.data!.tickets!)
        else setTickets([])
      })
      .catch((e) => {
        handleError(e as Error, { showToast: true })
        setTickets([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (subject.trim().length < 5 || description.trim().length < 20) {
      handleError(
        new Error(
          t(
            "support-fields",
            "Sujet ≥5 caractères, description ≥20.",
            "الموضوع 5 أحرف، الوصف 20.",
            "Subject at least 5 characters, description at least 20.",
          ),
        ),
        { showToast: true },
      )
      return
    }
    setSending(true)
    try {
      await supportAPI.create({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority: "MEDIUM",
      })
      setSubject("")
      setDescription("")
      load()
    } catch (err) {
      handleError(err as Error, { showToast: true })
    } finally {
      setSending(false)
    }
  }

  if (status === "loading") {
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
          <h1 className="text-lg font-semibold">{t("support-h1", "Support", "الدعم", "Support")}</h1>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("support-new", "Nouveau ticket", "تذكرة جديدة", "New ticket")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void submit(e)}>
              <div>
                <Label>{t("support-subject", "Sujet", "الموضوع", "Subject")}</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("support-subject-ph", "Résumé court", "ملخص قصير", "Short summary")}
                />
              </div>
              <div>
                <Label>{t("support-desc", "Description", "الوصف", "Description")}</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("support-desc-ph", "Décrivez le problème…", "صف المشكلة…", "Describe the issue…")}
                />
              </div>
              <div>
                <Label>{t("support-cat", "Catégorie", "الفئة", "Category")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                >
                  <option value="ORDER">{t("support-c-order", "Commande", "طلب", "Order")}</option>
                  <option value="DELIVERY">{t("support-c-deliv", "Livraison", "توصيل", "Delivery")}</option>
                  <option value="PAYMENT">{t("support-c-pay", "Paiement", "دفع", "Payment")}</option>
                  <option value="ACCOUNT">{t("support-c-acc", "Compte", "حساب", "Account")}</option>
                  <option value="OTHER">{t("support-c-other", "Autre", "أخرى", "Other")}</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {sending
                  ? t("support-sending", "Envoi…", "جاري الإرسال…", "Sending…")
                  : t("support-send", "Envoyer", "إرسال", "Send")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("support-list", "Mes tickets", "تذاكري", "My tickets")}</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => load()}>
              {t("support-refresh", "Actualiser", "تحديث", "Refresh")}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("support-no-tickets", "Aucun ticket.", "لا تذاكر.", "No tickets yet.")}
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="border-b border-border pb-2">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSupportTicketStatus(t, ticket.status)} · {formatSupportTicketPriority(t, ticket.priority)} ·{' '}
                      {ticket.createdAt?.slice(0, 19)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
