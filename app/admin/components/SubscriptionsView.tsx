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
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  KeyRound
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasskeysTab } from "@/components/tabs/PasskeysTab"

interface Subscription {
  id: string
  userId: string
  user?: {
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

export function SubscriptionsView() {
  const { toast } = useToast()
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")

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
      toast({
        title: "Error",
        description: error.message || "Failed to fetch subscriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
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

    return (
      <Badge className={colors[plan] || "bg-gray-500"}>
        {plan}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subscriptions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Subscriptions data exported to CSV",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const translate = (fr: string, _ar: string) => fr

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="passkeys" className="gap-2">
            <KeyRound className="w-4 h-4" />
            Passkeys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.trial} in trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Recurring monthly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscriptions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user name, email, or subscription ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchSubscriptions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Subscriptions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
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
                          <div className="text-muted-foreground">to {formatDate(sub.currentPeriodEnd)}</div>
                          {sub.cancelAtPeriodEnd && (
                            <Badge variant="outline" className="mt-1">
                              Cancels at period end
                            </Badge>
                          )}
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
                        <div className="text-sm">{formatDate(sub.createdAt)}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="passkeys" className="space-y-6">
          <PasskeysTab translate={translate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

