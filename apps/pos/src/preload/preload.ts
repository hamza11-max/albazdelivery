// Sandboxed preload: may only require 'electron', so the channel list is inline.
// The type checks below fail the build if it drifts from src/shared/ipc.ts.
import { contextBridge, ipcRenderer } from 'electron'

import type { ChannelName } from '../shared/ipc'

const CHANNELS = [
  'app:info',
  'settings:get',
  'settings:setLanguage',
  'print:printers',
  'print:preview',
  'print:raster',
  'print:driver',
  'print:drawer',
] as const satisfies readonly ChannelName[]

type Missing = Exclude<ChannelName, (typeof CHANNELS)[number]>
const allChannelsListed: [Missing] extends [never] ? true : Missing = true
void allChannelsListed

const allowed = new Set<string>(CHANNELS)

contextBridge.exposeInMainWorld('pos', {
  invoke: (channel: string, input?: unknown) =>
    allowed.has(channel)
      ? ipcRenderer.invoke(channel, input)
      : Promise.resolve({ ok: false, error: { code: 'UNKNOWN_CHANNEL', message: channel } }),
})
