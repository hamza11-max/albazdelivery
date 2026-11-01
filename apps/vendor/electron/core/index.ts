import { app, BrowserWindow, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { LANGUAGES, type LabelLayout, type Language, type Session, type SessionRole } from '../shared/ipc'
import { AuthService } from './auth/service'
import { commitImport, planImport, templateWorkbook, type ImportPlan } from './catalog/import'
import { adjustStock, archiveFlatItem, flatItems, saveFlatItem } from './catalog/flat'
import { CatalogRepo } from './catalog/repo'
import { readSpreadsheet } from './catalog/spreadsheet'
import { getSetting, openDatabase, setSetting } from './db/database'
import { appliedMigrations, loadMigrations, migrate } from './db/migrate'
import { AppError } from './errors'
import { uuidv7 } from './ids'
import { registerHandlers } from './ipc'
import { labelsHtml, type LabelData } from './labels/html'
import { previewFirstPage, printLabels } from './labels/print'
import { DRAWER_KICK, receiptJob } from './print/escpos'
import { sendRaw } from './print/raw-print'
import { receiptHtml } from './print/receipt'
import { monochrome, monoToImage, printPaperWithDriver, printWithDriver, renderPaperImage, renderReceiptImage } from './print/render'
import { zReportHtml } from './print/zreport'
import { recentSales } from './sales/recent'
import { SalesService } from './sales/sales'
import { saveSalesSettings, salesSettings } from './sales/settings'
import { ShiftService } from './sales/shifts'
import { StockService } from './stock/stock'
import { CustomerService, SupplierService } from './customers/customers'
import { report } from './reports/reports'

/**
 * The shop's local engine: one SQLite database owned by the main process,
 * reached by the renderer over typed IPC channels (see ../shared/ipc.ts).
 * Prices, totals, stock and sale numbers are decided here, never by the page.
 */
export interface Core {
  db: Database.Database
  file: string
  /** Called by the vendor login once it has checked the password/PIN/staff code. */
  signIn(account: { id: string; name: string; role: SessionRole; shopName: string }): Session
  signOut(): void
  close(): void
}

export interface CoreOptions {
  dataDir: string
  /** Folder holding the NNNN_name.sql migrations. */
  migrationsDir: string
  /** raw-print.ps1, unpacked from app.asar when packaged. */
  rawPrintScript: string
  /** Page origins allowed to call the engine (the local Next server). */
  origins: readonly string[]
  /** Smoke test only: read this file instead of opening the file dialog. */
  importFile?: string
}

export async function startCore(opts: CoreOptions): Promise<Core> {
  await fs.mkdir(opts.dataDir, { recursive: true })
  const file = path.join(opts.dataDir, 'vendor.db')
  const db = openDatabase(file)
  try {
    const result = await migrate(db, loadMigrations(opts.migrationsDir), { backupDir: path.join(opts.dataDir, 'backups') })
    if (result.applied.length > 0) console.log(`[core] migrated ${result.from} -> ${result.to}`, result.backupPath ?? '')
  } catch (err) {
    db.close()
    throw err
  }

  const auth = new AuthService(db)
  const shifts = new ShiftService(db)
  const sales = new SalesService(db, shifts)
  const catalog = new CatalogRepo(db, undefined, () => auth.current()?.userId ?? null)
  const stock = new StockService(db)
  const customers = new CustomerService(db, shifts)
  const suppliers = new SupplierService(db)
  /** Parsed imports waiting for "Import": token → plan. One at a time, expires after 30 minutes. */
  const pendingImports = new Map<string, { plan: ImportPlan; expires: number }>()
  const parentWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const language = (): Language => {
    const stored = getSetting(db, 'ui.lang')
    return (LANGUAGES as readonly string[]).includes(stored ?? '') ? (stored as Language) : 'ar'
  }
  const notHere = () => {
    throw new AppError('NOT_AVAILABLE', 'Sign in with the vendor login')
  }

  /** Prints receipt-width HTML on the shop's receipt printer with its settings. A failure never undoes a sale. */
  const printOnReceiptPrinter = async (html: string, openDrawer: boolean): Promise<{ printed: boolean; reason?: string }> => {
    const s = salesSettings(db).receipt
    if (!s.printer) return { printed: false, reason: 'NO_PRINTER' }
    const target = { kind: 'windows' as const, printer: s.printer }
    if (s.route === 'raster') {
      await sendRaw(target, receiptJob(monochrome(await renderPaperImage(html, s.paper)), { openDrawer }), opts.rawPrintScript)
    } else {
      await printPaperWithDriver(html, s.paper, s.printer)
      if (openDrawer) await sendRaw(target, DRAWER_KICK, opts.rawPrintScript)
    }
    return { printed: true }
  }

  /** Expands copies, renders the label document, and lists variants without a printable barcode. */
  const buildLabels = (job: { items: { variantId: string; copies: number }[]; layout: LabelLayout; skip: number; showPrice: boolean }) => {
    const data = catalog.labelData(job.items.map((i) => i.variantId))
    const labels = data.flatMap((d, i) => Array<LabelData>(job.items[i]!.copies).fill(d))
    const missing = data.filter((d) => !d.barcode).map((d) => d.variantId)
    const currency = language() === 'ar' ? 'د.ج' : 'DA'
    const { html, pages } = labelsHtml(labels, { layout: job.layout, skip: job.skip, showPrice: job.showPrice, currency })
    return { html, pages, labels: labels.length, missing }
  }

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
      let file = opts.importFile
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
      return commitImport(pending.plan, catalog, db, auth.requireUser().userId)
    },
    'labels:preview': async (job) => {
      const built = buildLabels(job)
      return { dataUrl: await previewFirstPage(built.html, job.layout), pages: built.pages, labels: built.labels, missingBarcodes: built.missing }
    },
    'labels:print': async (job) => {
      const built = buildLabels(job)
      await printLabels(built.html, job.layout, job.printer)
      return { pages: built.pages, labels: built.labels }
    },
    'labels:assignBarcodes': ({ variantIds }) => ({ assigned: catalog.assignMissingBarcodes(variantIds) }),
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
    'catalog:variantInfo': ({ variantIds }) => catalog.variantInfo(variantIds),
    'catalog:items': () => flatItems(db),
    'catalog:saveItem': (input) => saveFlatItem(db, catalog, input, auth.requireUser().userId),
    'catalog:archiveItem': ({ variantId }) => {
      archiveFlatItem(db, catalog, variantId)
      return null
    },
    'stock:adjust': (input) => adjustStock(db, input, auth.requireUser().userId),
    'sales:recent': ({ days }) => recentSales(db, days),
    'stock:receive': (input) => stock.receive(input.supplierId ? { ...input, supplierName: suppliers.name(input.supplierId) } : input, auth.requireUser().userId),
    'stock:low': () => stock.low(),
    'stock:movements': (q) => stock.movements(q),
    'stock:countOpen': () => stock.openCount(),
    'stock:countStart': ({ note }) => stock.startCount(note, auth.requireUser().userId),
    'stock:countSet': ({ countId, variantId, counted }) => {
      stock.setCounted(countId, variantId, counted)
      return null
    },
    'stock:countFinish': ({ countId }) => stock.finishCount(countId, auth.requireUser().userId),
    'stock:countCancel': ({ countId }) => {
      stock.cancelCount(countId, auth.requireUser().userId)
      return null
    },
    'customers:list': (q) => customers.list(q),
    'customers:get': ({ id }) => customers.get(id),
    'customers:save': (input) => customers.save(input, auth.requireUser().userId),
    'customers:archive': ({ id }) => {
      customers.archive(id, auth.requireUser().userId)
      return null
    },
    'customers:ledger': ({ id }) => customers.ledger(id),
    'customers:pay': (input) => customers.pay(auth.requireUser(), input),
    'customers:adjust': (input) => customers.adjust(input, auth.requireUser().userId),
    'suppliers:list': () => suppliers.list(),
    'reports:period': ({ from, to }) => report(db, from, to),
    'suppliers:save': (input) => suppliers.save(input, auth.requireUser().userId),
    'suppliers:archive': ({ id }) => {
      suppliers.archive(id, auth.requireUser().userId)
      return null
    },
    'app:info': () => ({
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      database: {
        path: file,
        schemaVersion: appliedMigrations(db).at(-1)?.version ?? 0,
        migrations: appliedMigrations(db).map((m) => ({ version: m.version, name: m.name, appliedAt: m.applied_at })),
      },
    }),
    'settings:get': () => ({ lang: language() }),
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
      await sendRaw(target, job, opts.rawPrintScript)
      return { bytes: job.length }
    },
    'print:driver': async ({ options, printer }) => {
      await printWithDriver(options, printer)
      return null
    },
    'print:drawer': async ({ target }) => {
      await sendRaw(target, DRAWER_KICK, opts.rawPrintScript)
      return null
    },
    'auth:status': () => ({
      setupDone: auth.isSetUp(),
      shopName: auth.isSetUp() ? auth.shop().name : null,
      session: auth.current(),
    }),
    // The vendor app owns setup and sign-in (main.js auth-* handlers), then calls signIn() below.
    'auth:setup': notHere,
    'auth:users': () => [],
    'auth:login': notHere,
    'auth:logout': () => {
      auth.logout()
      return null
    },
    'users:list': () => auth.users(),
    'users:save': (input) => auth.saveUser(input),
    'users:setActive': ({ id, active }) => {
      auth.setActive(id, active)
      return null
    },
    'sell:complete': (input) => sales.completeSale(auth.requireUser(), input),
    'sell:printReceipt': async ({ saleId }) => {
      const s = salesSettings(db).receipt
      const data = sales.receiptData(saleId)
      // Drawer opens for cash taken in (sales) and cash paid out (returns).
      const cashMoved = data.cashTendered > 0 || (data.kind === 'RETURN' && sales.detail(saleId).payments.some((p) => p.method === 'CASH'))
      return printOnReceiptPrinter(receiptHtml(data, { lang: s.lang, paper: s.paper }), s.openDrawer && cashMoved)
    },
    'sell:receiptImage': async ({ saleId }) => {
      const s = salesSettings(db).receipt
      const mono = monochrome(await renderPaperImage(receiptHtml(sales.receiptData(saleId), { lang: s.lang, paper: s.paper }), s.paper))
      return { dataUrl: monoToImage(mono).toDataURL(), width: mono.width, height: mono.height }
    },
    'sales:history': (query) => sales.history(query),
    'sales:detail': ({ id }) => sales.detail(id),
    'sales:findByNumber': ({ number }) => sales.findByNumber(number),
    'sales:void': ({ id, reason, ownerPin }) => sales.voidSale(auth.requireUser(), id, reason, ownerPin),
    'sales:return': (input) => sales.returnSale(auth.requireUser(), input),
    'shift:printZ': ({ shiftId }) => {
      const s = salesSettings(db).receipt
      return printOnReceiptPrinter(zReportHtml(shifts.summary(shiftId), auth.shop().name, { lang: s.lang, paper: s.paper }), false)
    },
    'sell:hold': ({ cart }) => ({ id: sales.hold(auth.requireUser(), cart) }),
    'sell:held': () => sales.held(),
    'sell:recall': ({ id }) => sales.recall(id),
    'shift:status': () => shifts.status(auth.requireUser()),
    'shift:open': ({ openingFloat }) => {
      shifts.open(auth.requireUser(), openingFloat)
      return shifts.status(auth.requireUser())
    },
    'shift:cash': ({ type, amount, reason }) => {
      shifts.cashMovement(auth.requireUser(), type, amount, reason)
      return shifts.status(auth.requireUser())
    },
    'shift:close': ({ countedCash, reason }) => shifts.close(auth.requireUser(), countedCash, reason),
    'settings:sales': () => salesSettings(db),
    'settings:saveSales': (input) => saveSalesSettings(db, input),
    'shop:get': () => auth.shop(),
    'shop:save': (input) => auth.saveShop(input),
  }, { role: () => auth.current()?.role ?? null }, opts.origins)

  return {
    db,
    file,
    signIn: (account) => auth.signInExternal(account),
    signOut: () => auth.logout(),
    close: () => db.close(),
  }
}
