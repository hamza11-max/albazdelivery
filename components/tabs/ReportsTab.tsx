"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, BarChart3, ShoppingBag } from "lucide-react"
import type { Sale } from "@/root/lib/types"
import type { InventoryProduct } from "@/root/lib/types"

interface ReportsTabProps {
  sales: Sale[]
  products: InventoryProduct[]
  translate: (fr: string, ar: string) => string
}

interface DateRange {
  start: string
  end: string
}

type ReportType = "sales" | "products" | "customers" | "financial"

export function ReportsTab({ sales, products, translate }: ReportsTabProps) {
  const [reportType, setReportType] = useState<ReportType>("sales")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30) // Last 30 days default
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })
  const [preset, setPreset] = useState<string>("last30")

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
      return saleDate >= dateRange.start && saleDate <= dateRange.end
    })
  }, [sales, dateRange])

  const salesReport = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalSales = filteredSales.length
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0
    
    const dailySales = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, count: 0 }
      }
      acc[date].revenue += sale.total
      acc[date].count += 1
      return acc
    }, {} as Record<string, { date: string; revenue: number; count: number }>)

    const dailyData = Object.values(dailySales).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    return {
      totalRevenue,
      totalSales,
      averageSale,
      dailyData,
    }
  }, [filteredSales])

  const productReport = useMemo(() => {
    const productSales: Record<string, { 
      productId: string
      productName: string
      quantity: number
      revenue: number
      price: number
    }> = {}

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productId = String(item.productId)
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
          }
        }
        const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 0
        const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
        productSales[productId].quantity += qty
        productSales[productId].revenue += price * qty
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20) // Top 20 products
  }, [filteredSales])

  const customerReport = useMemo(() => {
    const customerSales: Record<string, {
      customerId: string | null
      customerName: string
      purchaseCount: number
      totalSpent: number
    }> = {}

    filteredSales.forEach((sale) => {
      const customerId = sale.customerId ? String(sale.customerId) : 'anonymous'
      const customerName = sale.customerName || translate("Client anonyme", "عميل مجهول")
      
      if (!customerSales[customerId]) {
        customerSales[customerId] = {
          customerId: sale.customerId ? String(sale.customerId) : null,
          customerName,
          purchaseCount: 0,
          totalSpent: 0,
        }
      }
      customerSales[customerId].purchaseCount += 1
      customerSales[customerId].totalSpent += sale.total
    })

    return Object.values(customerSales)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20) // Top 20 customers
  }, [filteredSales, translate])

  const financialReport = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalDiscount = filteredSales.reduce((sum, sale) => sum + sale.discount, 0)
    const totalSubtotal = filteredSales.reduce((sum, sale) => sum + sale.subtotal, 0)
    const netRevenue = totalRevenue

    // Payment method breakdown
    const paymentBreakdown = filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'cash'
      if (!acc[method]) {
        acc[method] = { method, count: 0, amount: 0 }
      }
      acc[method].count += 1
      acc[method].amount += sale.total
      return acc
    }, {} as Record<string, { method: string; count: number; amount: number }>)

    return {
      totalRevenue,
      totalDiscount,
      totalSubtotal,
      netRevenue,
      paymentBreakdown: Object.values(paymentBreakdown),
    }
  }, [filteredSales])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const end = new Date()
    const start = new Date()

    switch (value) {
      case "today":
        start.setHours(0, 0, 0, 0)
        break
      case "yesterday":
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
        break
      case "last7":
        start.setDate(start.getDate() - 7)
        break
      case "last30":
        start.setDate(start.getDate() - 30)
        break
      case "last90":
        start.setDate(start.getDate() - 90)
        break
      case "thisMonth":
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case "lastMonth":
        start.setMonth(start.getMonth() - 1)
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setDate(0) // Last day of previous month
        end.setHours(23, 59, 59, 999)
        break
      case "thisYear":
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
      case "custom":
        return // Don't change dates for custom
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
  }

  const handleExportPDF = () => {
    // Generate PDF report
    const printContent = document.getElementById('report-content')
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = printContent.innerHTML
    const title = `${translate("Rapport", "التقرير")} - ${reportType} - ${dateRange.start} to ${dateRange.end}`

    printWindow.document.write('<!DOCTYPE html>')
    printWindow.document.write('<html>')
    printWindow.document.write('<head>')
    printWindow.document.write(`<title>${title}</title>`)
    printWindow.document.write('<style>')
    printWindow.document.write('@page { size: A4; margin: 1cm; }')
    printWindow.document.write('body { font-family: Arial, sans-serif; font-size: 12px; }')
    printWindow.document.write('table { width: 100%; border-collapse: collapse; }')
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }')
    printWindow.document.write('th { background-color: #f2f2f2; }')
    printWindow.document.write('</style>')
    printWindow.document.write('</head>')
    printWindow.document.write('<body>')
    printWindow.document.write(htmlContent)
    printWindow.document.write('</body>')
    printWindow.document.write('</html>')
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleExportCSV = () => {
    let csvContent = ""
    let filename = ""

    switch (reportType) {
      case "sales":
        csvContent = "Date,Order ID,Total,Discount,Payment Method\n"
        filteredSales.forEach((sale) => {
          csvContent += `${new Date(sale.createdAt).toLocaleDateString()},${sale.id},${sale.total},${sale.discount},${sale.paymentMethod}\n`
        })
        filename = `sales-report-${dateRange.start}-${dateRange.end}.csv`
        break
      case "products":
        csvContent = "Product Name,Quantity Sold,Revenue\n"
        productReport.forEach((item) => {
          csvContent += `"${item.productName}",${item.quantity},${item.revenue}\n`
        })
        filename = `product-report-${dateRange.start}-${dateRange.end}.csv`
        break
      case "customers":
        csvContent = "Customer Name,Purchases,Total Spent\n"
        customerReport.forEach((customer) => {
          csvContent += `"${customer.customerName}",${customer.purchaseCount},${customer.totalSpent}\n`
        })
        filename = `customer-report-${dateRange.start}-${dateRange.end}.csv`
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4" id="report-content">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translate("Rapports & Analytics", "التقارير والتحليلات")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            {translate("Exporter CSV", "تصدير CSV")}
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            {translate("Exporter PDF", "تصدير PDF")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{translate("Filtres", "المرشحات")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{translate("Type de rapport", "نوع التقرير")}</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{translate("Ventes", "المبيعات")}</SelectItem>
                  <SelectItem value="products">{translate("Produits", "المنتجات")}</SelectItem>
                  <SelectItem value="customers">{translate("Clients", "العملاء")}</SelectItem>
                  <SelectItem value="financial">{translate("Financier", "المالي")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{translate("Période", "الفترة")}</Label>
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{translate("Aujourd'hui", "اليوم")}</SelectItem>
                  <SelectItem value="yesterday">{translate("Hier", "أمس")}</SelectItem>
                  <SelectItem value="last7">{translate("7 derniers jours", "آخر 7 أيام")}</SelectItem>
                  <SelectItem value="last30">{translate("30 derniers jours", "آخر 30 يوم")}</SelectItem>
                  <SelectItem value="last90">{translate("90 derniers jours", "آخر 90 يوم")}</SelectItem>
                  <SelectItem value="thisMonth">{translate("Ce mois", "هذا الشهر")}</SelectItem>
                  <SelectItem value="lastMonth">{translate("Mois dernier", "الشهر الماضي")}</SelectItem>
                  <SelectItem value="thisYear">{translate("Cette année", "هذه السنة")}</SelectItem>
                  <SelectItem value="custom">{translate("Personnalisé", "مخصص")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{translate("Date de début", "تاريخ البداية")}</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setPreset("custom")
                  setDateRange({ ...dateRange, start: e.target.value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Date de fin", "تاريخ النهاية")}</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setPreset("custom")
                  setDateRange({ ...dateRange, end: e.target.value })
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Report */}
      {reportType === "sales" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Revenu total", "إجمالي الإيرادات")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{salesReport.totalRevenue.toFixed(2)} {translate("DZD", "دج")}</p>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Nombre de ventes", "عدد المبيعات")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{salesReport.totalSales}</p>
                  <ShoppingBag className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Vente moyenne", "متوسط البيع")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{salesReport.averageSale.toFixed(2)} {translate("DZD", "دج")}</p>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{translate("Ventes par jour", "المبيعات اليومية")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("Date", "التاريخ")}</TableHead>
                    <TableHead>{translate("Nombre de ventes", "عدد المبيعات")}</TableHead>
                    <TableHead>{translate("Revenu", "الإيرادات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.dailyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        {translate("Aucune donnée pour cette période", "لا توجد بيانات لهذه الفترة")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesReport.dailyData.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell>{day.count}</TableCell>
                        <TableCell className="font-semibold">{day.revenue.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Products Report */}
      {reportType === "products" && (
        <Card>
          <CardHeader>
            <CardTitle>{translate("Performance des produits", "أداء المنتجات")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Produit", "المنتج")}</TableHead>
                  <TableHead>{translate("Quantité vendue", "الكمية المباعة")}</TableHead>
                  <TableHead>{translate("Revenu", "الإيرادات")}</TableHead>
                  <TableHead>{translate("Prix moyen", "متوسط السعر")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {translate("Aucune donnée pour cette période", "لا توجد بيانات لهذه الفترة")}
                    </TableCell>
                  </TableRow>
                ) : (
                  productReport.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-semibold">{item.revenue.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                      <TableCell>{(item.revenue / item.quantity).toFixed(2)} {translate("DZD", "دج")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Customers Report */}
      {reportType === "customers" && (
        <Card>
          <CardHeader>
            <CardTitle>{translate("Top clients", "أفضل العملاء")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Client", "العميل")}</TableHead>
                  <TableHead>{translate("Nombre d'achats", "عدد المشتريات")}</TableHead>
                  <TableHead>{translate("Total dépensé", "إجمالي الإنفاق")}</TableHead>
                  <TableHead>{translate("Moyenne par achat", "المتوسط لكل شراء")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {translate("Aucune donnée pour cette période", "لا توجد بيانات لهذه الفترة")}
                    </TableCell>
                  </TableRow>
                ) : (
                  customerReport.map((customer) => (
                    <TableRow key={customer.customerId || 'anonymous'}>
                      <TableCell className="font-medium">{customer.customerName}</TableCell>
                      <TableCell>{customer.purchaseCount}</TableCell>
                      <TableCell className="font-semibold">{customer.totalSpent.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                      <TableCell>{(customer.totalSpent / customer.purchaseCount).toFixed(2)} {translate("DZD", "دج")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Financial Report */}
      {reportType === "financial" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Revenu total", "إجمالي الإيرادات")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{financialReport.totalRevenue.toFixed(2)} {translate("DZD", "دج")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Sous-total", "المجموع الفرعي")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{financialReport.totalSubtotal.toFixed(2)} {translate("DZD", "دج")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Remises", "الخصومات")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{financialReport.totalDiscount.toFixed(2)} {translate("DZD", "دج")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Revenu net", "صافي الإيرادات")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{financialReport.netRevenue.toFixed(2)} {translate("DZD", "دج")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{translate("Répartition par mode de paiement", "التوزيع حسب طريقة الدفع")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("Mode de paiement", "طريقة الدفع")}</TableHead>
                    <TableHead>{translate("Nombre de transactions", "عدد المعاملات")}</TableHead>
                    <TableHead>{translate("Montant total", "المبلغ الإجمالي")}</TableHead>
                    <TableHead>{translate("Pourcentage", "النسبة المئوية")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialReport.paymentBreakdown.map((payment) => {
                    const percentage = financialReport.totalRevenue > 0 
                      ? (payment.amount / financialReport.totalRevenue * 100).toFixed(1)
                      : "0"
                    return (
                      <TableRow key={payment.method}>
                        <TableCell className="font-medium">
                          {payment.method === 'cash' ? translate("Espèces", "نقد") : translate("Carte", "بطاقة")}
                        </TableCell>
                        <TableCell>{payment.count}</TableCell>
                        <TableCell className="font-semibold">{payment.amount.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

