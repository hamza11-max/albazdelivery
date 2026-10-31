// Shape of the bridge exposed by src/preload.ts. Keep in sync.
type ReceiptLang = 'ar' | 'fr' | 'mixed'
type PaperWidth = 58 | 80

interface ReceiptOptions {
  lang: ReceiptLang
  paper: PaperWidth
}

type RawTarget = { kind: 'windows'; printer: string } | { kind: 'tcp'; host: string; port: number }

interface PosBridge {
  listPrinters(): Promise<{ name: string; displayName: string }[]>
  preview(opts: ReceiptOptions): Promise<{ dataUrl: string; width: number; height: number }>
  savePng(opts: ReceiptOptions): Promise<string | null>
  printDriver(opts: ReceiptOptions, printer: string): Promise<void>
  printRaster(opts: ReceiptOptions, target: RawTarget, openDrawer: boolean): Promise<number>
  openDrawer(target: RawTarget): Promise<void>
}

interface Window {
  pos: PosBridge
}
