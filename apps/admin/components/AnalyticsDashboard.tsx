"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { useAdminI18n } from "../lib/AdminI18nProvider"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function AnalyticsDashboard() {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()
  const locale = language === "ar" ? "ar-DZ" : "fr-FR"
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(dateRange, 10))

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
      })

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setAnalyticsData(data.data)
      } else {
        toast({
          title: t("common.error"),
          description: t("analyticsDash.loadError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Analytics] Error:", error)
      toast({
        title: t("common.error"),
        description: t("analyticsDash.loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, groupBy, toast, t])

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  const ordersChartData = useMemo(() => {
    if (!analyticsData) return []
    return analyticsData.ordersByPeriod.map((item) => ({
      date: new Date(item.date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      }),
      orders: item.count,
      revenue: item.revenue,
    }))
  }, [analyticsData, locale])

  const usersChartData = useMemo(() => {
    if (!analyticsData) return []
    return analyticsData.usersByPeriod.map((item) => ({
      date: new Date(item.date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      }),
      total: item.total,
      customers: item.customers,
      vendors: item.vendors,
      drivers: item.drivers,
    }))
  }, [analyticsData, locale])

  const statusChartData = useMemo(() => {
    if (!analyticsData) return []
    return Object.entries(analyticsData.ordersByStatus).map(([status, count]) => ({
      name: status,
      value: count,
    }))
  }, [analyticsData])

  const topVendorsData = useMemo(() => {
    if (!analyticsData) return []
    return analyticsData.topVendors.slice(0, 5).map((v) => ({
      name: v.vendorName.length > 15 ? v.vendorName.substring(0, 15) + "..." : v.vendorName,
      revenue: v.revenue,
    }))
  }, [analyticsData])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("analyticsDash.title")}</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("analyticsDash.loadingStats")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("analyticsDash.title")}</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("analyticsDash.noData")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("analyticsDash.title")}</h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("analyticsDash.period7")}</SelectItem>
              <SelectItem value="30">{t("analyticsDash.period30")}</SelectItem>
              <SelectItem value="90">{t("analyticsDash.period90")}</SelectItem>
              <SelectItem value="365">{t("analyticsDash.period365")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(v: "day" | "week" | "month") => setGroupBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t("analyticsDash.groupDay")}</SelectItem>
              <SelectItem value="week">{t("analyticsDash.groupWeek")}</SelectItem>
              <SelectItem value="month">{t("analyticsDash.groupMonth")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.totalRevenue")}</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalRevenue.toLocaleString(locale)} DZD</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.totalOrders")}</p>
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
                <p className="text-sm text-muted-foreground mb-1">{t("analyticsDash.avgOrder")}</p>
                <p className="text-2xl font-bold">
                  {Math.round(analyticsData.summary.averageOrderValue).toLocaleString(locale)} DZD
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("analyticsDash.newUsers")}</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsDash.chartOrdersRev")}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[280px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name={t("analyticsDash.legendOrders")} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#82ca9d"
                    name={t("analyticsDash.legendRevDzd")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsDash.chartByStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[280px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsDash.userGrowth")}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[280px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name={t("analyticsDash.legendTotal")} />
                  <Line type="monotone" dataKey="customers" stroke="#82ca9d" name={t("dashboard.customersTitle")} />
                  <Line type="monotone" dataKey="vendors" stroke="#ffc658" name={t("dashboard.vendorsTitle")} />
                  <Line type="monotone" dataKey="drivers" stroke="#ff7300" name={t("dashboard.driversTitle")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analyticsDash.top5Vendors")}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[280px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendorsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8884d8" name={t("analyticsDash.legendRevDzd")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
