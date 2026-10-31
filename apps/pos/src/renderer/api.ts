import type { ChannelName, Inputs, IpcResult, Outputs } from '../shared/ipc'

declare global {
  interface Window {
    pos: { invoke(channel: string, input?: unknown): Promise<IpcResult<unknown>> }
  }
}

/** An error from the main process, with a stable code the UI can translate. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Typed call to the main process. Inputs are validated again in main. */
export async function call<K extends ChannelName>(channel: K, ...input: Inputs[K] extends undefined ? [] : [Inputs[K]]): Promise<Outputs[K]> {
  const result = (await window.pos.invoke(channel, input[0])) as IpcResult<Outputs[K]>
  if (!result.ok) throw new ApiError(result.error.code, result.error.message)
  return result.data
}
