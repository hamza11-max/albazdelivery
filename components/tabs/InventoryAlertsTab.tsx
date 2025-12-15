"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Switch } from "@/root/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { Checkbox } from "@/root/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { Bell, Plus, Edit, Trash2, History, AlertTriangle, Mail, MessageSquare, Smartphone } from "lucide-react"
import {
  DEFAULT_ALERT_RULES,
  getAlertRules,
  saveAlertRules,
  getAlertHistory,
  type AlertRule,
  type AlertHistory,
  type AlertChannel,
  type AlertType,
} from "@/utils/inventoryAlertsUtils"
import { useToast } from "@/hooks/use-toast"

interface InventoryAlertsTabProps {
  translate: (fr: string, ar: string) => string
}

const ALERT_TYPE_LABELS: Record<AlertType, { fr: string; ar: string }> = {
  low_stock: { fr: "Stock faible", ar: "مخزون منخفض" },
  out_of_stock: { fr: "Rupture de stock", ar: "نفاد المخزون" },
  expiring_soon: { fr: "Expiration proche", ar: "انتهاء قريب" },
  expired: { fr: "Expiré", ar: "منتهي الصلاحية" },
  high_demand: { fr: "Demande élevée", ar: "طلب مرتفع" },
}

const CHANNEL_LABELS: Record<AlertChannel, { fr: string; ar: string; icon: any }> = {
  email: { fr: "Email", ar: "البريد الإلكتروني", icon: Mail },
  sms: { fr: "SMS", ar: "رسالة نصية", icon: MessageSquare },
  "in-app": { fr: "Dans l'app", ar: "في التطبيق", icon: Bell },
  push: { fr: "Notification push", ar: "إشعار فوري", icon: Smartphone },
}

