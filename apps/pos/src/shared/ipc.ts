/**
 * The IPC contract between the renderer and the main process. Every channel is
 * declared here once: its input schema (checked in main before any handler
 * runs) and its result type. Renderer code imports this file with
 * `import type` only, so zod is not bundled into the UI.
 */
import { z } from 'zod'

export const LANGUAGES = ['ar', 'fr'] as const
export type Language = (typeof LANGUAGES)[number]

const HOST_RE = /^(?:[a-zA-Z0-9-]{1,63}\.)*[a-zA-Z0-9-]{1,63}$|^\d{1,3}(?:\.\d{1,3}){3}$/
// eslint-disable-next-line no-control-regex
const printerName = z.string().min(1).max(256).regex(/^[^\u0000-\u001f]+$/, 'invalid printer name')

const receiptOptions = z.object({
  lang: z.enum(['ar', 'fr', 'mixed']),
  paper: z.union([z.literal(58), z.literal(80)]),
})

const rawTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('windows'), printer: printerName }),
  z.object({ kind: z.literal('tcp'), host: z.string().regex(HOST_RE, 'invalid host'), port: z.number().int().min(1).max(65535) }),
])

export const inputs = {
  'app:info': z.undefined(),
  'settings:get': z.undefined(),
  'settings:setLanguage': z.object({ lang: z.enum(LANGUAGES) }),
  'print:printers': z.undefined(),
  'print:preview': receiptOptions,
  'print:raster': z.object({ options: receiptOptions, target: rawTarget, openDrawer: z.boolean() }),
  'print:driver': z.object({ options: receiptOptions, printer: printerName }),
  'print:drawer': z.object({ target: rawTarget }),
} as const

export type ChannelName = keyof typeof inputs
export type Inputs = { [K in ChannelName]: z.input<(typeof inputs)[K]> }
export type ReceiptOptions = z.infer<typeof receiptOptions>
export type RawTarget = z.infer<typeof rawTarget>

export interface AppInfo {
  appVersion: string
  electronVersion: string
  database: {
    path: string
    schemaVersion: number
    migrations: { version: number; name: string; appliedAt: string }[]
  }
}

export interface Outputs {
  'app:info': AppInfo
  'settings:get': { lang: Language }
  'settings:setLanguage': { lang: Language }
  'print:printers': { name: string; displayName: string }[]
  'print:preview': { dataUrl: string; width: number; height: number }
  'print:raster': { bytes: number }
  'print:driver': null
  'print:drawer': null
}

/** Handlers never throw across IPC; they return this envelope. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
