import { app, BrowserWindow, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { LANGUAGES, type Language } from '../shared/ipc'
import { commitImport, planImport, templateWorkbook, type ImportPlan } from './catalog/import'
import { CatalogRepo } from './catalog/repo'
import { readSpreadsheet } from './catalog/spreadsheet'
import { AppError } from './errors'
import { uuidv7 } from './ids'
import { getSetting, openDatabase, setSetting } from './db/database'
import { appliedMigrations, loadMigrations, migrate } from './db/migrate'
import { registerHandlers } from './ipc'
import { DRAWER_KICK, receiptJob } from './print/escpos'
import { sendRaw } from './print/raw-print'
import { monochrome, monoToImage, printWithDriver, renderAllReceipts, renderReceiptImage } from './print/render'
import { APP_ORIGIN, registerAppScheme, serveAppScheme } from './protocol'

const APP_ROOT = app.getAppPath()
const RAW_PRINT_SCRIPT = path.join(APP_ROOT, 'resources', 'raw-print.ps1')
const RENDERER_DIR = path.join(APP_ROOT, 'dist', 'renderer')
const MIGRATIONS_DIR = path.join(APP_ROOT, 'migrations')

const isSelftest = process.argv.includes('--selftest')
const isSmoketest = process.argv.includes('--smoketest')

registerAppScheme()

function argValue(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
}

async function openAndMigrate(): Promise<{ db: Database.Database; file: string }> {
  const dataDir = argValue('data-dir') ? path.resolve(argValue('data-dir')!) : app.getPath('userData')
  const file = path.join(dataDir, 'pos.db')
  await fs.mkdir(dataDir, { recursive: true })
  const db = openDatabase(file)
  try {
    const result = await migrate(db, loadMigrations(MIGRATIONS_DIR), { backupDir: path.join(dataDir, 'backups') })
    if (result.applied.length > 0) console.log(`[db] migrated ${result.from} -> ${result.to}`, result.backupPath ?? '')
  } catch (err) {
    db.close()
    throw err
  }
  return { db, file }
}

function language(db: Database.Database): Language {
  const stored = getSetting(db, 'ui.lang')
  return (LANGUAGES as readonly string[]).includes(stored ?? '') ? (stored as Language) : 'ar'
}

function wireIpc(db: Database.Database, dbFile: string) {
  const catalog = new CatalogRepo(db)
  /** Parsed imports waiting for "Import": token → plan. One at a time, expires after 30 minutes. */
  const pendingImports = new Map<string, { plan: ImportPlan; expires: number }>()
  const parentWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

  registerHandlers({
    'import:template': async () => {
      const options = { defaultPath: path.join(app.getPath('documents'), 'albaz-produits.xlsx'), filters: [{ name: 'Excel', extensions: ['xlsx'] }] }
      const win = parentWindow()
      const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return null
      await fs.writeFile(result.filePath, await templateWorkbook())
      return { path: result.filePath }
    },
    'import:preview': async () => {
      // Smoke test only: read a given file instead of showing the dialog.
      let file = isSmoketest ? argValue('import-file') : undefined
      if (!file) {
        const options = { properties: ['openFile' as const], filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'csv'] }] }
        const win = parentWindow()
        const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
        if (result.canceled || !result.filePaths[0]) return null
        file = result.filePaths[0]
      }
      const stat = await fs.stat(file)
      if (stat.size > 10 * 1024 * 1024) throw new AppError('FILE_TOO_LARGE', 'File is larger than 10 MB')
      const plan = planImport(await readSpreadsheet(await fs.readFile(file), path.basename(file)), catalog, db)
      const token = uuidv7()
      pendingImports.clear()
      pendingImports.set(token, { plan, expires: Date.now() + 30 * 60_000 })
      return { ...plan.preview, token, fileName: path.basename(file) }
    },
    'import:commit': ({ token }) => {
      const pending = pendingImports.get(token)
      if (!pending || pending.expires < Date.now()) throw new AppError('IMPORT_EXPIRED', 'Choose the file again')
      pendingImports.delete(token)
      return commitImport(pending.plan, catalog, db)
    },
    'catalog:categories': () => catalog.categories(),
    'catalog:saveCategory': (input) => catalog.saveCategory(input),
    'catalog:archiveCategory': ({ id }) => {
      catalog.archiveCategory(id)
      return null
    },
    'catalog:products': (query) => catalog.products(query),
    'catalog:product': ({ id }) => catalog.product(id),
    'catalog:saveProduct': (input) => catalog.saveProduct(input),
    'catalog:archiveProduct': ({ id }) => {
      catalog.archiveProduct(id)
      return null
    },
    'catalog:findByCode': ({ code }) => catalog.findByCode(code),
    'catalog:newBarcode': () => ({ barcode: catalog.newBarcode() }),
    'app:info': () => ({
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      database: {
        path: dbFile,
        schemaVersion: appliedMigrations(db).at(-1)?.version ?? 0,
        migrations: appliedMigrations(db).map((m) => ({ version: m.version, name: m.name, appliedAt: m.applied_at })),
      },
    }),
    'settings:get': () => ({ lang: language(db) }),
    'settings:setLanguage': ({ lang }) => {
      setSetting(db, 'ui.lang', lang)
      return { lang }
    },
    'print:printers': async () => {
      const win = BrowserWindow.getAllWindows()[0]
      const printers = win ? await win.webContents.getPrintersAsync() : []
      return printers.map((p) => ({ name: p.name, displayName: p.displayName || p.name }))
    },
    'print:preview': async (options) => {
      const mono = monochrome(await renderReceiptImage(options))
      return { dataUrl: monoToImage(mono).toDataURL(), width: mono.width, height: mono.height }
    },
    'print:raster': async ({ options, target, openDrawer }) => {
      const job = receiptJob(monochrome(await renderReceiptImage(options)), { openDrawer })
      await sendRaw(target, job, RAW_PRINT_SCRIPT)
      return { bytes: job.length }
    },
    'print:driver': async ({ options, printer }) => {
      await printWithDriver(options, printer)
      return null
    },
    'print:drawer': async ({ target }) => {
      await sendRaw(target, DRAWER_KICK, RAW_PRINT_SCRIPT)
      return null
    },
  })
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: !isSmoketest,
    title: 'AL-baz POS',
    backgroundColor: '#f6f7f9',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      spellcheck: false,
    },
  })
  win.removeMenu()
  void win.loadURL(`${APP_ORIGIN}/index.html`)
  return win
}

