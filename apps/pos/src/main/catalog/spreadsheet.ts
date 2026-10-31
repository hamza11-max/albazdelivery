import ExcelJS from 'exceljs'

import { AppError } from '../errors'

/** Limits for files a shop imports. Anything bigger is refused before parsing. */
export const LIMITS = {
  fileBytes: 10 * 1024 * 1024,
  rows: 20_000,
  columns: 40,
  cellChars: 500,
  /** .xlsx is a zip: refuse archives that would expand past this (zip-bomb guard). */
  unzippedBytes: 200 * 1024 * 1024,
  zipEntries: 2_000,
}

export interface SheetRow {
  /** 1-based row number as the shop sees it in Excel. */
  row: number
  cells: string[]
}

export interface Sheet {
  headers: string[]
  rows: SheetRow[]
}

export async function readSpreadsheet(data: Buffer, fileName: string): Promise<Sheet> {
  if (data.length > LIMITS.fileBytes) throw new AppError('FILE_TOO_LARGE', `File is larger than ${LIMITS.fileBytes / 1024 / 1024} MB`)
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.xlsx')) return readXlsx(data)
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) return toSheet(parseCsv(decodeText(data)).map((cells, i) => ({ row: i + 1, cells })))
  throw new AppError('UNSUPPORTED_FILE', 'Choose an Excel (.xlsx) or CSV file')
}

// ---------- xlsx ----------

/**
 * Reads the zip central directory and refuses archives whose entries would
 * expand beyond LIMITS. Runs before exceljs/jszip touch the data.
 */
export function assertSafeZip(data: Buffer): void {
  const EOCD = 0x06054b50
  const start = Math.max(0, data.length - 22 - 0xffff)
  let eocd = -1
  for (let i = data.length - 22; i >= start; i--) {
    if (data.readUInt32LE(i) === EOCD) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new AppError('INVALID_FILE', 'Not a valid Excel file')
  const entries = data.readUInt16LE(eocd + 10)
  const cdOffset = data.readUInt32LE(eocd + 16)
  if (entries > LIMITS.zipEntries) throw new AppError('INVALID_FILE', 'Excel file has too many parts')
  let p = cdOffset
  let total = 0
  for (let n = 0; n < entries; n++) {
    if (p + 46 > data.length || data.readUInt32LE(p) !== 0x02014b50) throw new AppError('INVALID_FILE', 'Not a valid Excel file')
    const uncompressed = data.readUInt32LE(p + 24)
    // 0xFFFFFFFF means ZIP64 sizes: legitimate shop spreadsheets never need it.
    if (uncompressed === 0xffffffff) throw new AppError('INVALID_FILE', 'Excel file is too large')
    total += uncompressed
    if (total > LIMITS.unzippedBytes) throw new AppError('FILE_TOO_LARGE', 'Excel file expands to too much data')
    p += 46 + data.readUInt16LE(p + 28) + data.readUInt16LE(p + 30) + data.readUInt16LE(p + 32)
  }
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isInteger(value) ? value.toFixed(0) : String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    // Formulas are never evaluated: only the value Excel saved with the file is used.
    if ('result' in value) return cellText((value.result ?? null) as ExcelJS.CellValue)
    if ('richText' in value) return value.richText.map((r) => r.text).join('')
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('error' in value) return ''
  }
  return ''
}

async function readXlsx(data: Buffer): Promise<Sheet> {
  assertSafeZip(data)
  const workbook = new ExcelJS.Workbook()
  try {
    // In-memory load: no temp files.
    await workbook.xlsx.load(data as unknown as ArrayBuffer)
  } catch {
    throw new AppError('INVALID_FILE', 'The Excel file could not be read')
  }
  const sheet = workbook.worksheets.find((ws) => ws.actualRowCount > 0)
  if (!sheet) throw new AppError('EMPTY_FILE', 'The file has no rows')
  if (sheet.actualRowCount > LIMITS.rows + 1) throw new AppError('TOO_MANY_ROWS', `More than ${LIMITS.rows} rows`)
  const rows: SheetRow[] = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: string[] = []
    const count = Math.min(row.cellCount, LIMITS.columns)
    for (let c = 1; c <= count; c++) cells.push(cellText(row.getCell(c).value))
    rows.push({ row: rowNumber, cells })
  })
  return toSheet(rows)
}

// ---------- csv ----------

/** UTF-8 (with or without BOM); otherwise the Windows code page Excel used (Arabic or Western). */
export function decodeText(data: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data).replace(/^﻿/, '')
  } catch {
    const arabic = new TextDecoder('windows-1256').decode(data)
    return /[؀-ۿ]{3}/.test(arabic) ? arabic : new TextDecoder('windows-1252').decode(data)
  }
}

/** RFC 4180 CSV. The delimiter (`,` `;` or tab) is detected from the first line; French Excel uses `;`. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.search(/\r?\n|$/))
  const counts = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length] as const)
  const delimiter = counts.sort((a, b) => b[1] - a[1])[0]![0]

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (rows.length > LIMITS.rows + 1) throw new AppError('TOO_MANY_ROWS', `More than ${LIMITS.rows} rows`)
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function toSheet(all: SheetRow[]): Sheet {
  const nonEmpty = all.filter((r) => r.cells.some((c) => c.trim() !== ''))
  if (nonEmpty.length === 0) throw new AppError('EMPTY_FILE', 'The file has no rows')
  if (nonEmpty.length > LIMITS.rows + 1) throw new AppError('TOO_MANY_ROWS', `More than ${LIMITS.rows} rows`)
  const clip = (cells: string[]) => cells.slice(0, LIMITS.columns).map((c) => c.trim().slice(0, LIMITS.cellChars))
  const [header, ...rows] = nonEmpty
  return { headers: clip(header!.cells), rows: rows.map((r) => ({ row: r.row, cells: clip(r.cells) })) }
}
