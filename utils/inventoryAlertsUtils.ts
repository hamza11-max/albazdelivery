"use client"

export type AlertChannel = "email" | "sms" | "in-app" | "push"

export type AlertType = "low_stock" | "out_of_stock" | "expiring_soon" | "expired" | "high_demand"

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  enabled: boolean
  channels: AlertChannel[]
  threshold: number
  thresholdUnit: "quantity" | "percentage" | "days"
  recipients: string[]
  notifyFrequency: "immediate" | "daily" | "weekly"
  lastNotified?: string
}

export interface AlertHistory {
  id: string
  ruleId: string
  productId: string
  productName: string
  type: AlertType
  message: string
  channels: AlertChannel[]
  sentAt: string
  status: "sent" | "failed" | "pending"
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "low-stock-default",
    name: "Stock faible",
    type: "low_stock",
    enabled: true,
    channels: ["in-app", "email"],
    threshold: 10,
    thresholdUnit: "quantity",
    recipients: [],
    notifyFrequency: "immediate",
  },
  {
    id: "out-of-stock-default",
    name: "Rupture de stock",
    type: "out_of_stock",
    enabled: true,
    channels: ["in-app", "email"],
    threshold: 0,
    thresholdUnit: "quantity",
    recipients: [],
    notifyFrequency: "immediate",
  },
  {
    id: "expiring-soon-default",
    name: "Expiration proche",
    type: "expiring_soon",
    enabled: false,
    channels: ["in-app"],
    threshold: 7,
    thresholdUnit: "days",
    recipients: [],
    notifyFrequency: "daily",
  },
]

export function getAlertRules(): AlertRule[] {
  const stored = localStorage.getItem('vendor-alert-rules')
  return stored ? JSON.parse(stored) : DEFAULT_ALERT_RULES
}

export function saveAlertRules(rules: AlertRule[]): void {
  localStorage.setItem('vendor-alert-rules', JSON.stringify(rules))
}

export function getAlertHistory(): AlertHistory[] {
  const stored = localStorage.getItem('vendor-alert-history')
  return stored ? JSON.parse(stored) : []
}

export function addAlertHistory(alert: Omit<AlertHistory, 'id' | 'sentAt'>): void {
  const history = getAlertHistory()
  const newAlert: AlertHistory = {
    ...alert,
    id: `alert-${Date.now()}`,
    sentAt: new Date().toISOString(),
  }
  history.unshift(newAlert)
  // Keep only last 100 alerts
  if (history.length > 100) {
    history.pop()
  }
  localStorage.setItem('vendor-alert-history', JSON.stringify(history))
}

export function checkLowStockAlert(product: any, rule: AlertRule): boolean {
  if (!rule.enabled || rule.type !== "low_stock") return false
  if (rule.thresholdUnit === "quantity") {
    return product.stock <= rule.threshold && product.stock > 0
  } else if (rule.thresholdUnit === "percentage") {
    const percentage = (product.stock / (product.maxStock || 100)) * 100
    return percentage <= rule.threshold
  }
  return false
}

export function checkOutOfStockAlert(product: any, rule: AlertRule): boolean {
  if (!rule.enabled || rule.type !== "out_of_stock") return false
  return product.stock === 0
}

export function checkExpiringSoonAlert(product: any, rule: AlertRule): boolean {
  if (!rule.enabled || rule.type !== "expiring_soon" || !product.expiryDate) return false
  const expiryDate = new Date(product.expiryDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= rule.threshold && daysUntilExpiry > 0
}

export function checkExpiredAlert(product: any, rule: AlertRule): boolean {
  if (!rule.enabled || rule.type !== "expired" || !product.expiryDate) return false
  const expiryDate = new Date(product.expiryDate)
  const today = new Date()
  return expiryDate < today
}

export function shouldNotify(rule: AlertRule): boolean {
  if (!rule.enabled) return false
  if (rule.notifyFrequency === "immediate") return true
  if (!rule.lastNotified) return true

  const lastNotified = new Date(rule.lastNotified)
  const now = new Date()
  const hoursSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60)

  if (rule.notifyFrequency === "daily") {
    return hoursSinceLastNotification >= 24
  } else if (rule.notifyFrequency === "weekly") {
    return hoursSinceLastNotification >= 168 // 7 days
  }

  return false
}

export function updateRuleLastNotified(ruleId: string): void {
  const rules = getAlertRules()
  const updated = rules.map((r) => {
    if (r.id === ruleId) {
      return { ...r, lastNotified: new Date().toISOString() }
    }
    return r
  })
  saveAlertRules(updated)
}

export function getAlertMessage(product: any, type: AlertType): string {
  switch (type) {
    case "low_stock":
      return `Stock faible pour ${product.name}: ${product.stock} unités restantes`
    case "out_of_stock":
      return `Rupture de stock pour ${product.name}`
    case "expiring_soon":
      const daysUntilExpiry = Math.ceil(
        (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return `${product.name} expire dans ${daysUntilExpiry} jour(s)`
    case "expired":
      return `${product.name} a expiré`
    case "high_demand":
      return `Demande élevée pour ${product.name}`
    default:
      return `Alerte pour ${product.name}`
  }
}

