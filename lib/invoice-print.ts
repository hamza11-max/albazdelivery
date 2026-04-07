/**
 * Invoice print / “Save as PDF” via system dialog.
 * Works in browser and Electron, online or offline — without mutating the host document
 * (no `document.body.innerHTML` swap, no `location.reload()`).
 */

export const INVOICE_PRINT_STYLES = `* { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 1cm; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; background: white; }
      .print-hidden { display: none !important; }
      #invoice-content { width: 100%; max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }
      table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
      th, td { padding: 6px; text-align: left; }
      tr { page-break-inside: avoid; }`

function escapeHtmlTitle(title: string): string {
  return title.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

const VENDOR_PRINTER_INVOICE_KEY = "vendor-printer-invoice"

export function printInvoiceHtml(htmlContent: string, title: string): void {
  if (typeof document === "undefined" || typeof window === "undefined") return

  const safeTitle = escapeHtmlTitle(title)
  const fullDoc =
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>" +
    safeTitle +
    "</title><style>" +
    INVOICE_PRINT_STYLES +
    "</style></head><body>" +
    htmlContent +
    "</body></html>"

  const electronApi = (window as unknown as { electronAPI?: { print?: { printHtml?: (opts: unknown) => Promise<{ success?: boolean; error?: string }> } } })
    .electronAPI
  if (electronApi?.print?.printHtml) {
    const deviceName = (typeof localStorage !== "undefined" ? localStorage.getItem(VENDOR_PRINTER_INVOICE_KEY) : "")?.trim() || ""
    void electronApi.print
      .printHtml({
        html: fullDoc,
        deviceName: deviceName || undefined,
        silent: !!deviceName,
        widthMicrons: 210000,
        heightMicrons: 297000,
      })
      .then((res) => {
        if (res && res.success === false && res.error) {
          console.warn("[invoice-print] Electron printHtml:", res.error)
        }
      })
      .catch((e) => console.warn("[invoice-print] Electron printHtml failed", e))
    return
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer")
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(fullDoc)
    printWindow.document.close()
    const trigger = () => {
      try {
        printWindow.focus()
        printWindow.print()
      } catch (e) {
        console.warn("[invoice-print] child window print failed", e)
      }
    }
    printWindow.onload = () => setTimeout(trigger, 100)
    setTimeout(trigger, 400)
    return
  }

  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    return
  }

  doc.open()
  doc.write(fullDoc)
  doc.close()

  const removeFrame = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
  }

  let removed = false
  const safeRemove = () => {
    if (removed) return
    removed = true
    removeFrame()
  }

  win.addEventListener("afterprint", safeRemove, { once: true })
  setTimeout(safeRemove, 180000)

  setTimeout(() => {
    try {
      win.focus()
      win.print()
    } catch (e) {
      console.warn("[invoice-print] iframe print failed", e)
      safeRemove()
    }
  }, 50)
}