export function InventoryAlertsTab({ translate }: InventoryAlertsTabProps) {
  const { toast } = useToast()
  const [rules, setRules] = useState<AlertRule[]>(getAlertRules())
  const [history, setHistory] = useState<AlertHistory[]>(getAlertHistory())
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [ruleForm, setRuleForm] = useState<Partial<AlertRule>>({})

  useEffect(() => {
    setHistory(getAlertHistory())
  }, [])

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.type || ruleForm.threshold === undefined) return

    const newRule: AlertRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleForm.name,
      type: ruleForm.type as AlertType,
      enabled: ruleForm.enabled !== undefined ? ruleForm.enabled : true,
      channels: ruleForm.channels || ["in-app"],
      threshold: ruleForm.threshold || 0,
      thresholdUnit: ruleForm.thresholdUnit || "quantity",
      recipients: ruleForm.recipients || [],
      notifyFrequency: ruleForm.notifyFrequency || "immediate",
    }

    let updated: AlertRule[]
    if (editingRule) {
      updated = rules.map((r) => (r.id === editingRule.id ? newRule : r))
    } else {
      updated = [...rules, newRule]
    }

    setRules(updated)
    saveAlertRules(updated)
    setShowRuleDialog(false)
    setEditingRule(null)
    setRuleForm({})

    toast({
      title: translate("Règle enregistrée", "تم حفظ القاعدة"),
      description: translate("La règle d'alerte a été enregistrée", "تم حفظ قاعدة التنبيه"),
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm(translate("Êtes-vous sûr de vouloir supprimer cette règle?", "هل أنت متأكد من حذف هذه القاعدة?"))) {
      const updated = rules.filter((r) => r.id !== ruleId)
      setRules(updated)
      saveAlertRules(updated)
    }
  }

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule)
    setRuleForm(rule)
    setShowRuleDialog(true)
  }

  const handleToggleChannel = (channel: AlertChannel) => {
    const currentChannels = ruleForm.channels || []
    if (currentChannels.includes(channel)) {
      setRuleForm({ ...ruleForm, channels: currentChannels.filter((c) => c !== channel) })
    } else {
      setRuleForm({ ...ruleForm, channels: [...currentChannels, channel] })
    }
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Alertes d'Inventaire", "تنبيهات المخزون")}</h2>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">
            <Bell className="w-4 h-4 mr-2" />
            {translate("Règles", "القواعد")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            {translate("Historique", "السجل")}
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {translate("Règles d'Alerte", "قواعد التنبيه")}
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
                    <TableHead>{translate("Type", "النوع")}</TableHead>
                    <TableHead>{translate("Seuil", "العتبة")}</TableHead>
                    <TableHead>{translate("Canaux", "القنوات")}</TableHead>
                    <TableHead>{translate("Fréquence", "التكرار")}</TableHead>
                    <TableHead>{translate("Statut", "الحالة")}</TableHead>
                    <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {translate(ALERT_TYPE_LABELS[rule.type].fr, ALERT_TYPE_LABELS[rule.type].ar)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.threshold} {rule.thresholdUnit === "quantity" ? "" : rule.thresholdUnit === "percentage" ? "%" : translate("jours", "يوم")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.channels.map((channel) => {
                            const ChannelIcon = CHANNEL_LABELS[channel].icon
                            return (
                              <Badge key={channel} variant="outline" className="text-xs">
                                <ChannelIcon className="w-3 h-3 mr-1" />
                                {translate(CHANNEL_LABELS[channel].fr, CHANNEL_LABELS[channel].ar)}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.notifyFrequency === "immediate"
                          ? translate("Immédiat", "فوري")
                          : rule.notifyFrequency === "daily"
                          ? translate("Quotidien", "يومي")
                          : translate("Hebdomadaire", "أسبوعي")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? translate("Actif", "نشط") : translate("Inactif", "غير نشط")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                {translate("Historique des Alertes", "سجل التنبيهات")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {translate("Aucune alerte envoyée", "لم يتم إرسال أي تنبيهات")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translate("Produit", "المنتج")}</TableHead>
                      <TableHead>{translate("Type", "النوع")}</TableHead>
                      <TableHead>{translate("Message", "الرسالة")}</TableHead>
                      <TableHead>{translate("Canaux", "القنوات")}</TableHead>
                      <TableHead>{translate("Date", "التاريخ")}</TableHead>
                      <TableHead>{translate("Statut", "الحالة")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.productName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {translate(ALERT_TYPE_LABELS[alert.type].fr, ALERT_TYPE_LABELS[alert.type].ar)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {alert.channels.map((channel) => {
                              const ChannelIcon = CHANNEL_LABELS[channel].icon
                              return (
                                <ChannelIcon key={channel} className="w-4 h-4" />
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(alert.sentAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === "sent" ? "default" : alert.status === "failed" ? "destructive" : "secondary"}>
                            {alert.status === "sent"
                              ? translate("Envoyé", "تم الإرسال")
                              : alert.status === "failed"
                              ? translate("Échec", "فشل")
                              : translate("En attente", "في الانتظار")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
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
                placeholder={translate("Ex: Alerte stock faible", "مثال: تنبيه مخزون منخفض")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{translate("Type d'alerte", "نوع التنبيه")} *</Label>
                <Select
                  value={ruleForm.type}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, type: value as AlertType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALERT_TYPE_LABELS).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {translate(labels.fr, labels.ar)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{translate("Seuil", "العتبة")} *</Label>
                <Input
                  type="number"
                  value={ruleForm.threshold || 0}
                  onChange={(e) => setRuleForm({ ...ruleForm, threshold: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{translate("Unité de seuil", "وحدة العتبة")}</Label>
              <Select
                value={ruleForm.thresholdUnit}
                onValueChange={(value) => setRuleForm({ ...ruleForm, thresholdUnit: value as "quantity" | "percentage" | "days" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">{translate("Quantité", "الكمية")}</SelectItem>
                  <SelectItem value="percentage">{translate("Pourcentage", "النسبة المئوية")}</SelectItem>
                  <SelectItem value="days">{translate("Jours", "أيام")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{translate("Canaux de notification", "قنوات الإشعارات")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CHANNEL_LABELS).map(([key, labels]) => {
                  const ChannelIcon = labels.icon
                  const isSelected = (ruleForm.channels || []).includes(key as AlertChannel)
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleChannel(key as AlertChannel)}
                      />
                      <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                        <ChannelIcon className="w-4 h-4" />
                        {translate(labels.fr, labels.ar)}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{translate("Fréquence de notification", "تكرار الإشعارات")}</Label>
              <Select
                value={ruleForm.notifyFrequency}
                onValueChange={(value) => setRuleForm({ ...ruleForm, notifyFrequency: value as "immediate" | "daily" | "weekly" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">{translate("Immédiat", "فوري")}</SelectItem>
                  <SelectItem value="daily">{translate("Quotidien", "يومي")}</SelectItem>
                  <SelectItem value="weekly">{translate("Hebdomadaire", "أسبوعي")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>{translate("Activer", "تفعيل")}</Label>
              <Switch
                checked={ruleForm.enabled !== undefined ? ruleForm.enabled : true}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
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

