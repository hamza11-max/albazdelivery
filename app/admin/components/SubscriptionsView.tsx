"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CreditCard, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  KeyRound,
  Store,
  Plus,
  CalendarPlus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasskeysTab } from "@/components/tabs/PasskeysTab"
import type { User as UserType } from "@/lib/types"

interface Subscription {
  id: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
  }
  plan: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  createdAt: string
  subscriptionPayments?: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paidAt?: string
  }>
}

interface SubscriptionStats {
  total: number
  active: number
  cancelled: number
  expired: number
  trial: number
  totalRevenue: number
  monthlyRecurringRevenue: number
}

interface SubscriptionsViewProps {
  vendors?: UserType[]
  searchQuery?: string
  setSearchQuery?: (v: string) => void
  setShowVendorDialog?: (v: boolean) => void
  fetchUsers?: () => void
  toast?: ReturnType<typeof useToast>["toast"]
}

export function SubscriptionsView(props: SubscriptionsViewProps) {
  const { toast: toastProp, vendors = [], searchQuery = "", setSearchQuery = () => {}, setShowVendorDialog = () => {}, fetchUsers = () => {} } = props
  const { toast } = useToast()
  const t = toastProp ?? toast

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    expired: 0,
    trial: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [extendingId, setExtendingId] = useState<string | null>(null)

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/subscriptions", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.data.subscriptions || [])
        setStats(data.data.stats || stats)
      } else {
        throw new Error(data.error || "Failed to fetch subscriptions")
      }
    } catch (error: any) {
      t({
        title: "Erreur",
        description: error.message || "Impossible de charger les abonnements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExtendSubscription = async (subId: string, days: number) => {
    setExtendingId(subId)
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ extendDays: days }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Échec")
      t({ title: "Succès", description: `Abonnement prolongé de ${days} jours` })
      fetchSubscriptions()
    } catch (error: any) {
      t({
        title: "Erreur",
        description: error.message || "Impossible de prolonger",
        variant: "destructive",
      })
    } finally {
      setExtendingId(null)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      !searchQuery ||
      sub.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter
    const matchesPlan = planFilter === "all" || sub.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      TRIAL: "secondary",
      CANCELLED: "destructive",
      EXPIRED: "destructive",
      PAST_DUE: "destructive",
    }
    const icons: Record<string, typeof CheckCircle2> = {
      ACTIVE: CheckCircle2,
      TRIAL: Clock,
      CANCELLED: XCircle,
      EXPIRED: XCircle,
      PAST_DUE: AlertCircle,
    }
    const Icon = icons[status] || AlertCircle
    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      STARTER: "bg-gray-500",
      PROFESSIONAL: "bg-blue-500",
      BUSINESS: "bg-purple-500",
      ENTERPRISE: "bg-gradient-to-r from-yellow-500 to-orange-500",
    }
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan}</Badge>
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const exportToCSV = () => {
    const headers = ["User", "Email", "Plan", "Status", "Start Date", "End Date", "Revenue"]
    const rows = filteredSubscriptions.map((sub) => [
      sub.user?.name || "N/A",
      sub.user?.email || "N/A",
      sub.plan,
      sub.status,
      formatDate(sub.currentPeriodStart),
      formatDate(sub.currentPeriodEnd),
      formatCurrency(
        sub.subscriptionPayments?.reduce((sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0), 0) || 0
      ),
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `subscriptions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    t({ title: "Export réussi", description: "Données exportées en CSV" })
  }

  const translate = (fr: string, _ar: string) => fr

  const VendorsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Liste des Vendeurs</h2>
        <Button onClick={() => setShowVendorDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Vendeur
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher un vendeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="grid gap-4">
        {vendors.filter((v) => !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || v.email?.toLowerCase().includes(searchQuery.toLowerCase()) || v.phone?.includes(searchQuery)).map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const SubscriptionsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.trial} en essai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Gestion des abonnements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par nom, email ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="TRIAL">Essai</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="EXPIRED">Expiré</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={fetchSubscriptions}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Revenu</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun abonnement
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.user?.name || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">{sub.user?.email || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(sub.currentPeriodStart)}</div>
                          <div className="text-muted-foreground">→ {formatDate(sub.currentPeriodEnd)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          sub.subscriptionPayments?.reduce(
                            (sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0),
                            0
                          ) || 0
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={extendingId === sub.id}
                            onClick={() => handleExtendSubscription(sub.id, 30)}
                          >
                            <CalendarPlus className="w-4 h-4 mr-1" />
                            +30j
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={extendingId === sub.id}
                            onClick={() => handleExtendSubscription(sub.id, 90)}
                          >
                            +90j
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="vendors" className="gap-2">
            <Store className="w-4 h-4" />
            Vendeurs
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="passkeys" className="gap-2">
            <KeyRound className="w-4 h-4" />
            Passkeys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="passkeys">
          <PasskeysTab translate={translate} vendors={vendors} onRefresh={fetchSubscriptions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
