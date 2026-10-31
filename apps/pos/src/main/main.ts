import { app, BrowserWindow, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { LANGUAGES, type Language } from '../shared/ipc'
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
  registerHandlers({
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
      return { bridge, info, badCode: bad?.ok === false ? bad.error.code : null, rendered: root > 0, dir: document.documentElement.dir }
    })()
  `)
  console.log('smoketest', JSON.stringify(result))
  const shot = argValue('screenshot')
  if (shot) {
    await new Promise((r) => setTimeout(r, 300))
    const image = await win.webContents.capturePage(undefined, { stayHidden: true })
    await fs.writeFile(path.resolve(shot), image.toPNG())
  }
  const ok = result.bridge && result.info?.ok && result.info.data.database.schemaVersion >= 1 && result.badCode === 'INVALID_INPUT' && result.rendered
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
