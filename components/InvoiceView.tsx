"use client"

import { useEffect } from "react"
import { Printer, X, Download } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import type { Sale } from "@/root/lib/types"

interface InvoiceViewProps {
  showInvoice: boolean
  sale: Sale | null
  user: any
  translate: (fr: string, ar: string) => string
  shopInfo?: {
    name?: string
    phone?: string
    email?: string
    address?: string
    logo?: string
  }
  customerInfo?: {
    name?: string
    address?: string
  }
  onClose: () => void
}

export function InvoiceView({
  showInvoice,
  sale,
  user,
  translate,
  shopInfo,
  customerInfo,
  onClose,
}: InvoiceViewProps) {
  if (!showInvoice || !sale) return null

  const userWithExtras = user as any
  const displayName = shopInfo?.name || user?.name || "ALBAZ"
  const displayPhone = shopInfo?.phone || userWithExtras?.phone || ""
  const displayEmail = shopInfo?.email || user?.email || ""
  const displayAddress = shopInfo?.address || userWithExtras?.address || ""
  const displayLogo = shopInfo?.logo

  // Calculate VAT (assuming 20% VAT rate, adjust as needed)
  const vatRate = 0.20
  const totalHT = sale.subtotal - sale.discount
  const tva = totalHT * vatRate
  const totalTTC = totalHT + tva

  // Format date
  const invoiceDate = new Date(sale.createdAt)
  const formattedDate = invoiceDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })

  // Calculate due date (17 days from invoice date)
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + 17)
  const formattedDueDate = dueDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })

  // Invoice number (using sale ID)
  const invoiceNumber = sale.id.slice(-6)

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('invoice-content')
      if (!element) return

      const slashRegex = new RegExp('/', 'g')
      const dateStr = formattedDate.replace(slashRegex, '-')
      const filename = 'Facture_' + invoiceNumber + '_' + dateStr + '.pdf'

      // Check if we're in Electron and use printToPDF API
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI
      
      if (isElectron && (window as any).electronAPI?.printToPDF) {
        try {
          // Use Electron's printToPDF API
          const pdfData = await (window as any).electronAPI.printToPDF({
            margins: {
              marginType: 'custom',
              top: 0.4,
              bottom: 0.4,
              left: 0.4,
              right: 0.4
            },
            pageSize: 'A4',
            printBackground: true
          })
          
          // Create blob and download
          const blob = new Blob([pdfData], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          return
        } catch (electronError) {
          console.warn('Electron PDF generation failed, falling back to print:', electronError)
        }
      }

      // Fallback: Use browser print dialog with PDF option
      // Open print dialog - user can select "Save as PDF"
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        // If popup blocked, use current window
        handlePrint()
        return
      }

      const htmlContent = element.innerHTML
      const title = 'Facture - ' + invoiceNumber
      
      printWindow.document.write('<!DOCTYPE html>')
      printWindow.document.write('<html>')
      printWindow.document.write('<head>')
      printWindow.document.write('<title>' + title + '</title>')
      printWindow.document.write('<style>')
      printWindow.document.write('@page { size: A4; margin: 1cm; }')
      printWindow.document.write('body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; }')
      printWindow.document.write('.print-hidden { display: none !important; }')
      printWindow.document.write('#invoice-content { max-width: 100%; margin: 0; padding: 20px; }')
      printWindow.document.write('table { width: 100%; border-collapse: collapse; }')
      printWindow.document.write('th, td { padding: 8px; text-align: left; }')
      printWindow.document.write('</style>')
      printWindow.document.write('</head>')
      printWindow.document.write('<body>')
      printWindow.document.write(htmlContent)
      printWindow.document.write('</body>')
      printWindow.document.write('</html>')
      printWindow.document.close()
      
      // Show instruction message
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        // Note: User needs to select "Save as PDF" in the print dialog
      }, 250)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Final fallback: use print function
      handlePrint()
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-content")
    if (!printContent) return

    // Clone the content for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      // If popup blocked, use current window
      const originalContent = document.body.innerHTML
      document.body.innerHTML = printContent.innerHTML
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
      return
    }

    const htmlContent = printContent.innerHTML
    const title = 'Facture - ' + invoiceNumber
    
    // Write complete HTML with proper A4 styling
    printWindow.document.open()
    printWindow.document.write('<!DOCTYPE html>')
    printWindow.document.write('<html>')
    printWindow.document.write('<head>')
    printWindow.document.write('<meta charset="UTF-8">')
    printWindow.document.write('<title>' + title + '</title>')
    printWindow.document.write('<style>')
    printWindow.document.write('* { margin: 0; padding: 0; box-sizing: border-box; }')
    printWindow.document.write('@page { size: A4; margin: 1cm; }')
    printWindow.document.write('body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; background: white; }')
    printWindow.document.write('.print-hidden { display: none !important; }')
    printWindow.document.write('#invoice-content { width: 100%; max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }')
    printWindow.document.write('table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }')
    printWindow.document.write('th, td { padding: 6px; text-align: left; }')
    printWindow.document.write('tr { page-break-inside: avoid; }')
    printWindow.document.write('</style>')
    printWindow.document.write('</head>')
    printWindow.document.write('<body>')
    printWindow.document.write(htmlContent)
    printWindow.document.write('</body>')
    printWindow.document.write('</html>')
    printWindow.document.close()
    
    // Wait for content to load, then open print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print() // Opens system print dialog with printer selection
      }, 100)
    }
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus()
        printWindow.print()
      }
    }, 500)
  }

  useEffect(() => {
    // Add print styles for A4 format
    const style = document.createElement('style')
    const cssRules = [
      '@media print {',
      '  @page {',
      '    size: A4;',
      '    margin: 1cm;',
      '  }',
      '  body {',
      '    margin: 0;',
      '    padding: 0;',
      '  }',
      '  body * { visibility: hidden; }',
      '  #invoice-content, #invoice-content * { visibility: visible; }',
      '  #invoice-content {',
      '    position: absolute;',
      '    left: 0;',
      '    top: 0;',
      '    width: 100%;',
      '    max-width: 210mm;',
      '    margin: 0;',
      '    padding: 15mm;',
      '    box-shadow: none;',
      '    background: white;',
      '    page-break-after: avoid;',
      '  }',
      '  .print-hidden { display: none !important; }',
      '  table { page-break-inside: avoid; }',
      '  tr { page-break-inside: avoid; }',
      '}'
    ]
    style.textContent = cssRules.join('\n')
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-lg shadow-xl max-w-[210mm] w-full my-8" id="invoice-content" style={{ minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
          {/* Header - FACTURE on left, ALBAZ logo on right */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-6xl font-bold text-black mb-0 tracking-tight" style={{ fontSize: '48px', lineHeight: '1' }}>FACTURE</h1>
            </div>
            <div className="flex items-center gap-2">
              {displayLogo ? (
                <img src={displayLogo} alt="Logo" className="h-14 w-auto" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">ALBAZ</span>
                </div>
              )}
            </div>
          </div>

          {/* Green line separator - thicker */}
          <div className="h-1 bg-green-600 mb-4" style={{ backgroundColor: '#16a34a', height: '2px' }}></div>

          {/* Sender and Recipient Information */}
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>
              <p className="font-bold text-black mb-2 text-sm">FACTURE à</p>
              <p className="text-green-600 font-semibold mb-1 text-sm" style={{ color: '#16a34a' }}>
                {customerInfo?.name || translate("Client", "العميل")}
              </p>
              <p className="text-black text-xs">
                {customerInfo?.address || translate("Adresse", "العنوان")}
              </p>
            </div>
            <div>
              <p className="font-bold text-black mb-2 text-sm">ENVOYER à</p>
              <p className="text-green-600 font-semibold mb-1 text-sm" style={{ color: '#16a34a' }}>{displayName}</p>
              <p className="text-black text-xs">{displayAddress}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full border-collapse" style={{ borderSpacing: 0, width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#15803d' }}>
                  <th className="p-3 text-left font-semibold text-sm text-white" style={{ backgroundColor: '#15803d', color: 'white' }}>QTE</th>
                  <th className="p-3 text-left font-semibold text-sm text-white" style={{ backgroundColor: '#15803d', color: 'white' }}>DESIGNATION</th>
                  <th className="p-3 text-right font-semibold text-sm text-white" style={{ backgroundColor: '#15803d', color: 'white' }}>PRIX UNIT HT</th>
                  <th className="p-3 text-right font-semibold text-sm text-white" style={{ backgroundColor: '#15803d', color: 'white' }}>MONTANT HT</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => {
                  const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
                  const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 0
                  const amountHT = price * quantity
                  const isEven = index % 2 === 0
                  
                  return (
                    <tr key={index} style={{ backgroundColor: isEven ? '#dcfce7' : '#ffffff' }}>
                      <td className="p-3 text-black text-sm">{quantity}</td>
                      <td className="p-3 text-black text-sm">{item.productName}</td>
                      <td className="p-3 text-right text-black text-sm">{formatNumber(price)} {translate("DZD", "دج")}</td>
                      <td className="p-3 text-right text-black font-semibold text-sm">{formatNumber(amountHT)} {translate("DZD", "دج")}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Summary and Notes */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-1/2 pr-4">
              <p className="text-black text-sm">
                <span className="font-semibold">NB :</span> ...........................................................................................................................................
              </p>
            </div>
            <div className="w-1/2">
              <table className="w-full border-collapse" style={{ borderSpacing: 0, width: '100%' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#dcfce7' }}>
                    <td className="p-3 text-left font-semibold text-black text-sm">TOTAL HT</td>
                    <td className="p-3 text-right font-semibold text-black text-sm">{formatNumber(totalHT)} {translate("DZD", "دج")}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <td className="p-3 text-left font-semibold text-black text-sm">TVA</td>
                    <td className="p-3 text-right font-semibold text-black text-sm">{formatNumber(tva)} {translate("DZD", "دج")}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#15803d' }}>
                    <td className="p-3 text-left font-bold text-sm text-white">TOTAL TTC</td>
                    <td className="p-3 text-right font-bold text-sm text-white">{formatNumber(totalTTC)} {translate("DZD", "دج")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Green line separator - thicker */}
          <div className="h-1 bg-green-600 mb-4" style={{ backgroundColor: '#16a34a', height: '2px' }}></div>

          {/* Contact and Invoice Details */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-bold text-black mb-2 text-sm">CONTACT</p>
              {displayPhone && (
                <p className="text-black text-xs">TEL : {displayPhone}</p>
              )}
              {displayEmail && (
                <p className="text-black text-xs">EMAIL : {displayEmail}</p>
              )}
              <p className="text-black text-xs">SITE : al-baz.app</p>
            </div>
            <div>
              <div className="space-y-1">
                <p className="text-black text-xs">
                  <span className="font-semibold">DATE</span>: {formattedDate}
                </p>
                <p className="text-black text-xs">
                  <span className="font-semibold">FACTURE N°</span>: {invoiceNumber}
                </p>
                <p className="text-black text-xs">
                  <span className="font-semibold">COMMANDE</span>: {sale.id.slice(0, 8)}
                </p>
                <p className="text-black text-xs">
                  <span className="font-semibold">ECHEANCE</span>: {formattedDueDate}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3 print:hidden">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {translate("Fermer", "إغلاق")}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {translate("Télécharger PDF", "تحميل PDF")}
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              {translate("Imprimer A4", "طباعة A4")}
            </Button>
          </div>
        </div>
      </div>
  )
}

