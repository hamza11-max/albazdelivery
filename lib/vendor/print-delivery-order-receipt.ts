"use client"

import { printInvoiceHtml } from "@/root/lib/invoice-print"

export type ShopInfoForReceipt = {
  name?: string
  phone?: string
  email?: string
  address?: string
  logo?: string
}

function paymentMethodForReceipt(m: string | undefined): "cash" | "card" {
  const u = (m || "CASH").toUpperCase()
  if (u === "CARD" || u === "WALLET") return "card"
  return "cash"
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function buildReceiptHtml(
  order: any,
  shop: ShopInfoForReceipt,
  translate: (fr: string, ar: string) => string,
): string {
  const storeName = shop.name || "Store"
  const rows = (order.items || [])
    .map((item: any) => {
      const name = item.product?.name || item.productName || "Item"
      const qty = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      return `<tr><td>${escapeHtml(name)}</td><td>${qty}</td><td>${price.toFixed(2)}</td><td>${(qty * price).toFixed(2)}</td></tr>`
    })
    .join("")
  const cust = order.customer
  const custName = cust?.name || ""
  const phone = order.customerPhone || cust?.phone || ""
  return `
    <div id="invoice-content">
      <h1>${escapeHtml(storeName)}</h1>
      <p>${translate("Bon de commande (livraison)", "إيصال طلب توصيل")}</p>
      <p><strong>${translate("Commande", "طلب")}</strong> #${escapeHtml(String(order.id).slice(0, 8))}</p>
      <p>${translate("Client", "العميل")}: ${escapeHtml(custName)} — ${escapeHtml(phone)}</p>
      <p>${translate("Adresse", "العنوان")}: ${escapeHtml(order.deliveryAddress || "")}</p>
      <table>
        <thead>
          <tr>
            <th>${translate("Article", "صنف")}</th>
            <th>${translate("Qté", "الكمية")}</th>
            <th>${translate("P.U.", "س.و")}</th>
            <th>${translate("Total", "المجموع")}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p><strong>${translate("Total", "المجموع")}:</strong> ${Number(order.total || 0).toFixed(2)} ${translate("DZD", "دج")}</p>
    </div>
  `
}

export async function printDeliveryOrderReceipt(options: {
  order: any
  shopInfo: ShopInfoForReceipt
  effectiveUser: { name?: string; email?: string; phone?: string; address?: string } | null
  isElectronRuntime: boolean
  translate: (fr: string, ar: string) => string
}): Promise<void> {
  const { order, shopInfo, effectiveUser, isElectronRuntime, translate } = options
  const userWithExtras = effectiveUser as Record<string, unknown> | null
  const items = (order.items || []).map((item: any) => ({
    name: item.product?.name || item.productName || "Item",
    quantity: item.quantity,
    price: item.price,
  }))
  const electronAPI = typeof window !== "undefined" ? (window as any).electronAPI : undefined
  if (isElectronRuntime && electronAPI?.print?.receipt) {
    try {
      const receiptData = {
        storeName: shopInfo.name || effectiveUser?.name || "AlBaz Store",
        items,
        subtotal: order.subtotal,
        discount: 0,
        tax: 0,
        total: order.total,
        paymentMethod: paymentMethodForReceipt(order.paymentMethod),
        orderNumber: String(order.id).slice(0, 8),
        date: new Date(order.createdAt).toLocaleString(),
        shopAddress: shopInfo.address || String(userWithExtras?.address || ""),
        shopPhone: shopInfo.phone || String(userWithExtras?.phone || ""),
        shopEmail: shopInfo.email || effectiveUser?.email || "",
        shopCity: order.city || "",
        logo: shopInfo.logo,
      }
      await electronAPI.print.receipt(receiptData)
      return
    } catch (e) {
      console.error("[printDeliveryOrderReceipt] electron print failed", e)
    }
  }
  const html = buildReceiptHtml(order, shopInfo, translate)
  printInvoiceHtml(html, `Order-${String(order.id).slice(0, 8)}`)
}
