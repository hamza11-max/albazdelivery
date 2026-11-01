import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { ZodError } from 'zod'

import { inputs, type ChannelName, type IpcResult, type Outputs, type SessionRole } from '../shared/ipc'
import { ACCESS, type Access } from './access'

/** Input after schema parsing (zod output type). */
type Parsed<K extends ChannelName> = import('zod').infer<(typeof inputs)[K]>

export type Handlers = { [K in ChannelName]: (input: Parsed<K>) => Promise<Outputs[K]> | Outputs[K] }

export { AppError } from './errors'

function toResult(err: unknown): IpcResult<never> {
  if (err instanceof ZodError) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ') } }
  }
  const coded = err as Error & { code?: unknown }
  if (err instanceof Error && typeof coded.code === 'string') {
    // AppError and pos-core's PosError carry stable codes and user-safe messages.
    return { ok: false, error: { code: coded.code, message: err.message } }
  }
  console.error('[ipc] unexpected error', err)
  return { ok: false, error: { code: 'INTERNAL', message: err instanceof Error ? err.message : String(err) } }
}

/** Only the vendor app's own pages (served by its local Next server) may call the engine. */
function fromOurPage(event: IpcMainInvokeEvent, origins: readonly string[]): boolean {
  const url = event.senderFrame?.url ?? ''
  return origins.some((o) => url.startsWith(`${o}/`))
}

/** Who is signed in, as far as access checks are concerned. */
export interface AccessCheck {
  role(): SessionRole | null
}

function allowed(access: Access, role: SessionRole | null): { ok: true } | { ok: false; code: string } {
  if (access === 'public') return { ok: true }
  if (role === null) return { ok: false, code: 'UNAUTHENTICATED' }
  if (access === 'owner' && role !== 'OWNER') return { ok: false, code: 'FORBIDDEN' }
  if (access === 'manager' && role !== 'OWNER' && role !== 'MANAGER') return { ok: false, code: 'FORBIDDEN' }
  return { ok: true }
}

/** Registers every channel: sender check, role check, schema parse, then the handler. */
export function registerHandlers(handlers: Handlers, auth: AccessCheck, origins: readonly string[]): void {
  for (const channel of Object.keys(inputs) as ChannelName[]) {
    const schema = inputs[channel]
    const handler = handlers[channel] as (input: unknown) => unknown
    ipcMain.handle(channel, async (event, raw: unknown): Promise<IpcResult<unknown>> => {
      if (!fromOurPage(event, origins)) return { ok: false, error: { code: 'FORBIDDEN', message: 'Unknown sender' } }
      const gate = allowed(ACCESS[channel], auth.role())
      if (!gate.ok) return { ok: false, error: { code: gate.code, message: channel } }
      try {
        const data = await handler(schema.parse(raw))
        return { ok: true, data: data ?? null }
      } catch (err) {
        return toResult(err)
      }
    })
  }
}
