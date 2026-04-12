/**
 * Raster PDF download from a DOM node (no print dialog).
 * Works in browser and Electron, online or offline.
 */

export function getInvoiceHtmlForPdfExport(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll("[data-invoice-pdf-exclude='true']").forEach((n) => n.remove())
  return clone.innerHTML
}

/** Electron main-process `printToPDF` on isolated HTML (no system print dialog). */
export async function downloadInvoicePdfViaElectron(
  element: HTMLElement,
  filename: string,
  title: string
): Promise<boolean> {
  const api = typeof window !== "undefined" ? (window as { electronAPI?: { invoiceHtmlToPdf?: (p: { html: string; title: string }) => Promise<{ ok?: boolean; data?: ArrayBuffer | Uint8Array }> } }).electronAPI : null
  if (!api?.invoiceHtmlToPdf) return false
  const html = getInvoiceHtmlForPdfExport(element)
  if (!html.trim()) return false
  const res = await api.invoiceHtmlToPdf({ html, title })
  if (!res?.ok || res.data == null) return false
  const raw = res.data
  const bytes =
    raw instanceof Uint8Array
      ? raw
      : raw instanceof ArrayBuffer
        ? new Uint8Array(raw)
        : new Uint8Array(raw as ArrayBuffer)
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

export async function downloadInvoiceAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    ignoreElements: (node) =>
      node instanceof HTMLElement && node.closest("[data-invoice-pdf-exclude='true']") != null,
  })

  const imgData = canvas.toDataURL("image/png", 1.0)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 6
  const imgWidthMm = pageWidth - margin * 2
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width
  const pageContentHeight = pageHeight - margin * 2

  let heightLeft = imgHeightMm
  let position = margin

  pdf.addImage(imgData, "PNG", margin, position, imgWidthMm, imgHeightMm, undefined, "FAST")
  heightLeft -= pageContentHeight

  while (heightLeft > 0) {
    position = margin - (imgHeightMm - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, "PNG", margin, position, imgWidthMm, imgHeightMm, undefined, "FAST")
    heightLeft -= pageContentHeight
  }

  pdf.save(filename)
}
