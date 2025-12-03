"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Download, Calendar, TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"

// Import chart components from root UI package
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/root/components/ui/chart"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface AnalyticsData {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalUsers: number
    period: {
      startDate: string
      endDate: string
      groupBy: string
    }
  }
  ordersByPeriod: Array<{ date: string; count: number; revenue: number }>
  ordersByStatus: Record<string, number>
  revenueByStatus: Record<string, number>
  usersByPeriod: Array<{ date: string; total: number; customers: number; vendors: number; drivers: number }>
  topVendors: Array<{ vendorId: string; vendorName: string; revenue: number }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function AnalyticsDashboard() {
  const { toast } = useToast()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(dateRange))

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
      })

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setAnalyticsData(data.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Analytics] Error:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, groupBy])

  const handleExport = async (type: 'users' | 'orders' | 'audit-logs') => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(dateRange))

      const response = await fetchWithCsrf('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format: 'csv',
          filters: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Succès",
          description: "Export réussi",
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytiques</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Chargement des statistiques...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytiques</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const ordersChartData = analyticsData.ordersByPeriod.map((item) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    }),
    commandes: item.count,
    revenu: item.revenue,
  }))

  const usersChartData = analyticsData.usersByPeriod.map((item) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    }),
    total: item.total,
    clients: item.customers,
    vendeurs: item.vendors,
    livreurs: item.drivers,
  }))

  const statusChartData = Object.entries(analyticsData.ordersByStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  const topVendorsData = analyticsData.topVendors.slice(0, 5).map((v) => ({
    name: v.vendorName.length > 15 ? v.vendorName.substring(0, 15) + '...' : v.vendorName,
    revenue: v.revenue,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytiques</h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 derniers mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Par jour</SelectItem>
              <SelectItem value="week">Par semaine</SelectItem>
              <SelectItem value="month">Par mois</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => handleExport('orders')}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenu Total</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalRevenue.toLocaleString('fr-FR')} DZD</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Commandes</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Panier Moyen</p>
                <p className="text-2xl font-bold">{Math.round(analyticsData.summary.averageOrderValue).toLocaleString('fr-FR')} DZD</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nouveaux Utilisateurs</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes et Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ commandes: { label: 'Commandes' }, revenu: { label: 'Revenu (DZD)' } }}>
              <LineChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="commandes" stroke="#8884d8" name="Commandes" />
                <Line yAxisId="right" type="monotone" dataKey="revenu" stroke="#82ca9d" name="Revenu (DZD)" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Croissance des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: 'Total' }, clients: { label: 'Clients' }, vendeurs: { label: 'Vendeurs' }, livreurs: { label: 'Livreurs' } }}>
              <LineChart data={usersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                <Line type="monotone" dataKey="clients" stroke="#82ca9d" name="Clients" />
                <Line type="monotone" dataKey="vendeurs" stroke="#ffc658" name="Vendeurs" />
                <Line type="monotone" dataKey="livreurs" stroke="#ff7300" name="Livreurs" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vendeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: 'Revenu (DZD)' } }}>
              <BarChart data={topVendorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenu (DZD)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

