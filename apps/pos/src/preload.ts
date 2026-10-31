import { contextBridge, ipcRenderer } from 'electron'

// Keep in sync with renderer/global.d.ts.
contextBridge.exposeInMainWorld('pos', {
  listPrinters: () => ipcRenderer.invoke('pos:printers'),
  preview: (opts: unknown) => ipcRenderer.invoke('pos:preview', opts),
  savePng: (opts: unknown) => ipcRenderer.invoke('pos:savePng', opts),
  printDriver: (opts: unknown, printer: string) => ipcRenderer.invoke('pos:printDriver', opts, printer),
  printRaster: (opts: unknown, target: unknown, openDrawer: boolean) => ipcRenderer.invoke('pos:printRaster', opts, target, openDrawer),
  openDrawer: (target: unknown) => ipcRenderer.invoke('pos:openDrawer', target),
})