/**
 * `--smoketest`: opens the real window hidden, checks the preload bridge and an
 * IPC round trip work, prints the result and exits (0 = ok). Used by CI.
 */
async function smoketest(win: BrowserWindow) {
  await new Promise<void>((resolve) => win.webContents.once('did-finish-load', () => resolve()))
  const result = await win.webContents.executeJavaScript(`
    (async () => {
      const bridge = typeof window.pos?.invoke === 'function'
      const info = bridge ? await window.pos.invoke('app:info') : null
      const bad = bridge ? await window.pos.invoke('settings:setLanguage', { lang: 'xx' }) : null
      const root = document.getElementById('root')?.childElementCount ?? 0
      // Catalog round trip through the real bridge, with a barcode unique to this run.
      const barcode = (await window.pos.invoke('catalog:newBarcode')).data.barcode
      const saved = await window.pos.invoke('catalog:saveProduct', {
        name: 'قميص أبيض', nameAlt: 'Chemise blanche', costPrice: 1200, salePrice: 2500,
        option1Name: 'Taille', variants: [{ option1Value: 'M', barcode }, { option1Value: 'L' }],
      })
      const found = await window.pos.invoke('catalog:products', { query: 'ابيض' })
      const byCode = await window.pos.invoke('catalog:findByCode', { code: barcode })
      const dup = await window.pos.invoke('catalog:saveProduct', { name: 'X', costPrice: 0, salePrice: 100, variants: [{ barcode }] })
      const catalog = saved.ok && found.ok && found.data.rows.some((r) => r.id === saved.data.id)
        && byCode.ok && byCode.data?.product.id === saved.data.id && !dup.ok && dup.error.code === 'DUPLICATE_BARCODE'
      // Import round trip (only with --import-file; otherwise a file dialog would open).
      let imported = null
      if (${JSON.stringify(Boolean(argValue('import-file')))}) {
        const preview = await window.pos.invoke('import:preview')
        const commit = preview.ok && preview.data.errorCount === 0 ? await window.pos.invoke('import:commit', { token: preview.data.token }) : preview
        const jean = await window.pos.invoke('catalog:products', { query: 'jean slim' })
        imported = commit.ok && jean.ok && jean.data.rows.length > 0 ? commit.data : { error: commit.error ?? preview.data?.errors }
      }
      return { bridge, info, badCode: bad?.ok === false ? bad.error.code : null, rendered: root > 0, dir: document.documentElement.dir, catalog, imported }
    })()
  `)
  console.log('smoketest', JSON.stringify({ ...result, info: result.info?.ok }))
  const shot = argValue('screenshot')
  if (shot) {
    const capture = async (file: string) => {
      await new Promise((r) => setTimeout(r, 400))
      const image = await win.webContents.capturePage(undefined, { stayHidden: true })
      await fs.writeFile(path.resolve(file), image.toPNG())
    }
    await capture(shot)
    // Products list, then the editor for the first product.
    await win.webContents.executeJavaScript(`document.querySelectorAll('.rail-item')[2]?.click()`)
    await capture(shot.replace(/\.png$/, '-products.png'))
    await win.webContents.executeJavaScript(`document.querySelector('.grid tbody tr')?.click()`)
    await capture(shot.replace(/\.png$/, '-editor.png'))
    if (argValue('import-file')) {
      await win.webContents.executeJavaScript(`document.querySelector('.drawer-head button')?.click()`)
      await win.webContents.executeJavaScript(`[...document.querySelectorAll('.toolbar button')].find((b) => !b.classList.contains('primary'))?.click()`)
      await win.webContents.executeJavaScript(`document.querySelector('.drawer .buttons .primary')?.click()`)
      await capture(shot.replace(/\.png$/, '-import.png'))
    }
  }
  const importOk = !argValue('import-file') || (result.imported && result.imported.products >= 1)
  const ok = result.bridge && result.info?.ok && result.info.data.database.schemaVersion >= 2 && result.badCode === 'INVALID_INPUT' && result.rendered && result.catalog && importOk
  app.exit(ok ? 0 : 1)
}

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event) => event.preventDefault())
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
})

app.whenReady().then(async () => {
  if (isSelftest) {
    try {
      await renderAllReceipts(path.resolve(argValue('out') ?? path.join(app.getPath('userData'), 'selftest')))
      app.quit()
    } catch (err) {
      console.error('selftest failed:', err)
      // app.quit() would exit 0; CI needs a failing exit code.
      app.exit(1)
    }
    return
  }

  let opened: Awaited<ReturnType<typeof openAndMigrate>>
  try {
    opened = await openAndMigrate()
  } catch (err) {
    console.error('[db] cannot open database', err)
    if (!isSmoketest) dialog.showErrorBox('AL-baz POS', `The local database could not be opened.\n\n${err instanceof Error ? err.message : String(err)}`)
    app.exit(1)
    return
  }

  serveAppScheme(RENDERER_DIR)
  wireIpc(opened.db, opened.file)
  const win = createMainWindow()
  app.on('before-quit', () => opened.db.close())
  if (isSmoketest) void smoketest(win)
})

// Hidden receipt windows open and close during rendering; in selftest mode that
// must not quit the app (selftest quits itself when done).
app.on('window-all-closed', () => {
  if (!isSelftest) app.quit()
})
