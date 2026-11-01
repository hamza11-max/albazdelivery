import { BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import type { LabelLayout } from '../../shared/ipc'
import { LAYOUTS, labelsHtml, type LabelData } from './html'

const PX_PER_MM = 96 / 25.4

async function loadHidden(html: string, widthPx: number, heightPx: number, zoom = 1): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    show: false,
    width: Math.ceil(widthPx * zoom),
    height: Math.ceil(heightPx * zoom),
    useContentSize: true,
    enableLargerThanScreen: true,
    frame: false,
    paintWhenInitiallyHidden: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, zoomFactor: zoom },
  })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)')
  return win
}

/** Image of the first page for the on-screen preview; small labels are zoomed so they are readable. */
export async function previewFirstPage(html: string, layout: LabelLayout): Promise<string> {
  const { page } = LAYOUTS[layout]
  const w = page.w * PX_PER_MM
  const h = page.h * PX_PER_MM
  const zoom = Math.min(4, Math.max(1, 560 / w))
  const win = await loadHidden(html, w, h, zoom)
  try {
    await new Promise((r) => setTimeout(r, 250))
    const image = await win.webContents.capturePage({ x: 0, y: 0, width: Math.ceil(w * zoom), height: Math.ceil(h * zoom) }, { stayHidden: true })
    return image.toDataURL()
  } finally {
    win.destroy()
  }
}

/** Prints every page through the Windows driver at the layout's exact page size. */
export async function printLabels(html: string, layout: LabelLayout, deviceName: string): Promise<void> {
  const { page } = LAYOUTS[layout]
  const win = await loadHidden(html, page.w * PX_PER_MM, page.h * PX_PER_MM)
  try {
    await new Promise<void>((resolve, reject) => {
      win.webContents.print(
        {
          silent: true,
          deviceName,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: { width: Math.round(page.w * 1000), height: Math.round(page.h * 1000) },
        },
        (ok, reason) => (ok ? resolve() : reject(new Error(reason || 'Print failed'))),
      )
    })
  } finally {
    win.destroy()
  }
}

/** --selftest: first page of every layout with sample products, as PNG. */
export async function renderLabelSamples(outDir: string): Promise<void> {
  const sample: LabelData[] = [
    { name: 'قميص قطن أبيض', variantLabel: 'L / Blanc', price: 2700, barcode: '2000000000015' },
    { name: 'Baskets sport', variantLabel: '42', price: 6800, barcode: '5901234123457' },
    { name: 'حزام جلد بني', variantLabel: '', price: 1200, barcode: '012345678905' },
    { name: 'Ceinture', variantLabel: '', price: 900, barcode: 'SKU-000123' },
  ]
  for (const layout of Object.keys(LAYOUTS) as LabelLayout[]) {
    const labels = Array.from({ length: 10 }, (_, i) => sample[i % sample.length]!)
    const { html } = labelsHtml(labels, { layout, skip: layout.startsWith('a4') ? 1 : 0, showPrice: true, currency: 'DA' })
    const dataUrl = await previewFirstPage(html, layout)
    const file = path.join(outDir, `labels-${layout}.png`)
    await fs.writeFile(file, Buffer.from(dataUrl.split(',')[1]!, 'base64'))
    console.log(`selftest labels ${layout} -> ${file}`)
  }
}
