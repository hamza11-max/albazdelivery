"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { BookOpenCheck, Download } from "lucide-react"
import { electronFetch } from "@/lib/electron-fetch"

interface AccountingTabProps {
  translate: (fr: string, ar: string) => string
}

async function parseJson(res: Response) {
  const j = await res.json().catch(() => null)
  return { ok: res.ok, data: j?.data ?? j, err: j?.error?.message || j?.message }
}

export function AccountingTab({ translate }: AccountingTabProps) {
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("general")
  const [note, setNote] = useState("")

  const load = useCallback(async () => {
    setError("")
    const fromMs = new Date(from + "T00:00:00").getTime()
    const toMs = new Date(to + "T23:59:59").getTime()
    const res = await electronFetch(`/api/vendor/accounting/summary?fromMs=${fromMs}&toMs=${toMs}`)
    const { ok, data, err } = await parseJson(res)
    if (!ok) {
      setError(err || "Erreur")
      setSummary(null)
      return
    }
    setSummary(data)
  }, [from, to])

  useEffect(() => {
    void load()
  }, [load])

  const addExpense = async () => {
    setError("")
    const res = await electronFetch("/api/vendor/accounting/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        category,
        note: note.trim() || undefined,
      }),
    })
    const { ok, err } = await parseJson(res)
    if (!ok) {
      setError(err || "Erreur")
      return
    }
    setAmount("")
    setNote("")
    void load()
  }

  const downloadCsv = async () => {
    const fromMs = new Date(from + "T00:00:00").getTime()
    const toMs = new Date(to + "T23:59:59").getTime()
    const res = await electronFetch(`/api/vendor/accounting/export?fromMs=${fromMs}&toMs=${toMs}`)
    if (!res.ok) {
      setError("Export CSV impossible")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `albaz-accounting-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BookOpenCheck className="w-7 h-7" />
        {translate("Comptabilité (local)", "المحاسبة (محلي)")}
      </h2>
      {error ? (
        <p className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-2 bg-red-50">{error}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{translate("Période & ventes hors ligne", "الفترة والمبيعات المحلية")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>{translate("Du", "من")}</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{translate("Au", "إلى")}</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="button" variant="outline" onClick={() => void load()}>
            {translate("Recalculer", "إعادة حساب")}
          </Button>
          <Button type="button" onClick={downloadCsv}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </CardContent>
      </Card>

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>{translate("Résumé", "ملخص")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {translate("Ventes (hors ligne)", "مبيعات (محلية)")}:{" "}
              <strong>{summary.salesSummary?.count ?? 0}</strong> — brut{" "}
              <strong>{Number(summary.salesSummary?.gross || 0).toFixed(2)}</strong>
            </p>
            <p>
              {translate("Dépenses sur période", "مصاريف الفترة")}:{" "}
              <strong>{Number(summary.expenseTotal || 0).toFixed(2)}</strong>
            </p>
            {summary.salesSummary?.byPayment ? (
              <div>
                <p className="font-medium mt-2">{translate("Par mode de paiement", "حسب طريقة الدفع")}</p>
                <ul className="list-disc pl-5">
                  {Object.entries(summary.salesSummary.byPayment as Record<string, number>).map(([k, v]) => (
                    <li key={k}>
                      {k}: {Number(v).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{translate("Ajouter une dépense", "إضافة مصروف")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-md">
          <div className="space-y-1">
            <Label>{translate("Montant", "المبلغ")}</Label>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{translate("Catégorie", "التصنيف")}</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{translate("Note", "ملاحظة")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="button" onClick={() => void addExpense()}>
            {translate("Enregistrer", "حفظ")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
