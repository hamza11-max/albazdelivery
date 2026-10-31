import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { ZodError } from 'zod'

import { inputs, type ChannelName, type IpcResult, type Outputs } from '../shared/ipc'
import { APP_ORIGIN } from './protocol'

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

function fromOurPage(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? ''
  return url.startsWith(`${APP_ORIGIN}/`)
}

/** Registers every channel: sender check, then schema parse, then the handler. */
export function registerHandlers(handlers: Handlers): void {
  for (const channel of Object.keys(inputs) as ChannelName[]) {
    const schema = inputs[channel]
    const handler = handlers[channel] as (input: unknown) => unknown
    ipcMain.handle(channel, async (event, raw: unknown): Promise<IpcResult<unknown>> => {
      if (!fromOurPage(event)) return { ok: false, error: { code: 'FORBIDDEN', message: 'Unknown sender' } }
      try {
        const data = await handler(schema.parse(raw))
        return { ok: true, data: data ?? null }
      } catch (err) {
        return toResult(err)
      }
    })
  }
}
