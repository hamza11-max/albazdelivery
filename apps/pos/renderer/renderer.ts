const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const lang = $<HTMLSelectElement>('lang')
const paper = $<HTMLSelectElement>('paper')
const kind = $<HTMLSelectElement>('kind')
const printer = $<HTMLSelectElement>('printer')
const host = $<HTMLInputElement>('host')
const port = $<HTMLInputElement>('port')
const drawerAfter = $<HTMLInputElement>('drawer-after')
const status = $<HTMLParagraphElement>('status')
const receipt = $<HTMLImageElement>('receipt')
const dims = $<HTMLParagraphElement>('dims')

function options(): ReceiptOptions {
  return { lang: lang.value as ReceiptLang, paper: Number(paper.value) as PaperWidth }
}

function target(): RawTarget {
  if (kind.value === 'tcp') return { kind: 'tcp', host: host.value.trim(), port: Number(port.value) }
  return { kind: 'windows', printer: printer.value }
}

function setStatus(text: string, tone: '' | 'ok' | 'err' = '') {
  status.textContent = text
  status.className = tone
}

function message(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err)
  // ipcRenderer.invoke prefixes errors with "Error invoking remote method '...': ".
  return text.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

/** Disables all buttons while `fn` runs and reports the outcome. */
async function run(label: string, fn: () => Promise<string | void>) {
  const buttons = [...document.querySelectorAll('button')]
  buttons.forEach((b) => (b.disabled = true))
  setStatus(`${label}…`)
  try {
    const done = await fn()
    setStatus(done ?? `${label}: done`, 'ok')
  } catch (err) {
    setStatus(`${label} failed: ${message(err)}`, 'err')
  } finally {
    buttons.forEach((b) => (b.disabled = false))
  }
}

async function refreshPreview() {
  await run('Rendering preview', async () => {
    const result = await window.pos.preview(options())
    receipt.src = result.dataUrl
    dims.textContent = `${result.width} × ${result.height} dots (1-bit, exactly what route B prints)`
    return 'Preview ready'
  })
}

async function loadPrinters() {
  const list = await window.pos.listPrinters()
  printer.replaceChildren(
    ...list.map((p) => {
      const opt = document.createElement('option')
      opt.value = p.name
      opt.textContent = p.displayName
      return opt
    }),
  )
  if (list.length === 0) setStatus('No Windows printers found. Install the printer driver, or use a network printer.', 'err')
}

kind.addEventListener('change', () => {
  $('tcp-row').hidden = kind.value !== 'tcp'
  $('printer-row').hidden = kind.value === 'tcp'
})
lang.addEventListener('change', refreshPreview)
paper.addEventListener('change', refreshPreview)
$('preview').addEventListener('click', refreshPreview)

$('save').addEventListener('click', () =>
  run('Saving PNG', async () => {
    const file = await window.pos.savePng(options())
    return file ? `Saved ${file}` : 'Save cancelled'
  }),
)

$('print-a').addEventListener('click', () =>
  run('Printing via driver', async () => {
    if (kind.value === 'tcp') throw new Error('Route A needs a Windows printer, not a network address')
    await window.pos.printDriver(options(), printer.value)
    return 'Sent to the Windows driver. Check the paper.'
  }),
)

$('print-b').addEventListener('click', () =>
  run('Printing raster', async () => {
    const bytes = await window.pos.printRaster(options(), target(), drawerAfter.checked)
    return `Sent ${bytes.toLocaleString()} bytes of ESC/POS. Check the paper.`
  }),
)

$('drawer').addEventListener('click', () =>
  run('Opening drawer', async () => {
    await window.pos.openDrawer(target())
    return 'Drawer pulse sent.'
  }),
)

void loadPrinters().then(refreshPreview)

// Loaded as an ES module; keeps top-level names out of the global scope (e.g. window.status).
export {}
