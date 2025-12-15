"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { Switch } from "@/root/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { Gift, Star, TrendingUp, Users, Settings, Plus, Edit, Trash2, Award } from "lucide-react"
import {
  DEFAULT_TIERS,
  DEFAULT_RULE,
  getLoyaltyTiers,
  saveLoyaltyTiers,
  getLoyaltyRules,
  saveLoyaltyRules,
  getAllLoyaltyCustomers,
  getTierForPoints,
  type LoyaltyTier,
  type LoyaltyRule,
  type CustomerLoyalty,
} from \"@/utils/loyaltyUtils"
import { useToast } from "@/hooks/use-toast"

interface LoyaltyTabProps {
  translate: (fr: string, ar: string) => string
}

export function LoyaltyTab({ translate }: LoyaltyTabProps) {
  const { toast } = useToast()
  const [tiers, setTiers] = useState<LoyaltyTier[]>(getLoyaltyTiers())
  const [rules, setRules] = useState<LoyaltyRule[]>(getLoyaltyRules())
  const [customers, setCustomers] = useState<CustomerLoyalty[]>(getAllLoyaltyCustomers())
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [editingRule, setEditingRule] = useState<LoyaltyRule | null>(null)
  const [tierForm, setTierForm] = useState<Partial<LoyaltyTier>>({})
  const [ruleForm, setRuleForm] = useState<Partial<LoyaltyRule>>({})

  useEffect(() => {
    setCustomers(getAllLoyaltyCustomers())
  }, [])

  const handleSaveTier = () => {
    if (!tierForm.name || tierForm.minPoints === undefined) return

    const newTier: LoyaltyTier = {
      id: editingTier?.id || tierForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: tierForm.name,
      minPoints: tierForm.minPoints || 0,
      discountPercent: tierForm.discountPercent || 0,
      color: tierForm.color || "#000000",
    }

    let updated: LoyaltyTier[]
    if (editingTier) {
      updated = tiers.map((t) => (t.id === editingTier.id ? newTier : t))
    } else {
      updated = [...tiers, newTier]
    }

    // Sort by minPoints
    updated.sort((a, b) => a.minPoints - b.minPoints)
    setTiers(updated)
    saveLoyaltyTiers(updated)
    setShowTierDialog(false)
    setEditingTier(null)
    setTierForm({})

    toast({
      title: translate("Niveau enregistré", "تم حفظ المستوى"),
      description: translate("Le niveau de fidélité a été enregistré", "تم حفظ مستوى الولاء"),
    })
  }

  const handleDeleteTier = (tierId: string) => {
    if (confirm(translate("Êtes-vous sûr de vouloir supprimer ce niveau?", "هل أنت متأكد من حذف هذا المستوى?"))) {
      const updated = tiers.filter((t) => t.id !== tierId)
      setTiers(updated)
      saveLoyaltyTiers(updated)
    }
  }

  const handleSaveRule = () => {
    if (!ruleForm.name || ruleForm.pointsPerDZD === undefined) return

    const newRule: LoyaltyRule = {
      id: editingRule?.id || Date.now().toString(),
      name: ruleForm.name,
      pointsPerDZD: ruleForm.pointsPerDZD || 0,
      isActive: ruleForm.isActive !== undefined ? ruleForm.isActive : true,
    }

    let updated: LoyaltyRule[]
    if (editingRule) {
      updated = rules.map((r) => (r.id === editingRule.id ? newRule : r))
    } else {
      updated = [...rules, newRule]
    }

    setRules(updated)
    saveLoyaltyRules(updated)
    setShowRuleDialog(false)
    setEditingRule(null)
    setRuleForm({})

    toast({
      title: translate("Règle enregistrée", "تم حفظ القاعدة"),
      description: translate("La règle de fidélité a été enregistrée", "تم حفظ قاعدة الولاء"),
    })
  }

  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTier(tier)
    setTierForm(tier)
    setShowTierDialog(true)
  }

  const handleEditRule = (rule: LoyaltyRule) => {
    setEditingRule(rule)
    setRuleForm(rule)
    setShowRuleDialog(true)
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Programme de Fidélité", "برنامج الولاء")}</h2>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            {translate("Clients", "العملاء")}
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Award className="w-4 h-4 mr-2" />
            {translate("Niveaux", "المستويات")}
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="w-4 h-4 mr-2" />
            {translate("Règles", "القواعد")}
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {translate("Clients Fidèles", "العملاء المخلصون")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {translate("Aucun client dans le programme de fidélité", "لا يوجد عملاء في برنامج الولاء")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translate("Client", "العميل")}</TableHead>
                      <TableHead>{translate("Points", "النقاط")}</TableHead>
                      <TableHead>{translate("Niveau", "المستوى")}</TableHead>
                      <TableHead>{translate("Dépenses", "المصروفات")}</TableHead>
                      <TableHead>{translate("Dernière achat", "آخر شراء")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((customer) => {
                        const tier = getTierForPoints(customer.totalPoints, tiers)
                        return (
                          <TableRow key={customer.customerId}>
                            <TableCell className="font-medium">{customer.customerName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{customer.totalPoints} {translate("pts", "نقطة")}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: tier.color, color: 'white' }}>
                                {tier.name}
                              </Badge>
                            </TableCell>
                            <TableCell>{customer.lifetimeSpent.toFixed(2)} {translate("DZD", "دج")}</TableCell>
                            <TableCell>
                              {customer.lastPurchaseDate
                                ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                                : translate("Jamais", "أبداً")}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {translate("Niveaux de Fidélité", "مستويات الولاء")}
                </CardTitle>
                <Button onClick={() => {
                  setEditingTier(null)
                  setTierForm({})
                  setShowTierDialog(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {translate("Ajouter", "إضافة")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("Niveau", "المستوى")}</TableHead>
                    <TableHead>{translate("Points min", "الحد الأدنى للنقاط")}</TableHead>
                    <TableHead>{translate("Remise", "الخصم")}</TableHead>
                    <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <Badge style={{ backgroundColor: tier.color, color: 'white' }}>
                          {tier.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{tier.minPoints} {translate("pts", "نقطة")}</TableCell>
                      <TableCell>{tier.discountPercent}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTier(tier)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTier(tier.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {translate("Règles de Points", "قواعد النقاط")}
                </CardTitle>
                <Button onClick={() => {
                  setEditingRule(null)
                  setRuleForm({})
                  setShowRuleDialog(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  {translate("Ajouter", "إضافة")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("Nom", "الاسم")}</TableHead>
                    <TableHead>{translate("Points par DZD", "النقاط لكل دج")}</TableHead>
                    <TableHead>{translate("Statut", "الحالة")}</TableHead>
                    <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.pointsPerDZD} {translate("pts/DZD", "نقطة/دج")}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? translate("Actif", "نشط") : translate("Inactif", "غير نشط")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTier ? translate("Modifier le niveau", "تعديل المستوى") : translate("Nouveau niveau", "مستوى جديد")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{translate("Nom", "الاسم")} *</Label>
              <Input
                value={tierForm.name || ''}
                onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                placeholder={translate("Ex: Or", "مثال: ذهبي")}
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Points minimum", "الحد الأدنى للنقاط")} *</Label>
              <Input
                type="number"
                value={tierForm.minPoints || 0}
                onChange={(e) => setTierForm({ ...tierForm, minPoints: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Remise (%)", "الخصم (%)")}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tierForm.discountPercent || 0}
                onChange={(e) => setTierForm({ ...tierForm, discountPercent: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Couleur", "اللون")}</Label>
              <Input
                type="color"
                value={tierForm.color || '#000000'}
                onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button onClick={handleSaveTier}>
              {translate("Enregistrer", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? translate("Modifier la règle", "تعديل القاعدة") : translate("Nouvelle règle", "قاعدة جديدة")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{translate("Nom", "الاسم")} *</Label>
              <Input
                value={ruleForm.name || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder={translate("Ex: Règle standard", "مثال: قاعدة قياسية")}
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Points par DZD", "النقاط لكل دج")} *</Label>
              <Input
                type="number"
                step="0.1"
                value={ruleForm.pointsPerDZD || 0}
                onChange={(e) => setRuleForm({ ...ruleForm, pointsPerDZD: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{translate("Actif", "نشط")}</Label>
              <Switch
                checked={ruleForm.isActive !== undefined ? ruleForm.isActive : true}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button onClick={handleSaveRule}>
              {translate("Enregistrer", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

