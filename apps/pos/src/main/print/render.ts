import { BrowserWindow, nativeImage, type NativeImage } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { PAPER_DOTS, receiptJob, toMonochrome, type MonoImage, type PaperWidth } from './escpos'
import { receiptHtml, type ReceiptLang, type ReceiptOptions } from './receipt'

function htmlUrl(html: string): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

/** Loads receipt HTML in a hidden window sized to the paper and returns it with its content height. */
async function loadReceiptWindow(opts: ReceiptOptions) {
  const width = PAPER_DOTS[opts.paper]
  const win = new BrowserWindow({
    show: false,
    width,
    height: 400,
    useContentSize: true,
    enableLargerThanScreen: true,
    frame: false,
    paintWhenInitiallyHidden: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  })
  await win.loadURL(htmlUrl(receiptHtml(opts)))
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)')
  const height = Number(await win.webContents.executeJavaScript('Math.ceil(document.documentElement.scrollHeight)'))
  return { win, width, height }
}

/** Renders the receipt exactly as the raster route prints it: one bitmap, paper width in dots. */
export async function renderReceiptImage(opts: ReceiptOptions): Promise<NativeImage> {
  const { win, width, height } = await loadReceiptWindow(opts)
  try {
    win.setContentSize(width, height)
    // Let the compositor paint at the new size before capturing.
    await new Promise((r) => setTimeout(r, 250))
    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height }, { stayHidden: true })
    if (image.isEmpty()) throw new Error('Receipt capture returned an empty image')
    const size = image.getSize()
    // Capture is scaled by the display's DPI (e.g. 125%); printers need exact dots.
    return size.width === width ? image : image.resize({ width, quality: 'best' })
  } finally {
    win.destroy()
  }
}

export function monochrome(image: NativeImage): MonoImage {
  const { width, height } = image.getSize()
  return toMonochrome(image.toBitmap(), width, height)
}

/** Turns a 1-bit image back into an image so previews show the real printed dots. */
export function monoToImage(mono: MonoImage): NativeImage {
  const bgra = Buffer.alloc(mono.width * mono.height * 4, 0xff)
  for (let y = 0; y < mono.height; y++) {
    for (let x = 0; x < mono.width; x++) {
      if (mono.data[y * mono.bytesPerRow + (x >> 3)]! & (0x80 >> (x & 7))) {
        bgra.fill(0, (y * mono.width + x) * 4, (y * mono.width + x) * 4 + 3)
      }
    }
  }
  return nativeImage.createFromBitmap(bgra, { width: mono.width, height: mono.height })
}

/** Driver route: let the Windows driver render the HTML page. */
export async function printWithDriver(opts: ReceiptOptions, deviceName: string): Promise<void> {
  const { win, width, height } = await loadReceiptWindow(opts)
  try {
    const microns = opts.paper * 1000
    await new Promise<void>((resolve, reject) => {
      win.webContents.print(
        {
          silent: true,
          deviceName,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: { width: microns, height: Math.ceil((height / width) * microns) + 5000 },
        },
        (ok, reason) => (ok ? resolve() : reject(new Error(reason || 'Print failed'))),
      )
    })
  } finally {
    win.destroy()
  }
}

const LANGS: readonly ReceiptLang[] = ['ar', 'fr', 'mixed']
const PAPERS: readonly PaperWidth[] = [58, 80]

/** Renders every receipt variant to `<outDir>/receipt-<lang>-<paper>mm{.png,-mono.png,.bin}`. */
export async function renderAllReceipts(outDir: string): Promise<void> {
  await fs.mkdir(outDir, { recursive: true })
  for (const paper of PAPERS) {
    for (const lang of LANGS) {
      const image = await renderReceiptImage({ lang, paper })
      const mono = monochrome(image)
      const base = path.join(outDir, `receipt-${lang}-${paper}mm`)
      await fs.writeFile(`${base}.png`, image.toPNG())
      await fs.writeFile(`${base}-mono.png`, monoToImage(mono).toPNG())
      await fs.writeFile(`${base}.bin`, receiptJob(mono, { openDrawer: true }))
      console.log(`selftest ${lang} ${paper}mm: ${mono.width}x${mono.height} -> ${base}.png`)
    }
  }
}
