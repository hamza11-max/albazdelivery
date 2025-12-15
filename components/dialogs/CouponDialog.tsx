"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { Switch } from "@/root/components/ui/switch"

export interface Coupon {
  id?: string
  code: string
  name: string
  description: string
  type: "percentage" | "fixed"
  value: number
  minPurchase?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit?: number
  usedCount: number
  isActive: boolean
  applicableTo: "all" | "products" | "categories"
  productIds?: string[]
  categoryIds?: string[]
}

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon?: Coupon | null
  translate: (fr: string, ar: string) => string
  isArabic: boolean
  onSave: (coupon: Coupon) => void
}

export function CouponDialog({
  open,
  onOpenChange,
  coupon,
  translate,
  isArabic,
  onSave,
}: CouponDialogProps) {
  const [formData, setFormData] = useState<Coupon>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    usedCount: 0,
    isActive: true,
    applicableTo: "all",
    productIds: [],
    categoryIds: [],
  })

  useEffect(() => {
    if (coupon) {
      setFormData(coupon)
    } else {
      // Generate random coupon code
      const code = "COUPON" + Math.random().toString(36).substring(2, 8).toUpperCase()
      setFormData({
        code,
        name: "",
        description: "",
        type: "percentage",
        value: 0,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 0,
        usedCount: 0,
        isActive: true,
        applicableTo: "all",
        productIds: [],
        categoryIds: [],
      })
    }
  }, [coupon, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.name || formData.value <= 0) {
      return
    }
    onSave(formData)
    onOpenChange(false)
  }

  const generateCode = () => {
    const code = "COUPON" + Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData({ ...formData, code })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {coupon ? translate("Modifier le coupon", "تعديل الكوبون") : translate("Créer un coupon", "إنشاء كوبون")}
          </DialogTitle>
          <DialogDescription>
            {coupon
              ? translate("Modifiez les informations du coupon", "قم بتعديل معلومات الكوبون")
              : translate("Créez un nouveau coupon ou code promotionnel", "أنشئ كوبوناً أو رمزاً ترويجياً جديداً")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">{translate("Code du coupon", "رمز الكوبون")} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="COUPON123"
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    {translate("Générer", "إنشاء")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-name">{translate("Nom du coupon", "اسم الكوبون")} *</Label>
                <Input
                  id="coupon-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={translate("Ex: Réduction été 2024", "مثال: خصم الصيف 2024")}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-description">{translate("Description", "الوصف")}</Label>
              <Input
                id="coupon-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={translate("Description du coupon", "وصف الكوبون")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-type">{translate("Type de réduction", "نوع الخصم")} *</Label>
                <Select value={formData.type} onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="coupon-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{translate("Pourcentage", "نسبة مئوية")}</SelectItem>
                    <SelectItem value="fixed">{translate("Montant fixe", "مبلغ ثابت")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {formData.type === "percentage" 
                    ? translate("Pourcentage (%)", "النسبة المئوية (%)") 
                    : translate("Montant (DZD)", "المبلغ (دج)")} *
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min="0"
                  step={formData.type === "percentage" ? "1" : "0.01"}
                  max={formData.type === "percentage" ? "100" : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            {formData.type === "percentage" && (
              <div className="space-y-2">
                <Label htmlFor="coupon-max-discount">{translate("Remise maximale (DZD)", "الخصم الأقصى (دج)")}</Label>
                <Input
                  id="coupon-max-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscount || 0}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder={translate("Limite optionnelle", "حد اختياري")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="coupon-min-purchase">{translate("Achat minimum (DZD)", "الحد الأدنى للشراء (دج)")}</Label>
              <Input
                id="coupon-min-purchase"
                type="number"
                min="0"
                step="0.01"
                value={formData.minPurchase || 0}
                onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                placeholder={translate("Aucun minimum", "لا يوجد حد أدنى")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-start-date">{translate("Date de début", "تاريخ البداية")} *</Label>
                <Input
                  id="coupon-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-end-date">{translate("Date de fin", "تاريخ النهاية")} *</Label>
                <Input
                  id="coupon-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-usage-limit">{translate("Limite d'utilisation", "حد الاستخدام")}</Label>
              <Input
                id="coupon-usage-limit"
                type="number"
                min="0"
                value={formData.usageLimit || 0}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                placeholder={translate("0 = illimité", "0 = غير محدود")}
              />
              {coupon && formData.usageLimit > 0 && (
                <p className="text-sm text-muted-foreground">
                  {translate("Utilisé", "مستخدم")}: {formData.usedCount} / {formData.usageLimit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-applicable">{translate("Applicable à", "ينطبق على")}</Label>
              <Select value={formData.applicableTo} onValueChange={(value: "all" | "products" | "categories") => setFormData({ ...formData, applicableTo: value })}>
                <SelectTrigger id="coupon-applicable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate("Tous les produits", "جميع المنتجات")}</SelectItem>
                  <SelectItem value="products">{translate("Produits spécifiques", "منتجات محددة")}</SelectItem>
                  <SelectItem value="categories">{translate("Catégories", "الفئات")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="coupon-active">{translate("Actif", "نشط")}</Label>
                <p className="text-sm text-muted-foreground">
                  {translate("Le coupon est actuellement actif", "الكوبون نشط حالياً")}
                </p>
              </div>
              <Switch
                id="coupon-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button type="submit">
              {coupon ? translate("Enregistrer", "حفظ") : translate("Créer", "إنشاء")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

