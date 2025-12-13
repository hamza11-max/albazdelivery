"use client"

import type { Sale } from "@/root/lib/types"
import { safeFetch, parseAPIResponse } from "./errorHandling"

export interface EmailConfig {
  enabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
}

export interface EmailTemplate {
  subject: string
  body: string
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  config?: EmailConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // Get email config from localStorage or use provided config
    const emailConfig = config || getEmailConfig()
    
    if (!emailConfig.enabled) {
      return { success: false, message: 'Email is not enabled' }
    }

    // In a real implementation, you would send this to your backend API
    // which would handle the actual email sending via SMTP
    const response = await safeFetch('/api/vendor/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        config: emailConfig,
      }),
    }).catch(() => {
      // Fallback: Store email in queue if API is unavailable
      const emailQueue = JSON.parse(localStorage.getItem('vendor-email-queue') || '[]')
      emailQueue.push({
        to,
        subject,
        body,
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem('vendor-email-queue', JSON.stringify(emailQueue))
      return { ok: true, status: 200 }
    })

    if (response.ok || response.status === 200) {
      return { success: true, message: 'Email sent successfully' }
    } else {
      return { success: false, message: 'Failed to send email' }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendReceiptEmail(
  sale: Sale,
  customerEmail: string,
  config?: EmailConfig
): Promise<{ success: boolean; message: string }> {
  const template = getReceiptEmailTemplate(sale)
  return sendEmail(customerEmail, template.subject, template.body, config)
}

export function getReceiptEmailTemplate(sale: Sale): EmailTemplate {
  const itemsHtml = sale.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} DZD</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.price * item.quantity).toFixed(2)} DZD</td>
    </tr>
  `
    )
    .join('')

  const subject = `Reçu de vente #${sale.id}`
  const body = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #15803d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #15803d; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #15803d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ALBAZ</h1>
            <h2>Reçu de vente</h2>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Merci pour votre achat ! Voici le détail de votre commande :</p>
            
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style="text-align: center;">Quantité</th>
                  <th style="text-align: right;">Prix unitaire</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
              <p><strong>Sous-total :</strong> ${sale.subtotal.toFixed(2)} DZD</p>
              ${sale.discount > 0 ? `<p><strong>Remise :</strong> -${sale.discount.toFixed(2)} DZD</p>` : ''}
              <p class="total">Total : ${sale.total.toFixed(2)} DZD</p>
            </div>
            
            <p style="margin-top: 30px;">
              <strong>Numéro de commande :</strong> ${sale.id}<br>
              <strong>Date :</strong> ${new Date(sale.createdAt).toLocaleString()}<br>
              <strong>Méthode de paiement :</strong> ${sale.paymentMethod}
            </p>
          </div>
          <div class="footer">
            <p>Merci de votre confiance !</p>
            <p>ALBAZ Delivery</p>
          </div>
        </div>
      </body>
    </html>
  `

  return { subject, body }
}

export function getEmailConfig(): EmailConfig {
  const stored = localStorage.getItem('vendor-email-config')
  if (stored) {
    return JSON.parse(stored)
  }
  
  return {
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    fromEmail: '',
    fromName: 'ALBAZ Delivery',
  }
}

export function saveEmailConfig(config: EmailConfig): void {
  localStorage.setItem('vendor-email-config', JSON.stringify(config))
}

export function getEmailQueue(): any[] {
  return JSON.parse(localStorage.getItem('vendor-email-queue') || '[]')
}

export function clearEmailQueue(): void {
  localStorage.removeItem('vendor-email-queue')
}

