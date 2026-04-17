export const VENDOR_TAB_SHORTCUTS: Record<string, string> = {
  menu: "Ctrl+Shift+M",
  dashboard: "Ctrl+Shift+D",
  pos: "Ctrl+Shift+P",
  inventory: "Ctrl+Shift+I",
  orders: "Ctrl+Shift+O",
  kitchen: "Ctrl+Shift+K",
  "dine-qr": "Ctrl+Shift+Q",
  accounting: "Ctrl+Shift+A",
  sales: "Ctrl+Shift+S",
  reports: "Ctrl+Shift+R",
  coupons: "Ctrl+Shift+C",
  "sync-save": "Ctrl+Shift+Y",
  email: "Ctrl+Shift+E",
  "staff-permissions": "Ctrl+Shift+F",
  "clients-loyalty": "Ctrl+Shift+L",
  drivers: "Ctrl+Shift+V",
  suppliers: "Ctrl+Shift+U",
  ai: "Ctrl+Shift+G",
  rfid: "Ctrl+Shift+T",
  settings: "Ctrl+Shift+N",
}

export function getVendorTabShortcut(tabId: string): string | undefined {
  return VENDOR_TAB_SHORTCUTS[tabId]
}

export function getTabIdForShortcut(event: KeyboardEvent): string | null {
  if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) {
    return null
  }

  const key = event.key.toLowerCase()
  const combo = `Ctrl+Shift+${key.toUpperCase()}`

  for (const [tabId, shortcut] of Object.entries(VENDOR_TAB_SHORTCUTS)) {
    if (shortcut === combo) return tabId
  }

  return null
}
