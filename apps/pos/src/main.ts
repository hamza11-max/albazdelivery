import { app, BrowserWindow, dialog, ipcMain, nativeImage, type NativeImage } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { DRAWER_KICK, PAPER_DOTS, receiptJob, toMonochrome, type PaperWidth } from './escpos'
import { parseRawTarget, sendRaw } from './raw-print'
import { receiptHtml, type ReceiptLang, type ReceiptOptions } from './receipt'

const RAW_PRINT_SCRIPT = path.join(app.getAppPath(), 'resources', 'raw-print.ps1')

const LANGS: readonly ReceiptLang[] = ['ar', 'fr', 'mixed']
const PAPERS: readonly PaperWidth[] = [58, 80]

/** Throws unless `value` is valid receipt options. Renderer input is untrusted. */
function parseOptions(value: unknown): ReceiptOptions {
  const v = value as Record<string, unknown> | null
  const lang = v?.lang as ReceiptLang
  const paper = v?.paper as PaperWidth
  if (!LANGS.includes(lang) || !PAPERS.includes(paper)) throw new Error('Invalid receipt options')
  return { lang, paper }
}

function parsePrinterName(value: unknown): string {
  // eslint-disable-next-line no-control-regex
  if (typeof value === 'string' && value.length > 0 && value.length <= 256 && !/[\u0000-\u001f]/.test(value)) return value
  throw new Error('Invalid printer name')
}

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

/** Renders the receipt exactly as route B prints it: one bitmap, paper width in dots. */
async function renderReceiptImage(opts: ReceiptOptions): Promise<NativeImage> {
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

function monochrome(image: NativeImage) {
  const { width, height } = image.getSize()
  return toMonochrome(image.toBitmap(), width, height)
}

/** Route A: let the Windows driver render the HTML page. */
async function printWithDriver(opts: ReceiptOptions, deviceName: string): Promise<void> {
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

function registerIpc() {
  ipcMain.handle('pos:printers', async (event) => {
    const printers = await event.sender.getPrintersAsync()
    return printers.map((p) => ({ name: p.name, displayName: p.displayName || p.name }))
  })

  ipcMain.handle('pos:preview', async (_e, raw: unknown) => {
    const image = await renderReceiptImage(parseOptions(raw))
    // Preview shows the dithered 1-bit result, i.e. what route B sends to the printer.
    const mono = monochrome(image)
    return { dataUrl: monoToPng(mono).toDataURL(), width: mono.width, height: mono.height }
  })

  ipcMain.handle('pos:savePng', async (event, raw: unknown) => {
    const opts = parseOptions(raw)
    const win = BrowserWindow.fromWebContents(event.sender)
    const defaultPath = path.join(app.getPath('documents'), `albaz-receipt-${opts.lang}-${opts.paper}mm.png`)
    const result = win
      ? await dialog.showSaveDialog(win, { defaultPath, filters: [{ name: 'PNG', extensions: ['png'] }] })
      : await dialog.showSaveDialog({ defaultPath, filters: [{ name: 'PNG', extensions: ['png'] }] })
    if (result.canceled || !result.filePath) return null
    await fs.writeFile(result.filePath, (await renderReceiptImage(opts)).toPNG())
    return result.filePath
  })

  ipcMain.handle('pos:printDriver', async (_e, raw: unknown, printer: unknown) => {
    await printWithDriver(parseOptions(raw), parsePrinterName(printer))
  })

  ipcMain.handle('pos:printRaster', async (_e, raw: unknown, target: unknown, openDrawer: unknown) => {
    const opts = parseOptions(raw)
    const dest = parseRawTarget(target)
    const job = receiptJob(monochrome(await renderReceiptImage(opts)), { openDrawer: openDrawer === true })
    await sendRaw(dest, job, RAW_PRINT_SCRIPT)
    return job.length
  })

  ipcMain.handle('pos:openDrawer', async (_e, target: unknown) => {
    await sendRaw(parseRawTarget(target), DRAWER_KICK, RAW_PRINT_SCRIPT)
  })
}

/** Turns a 1-bit image back into a PNG so the preview shows real printed dots. */
function monoToPng(mono: ReturnType<typeof monochrome>): NativeImage {
  const bgra = Buffer.alloc(mono.width * mono.height * 4, 0xff)
  for (let y = 0; y < mono.height; y++) {
    for (let x = 0; x < mono.width; x++) {
      if (mono.data[y * mono.bytesPerRow + (x >> 3)]! & (0x80 >> (x & 7))) bgra.fill(0, (y * mono.width + x) * 4, (y * mono.width + x) * 4 + 3)
    }
  }
  return nativeImage.createFromBitmap(bgra, { width: mono.width, height: mono.height })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    title: 'AL-baz POS - print test',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
    },
  })
  win.removeMenu()
  void win.loadFile(path.join(app.getAppPath(), 'renderer', 'index.html'))
}

/** `electron . --selftest [--out=<dir>]`: renders every variant to PNG + .bin and exits. */
async function selftest() {
  const outArg = process.argv.find((a) => a.startsWith('--out='))
  const outDir = outArg ? path.resolve(outArg.slice('--out='.length)) : path.join(app.getPath('userData'), 'selftest')
  await fs.mkdir(outDir, { recursive: true })
  for (const paper of PAPERS) {
    for (const lang of LANGS) {
      const image = await renderReceiptImage({ lang, paper })
      const mono = monochrome(image)
      const base = path.join(outDir, `receipt-${lang}-${paper}mm`)
      await fs.writeFile(`${base}.png`, image.toPNG())
      await fs.writeFile(`${base}-mono.png`, monoToPng(mono).toPNG())
      await fs.writeFile(`${base}.bin`, receiptJob(mono, { openDrawer: true }))
      console.log(`selftest ${lang} ${paper}mm: ${mono.width}x${mono.height} -> ${base}.png`)
    }
  }
}

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event) => event.preventDefault())
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
})

const isSelftest = process.argv.includes('--selftest')

app.whenReady().then(async () => {
  if (isSelftest) {
    try {
      await selftest()
      app.quit()
    } catch (err) {
      console.error('selftest failed:', err)
      // app.quit() would exit 0; CI needs a failing exit code.
      app.exit(1)
    }
    return
  }
  registerIpc()
  createWindow()
})

// Hidden receipt windows open and close during rendering; in selftest mode that
// must not quit the app (selftest quits itself when done).
app.on('window-all-closed', () => {
  if (!isSelftest) app.quit()
})
