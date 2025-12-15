"use client"

import type { InventoryProduct } from "@/root/lib/types"
import {
  getAlertRules,
  checkLowStockAlert,
  checkOutOfStockAlert,
  checkExpiringSoonAlert,
  checkExpiredAlert,
  shouldNotify,
  addAlertHistory,
  updateRuleLastNotified,
  getAlertMessage,
  type AlertRule,
} from "./inventoryAlertsUtils"
import { sendEmail } from "./emailUtils"
import { getEmailConfig } from "./emailUtils"

export async function checkProductAlerts(products: InventoryProduct[]): Promise<void> {
  const rules = getAlertRules()
  
  for (const product of products) {
    for (const rule of rules) {
      if (!shouldNotify(rule)) continue

      let shouldAlert = false
      
      switch (rule.type) {
        case "low_stock":
          shouldAlert = checkLowStockAlert(product, rule)
          break
        case "out_of_stock":
          shouldAlert = checkOutOfStockAlert(product, rule)
          break
        case "expiring_soon":
          shouldAlert = checkExpiringSoonAlert(product, rule)
          break
        case "expired":
          shouldAlert = checkExpiredAlert(product, rule)
          break
        default:
          continue
      }

      if (shouldAlert) {
        const message = getAlertMessage(product, rule.type)
        
        // Send alerts through configured channels
        for (const channel of rule.channels) {
          if (channel === "in-app") {
            // In-app alerts are handled by adding to history
            addAlertHistory({
              ruleId: rule.id,
              productId: product.id,
              productName: product.name,
              type: rule.type,
              message,
              channels: [channel],
              status: "sent",
            })
          } else if (channel === "email" && rule.recipients.length > 0) {
            // Send email alerts
            const emailConfig = getEmailConfig()
            if (emailConfig.enabled) {
              try {
                for (const recipient of rule.recipients) {
                  await sendEmail(
                    recipient,
                    `Alerte: ${product.name}`,
                    message,
                    emailConfig
                  )
                }
                addAlertHistory({
                  ruleId: rule.id,
                  productId: product.id,
                  productName: product.name,
                  type: rule.type,
                  message,
                  channels: [channel],
                  status: "sent",
                })
              } catch (error) {
                console.error('[Alerts] Failed to send email alert:', error)
                addAlertHistory({
                  ruleId: rule.id,
                  productId: product.id,
                  productName: product.name,
                  type: rule.type,
                  message,
                  channels: [channel],
                  status: "failed",
                })
              }
            }
          }
          // SMS and push notifications would require additional services
        }

        // Update rule last notified timestamp
        updateRuleLastNotified(rule.id)
      }
    }
  }
}

export function checkLowStockProducts(products: InventoryProduct[]): InventoryProduct[] {
  const rules = getAlertRules()
  const lowStockRule = rules.find((r) => r.type === "low_stock" && r.enabled)
  
  if (!lowStockRule) return []

  return products.filter((product) => checkLowStockAlert(product, lowStockRule))
}

export function checkOutOfStockProducts(products: InventoryProduct[]): InventoryProduct[] {
  const rules = getAlertRules()
  const outOfStockRule = rules.find((r) => r.type === "out_of_stock" && r.enabled)
  
  if (!outOfStockRule) return []

  return products.filter((product) => checkOutOfStockAlert(product, outOfStockRule))
}

