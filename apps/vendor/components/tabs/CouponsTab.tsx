"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Plus, Edit, Trash2, Copy, CheckCircle2, XCircle } from "lucide-react"
import { CouponDialog, type Coupon } from "../dialogs/CouponDialog"

interface CouponsTabProps {
  translate: (fr: string, ar: string) => string
  isArabic: boolean
}

export function CouponsTab({ translate, isArabic }: CouponsTabProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vendor-coupons')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })
  const [showCouponDialog, setShowCouponDialog] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendor-coupons', JSON.stringify(coupons))
    }
  }, [coupons])

  const handleAddCoupon = () => {
    setSelectedCoupon(null)
    setShowCouponDialog(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowCouponDialog(true)
  }

  const handleDeleteCoupon = (id: string) => {
    if (confirm(translate("Êtes-vous sûr de vouloir supprimer ce coupon?", "هل أنت متأكد من حذف هذا الكوبون?"))) {
      const updated = coupons.filter((c) => c.id !== id)
      setCoupons(updated)
    }
  }

  const handleSaveCoupon = (couponData: Coupon) => {
    if (selectedCoupon && selectedCoupon.id) {
      // Update existing
      const updated = coupons.map((c) => (c.id === selectedCoupon.id ? { ...couponData, id: selectedCoupon.id } : c))
      setCoupons(updated)
    } else {
      // Add new
      const newCoupon: Coupon = {
        ...couponData,
        id: Date.now().toString(),
        usedCount: 0,
      }
      setCoupons([...coupons, newCoupon])
    }
    setShowCouponDialog(false)
    setSelectedCoupon(null)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  const isCouponValid = (coupon: Coupon) => {
    const now = new Date()
    const start = new Date(coupon.startDate)
    const end = new Date(coupon.endDate)
    
    if (!coupon.isActive) return false
    if (now < start || now > end) return false
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return false
    
    return true
  }

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}%${coupon.maxDiscount ? ` (max ${coupon.maxDiscount} DZD)` : ""}`
    }
    return `${coupon.value} ${translate("DZD", "دج")}`
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translate("Coupons & Promotions", "الكوبونات والعروض")}</h2>
        <Button onClick={handleAddCoupon}>
          <Plus className="w-4 h-4 mr-2" />
          {translate("Créer un coupon", "إنشاء كوبون")}
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {translate("Aucun coupon", "لا يوجد كوبونات")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {translate("Créez votre premier coupon pour commencer", "أنشئ أول كوبون للبدء")}
                </p>
                <Button onClick={handleAddCoupon}>
                  <Plus className="w-4 h-4 mr-2" />
                  {translate("Créer un coupon", "إنشاء كوبون")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{translate("Liste des coupons", "قائمة الكوبونات")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Code", "الرمز")}</TableHead>
                  <TableHead>{translate("Nom", "الاسم")}</TableHead>
                  <TableHead>{translate("Type", "النوع")}</TableHead>
                  <TableHead>{translate("Réduction", "الخصم")}</TableHead>
                  <TableHead>{translate("Période", "الفترة")}</TableHead>
                  <TableHead>{translate("Utilisation", "الاستخدام")}</TableHead>
                  <TableHead>{translate("Statut", "الحالة")}</TableHead>
                  <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const isValid = isCouponValid(coupon)
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{coupon.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {coupon.type === "percentage" 
                            ? translate("Pourcentage", "نسبة مئوية") 
                            : translate("Fixe", "ثابت")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {getDiscountText(coupon)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {coupon.usageLimit > 0 ? (
                          <span>
                            {coupon.usedCount} / {coupon.usageLimit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {coupon.usedCount} ({translate("Illimité", "غير محدود")})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isValid ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {translate("Actif", "نشط")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            {translate("Inactif", "غير نشط")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => coupon.id && handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CouponDialog
        open={showCouponDialog}
        onOpenChange={setShowCouponDialog}
        coupon={selectedCoupon}
        translate={translate}
        isArabic={isArabic}
        onSave={handleSaveCoupon}
      />
    </div>
  )
}

