"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useLoyaltyAccount, useLoyaltyRewards, useLoyaltyTransactions } from "../../../hooks/use-api"
import { useProfileI18n } from "../../../hooks/use-profile-i18n"
import { formatLoyaltyTransactionType, formatMembershipTier } from "../../../lib/profile-display-labels"

export const dynamic = "force-dynamic"

export default function LoyaltyPage() {
  const router = useRouter()
  const t = useProfileI18n()
  const { status } = useSession()
  const { data: accountWrap, loading: la, error: ea } = useLoyaltyAccount()
  const { data: rewardsWrap, loading: lr, error: er } = useLoyaltyRewards()
  const { data: txWrap, loading: lt, error: et } = useLoyaltyTransactions()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading" || la) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4d1a]" />
      </div>
    )
  }

  const account = accountWrap as { account?: { points?: number; tier?: string } } | null
  const rewards = rewardsWrap as { rewards?: unknown[] } | null
  const txs = txWrap as { transactions?: Array<{ id: string; amount?: number; type?: string; createdAt?: string }> } | null

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{t("loyalty-h1", "Fidélité", "الولاء", "Loyalty")}</h1>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        {ea ? (
          <p className="text-sm text-destructive">{ea}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("loyalty-account", "Mon compte", "حسابي", "My account")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {t("loyalty-points", "Points", "النقاط", "Points")} : <strong>{account?.account?.points ?? "—"}</strong>
              <br />
              {t("loyalty-tier", "Niveau", "المستوى", "Tier")} :{' '}
              <strong>{formatMembershipTier(t, account?.account?.tier)}</strong>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("loyalty-rewards", "Récompenses", "المكافآت", "Rewards")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lr ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : er ? (
              <p className="text-sm text-destructive">{er}</p>
            ) : (
              <ul className="text-sm space-y-2 list-disc pl-4">
                {Array.isArray(rewards?.rewards) && rewards.rewards.length > 0 ? (
                  (rewards.rewards as { id: string; name?: string; pointsCost?: number }[]).map((r) => (
                    <li key={r.id}>
                      {r.name ?? r.id} —{" "}
                      {r.pointsCost != null
                        ? `${r.pointsCost} ${t("loyalty-pts", "pts", "نقاط", "pts")}`
                        : ""}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">
                    {t("loyalty-none-rewards", "Aucune récompense configurée.", "لا توجد مكافآت.", "No rewards configured.")}
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("loyalty-tx", "Historique des points", "سجل النقاط", "Points history")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lt ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : et ? (
              <p className="text-sm text-destructive">{et}</p>
            ) : (
              <ul className="text-sm space-y-2">
                {(txs?.transactions?.length ? txs.transactions : []).map((row: { id: string; type?: string; points?: number; createdAt?: string }) => (
                  <li key={row.id} className="flex justify-between border-b border-border pb-2 gap-2">
                    <span>{formatLoyaltyTransactionType(t, row.type)}</span>
                    <span className="tabular-nums">
                      {row.points ?? ""} {t("loyalty-pts", "pts", "نقاط", "pts")}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{row.createdAt?.slice(0, 10)}</span>
                  </li>
                ))}
                {!txs?.transactions?.length ? (
                  <li className="text-muted-foreground">
                    {t("loyalty-none-tx", "Aucun mouvement récent.", "لا حركات حديثة.", "No recent activity.")}
                  </li>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
