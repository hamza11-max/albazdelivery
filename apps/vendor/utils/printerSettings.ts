/** localStorage keys for Electron printer routing */
export const VENDOR_PRINTER_POS_KEY = "vendor-printer-pos-receipt"
export const VENDOR_PRINTER_LABEL_KEY = "vendor-printer-label"
export const VENDOR_PRINTER_INVOICE_KEY = "vendor-printer-invoice"

export function getVendorPrinterDevice(storageKey: string): string {
  if (typeof localStorage === "undefined") return ""
  return (localStorage.getItem(storageKey) || "").trim()
}
