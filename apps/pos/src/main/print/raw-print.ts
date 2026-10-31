import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

import type { RawTarget } from '../../shared/ipc'

/** `target` must already be validated (see `inputs` in src/shared/ipc.ts). */
export async function sendRaw(target: RawTarget, data: Buffer, scriptPath: string): Promise<void> {
  if (target.kind === 'tcp') return sendTcp(target.host, target.port, data)
  return sendWindows(target.printer, data, scriptPath)
}

async function sendWindows(printer: string, data: Buffer, scriptPath: string): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Raw spooler printing is only available on Windows')
  const file = path.join(os.tmpdir(), `albaz-pos-${randomUUID()}.bin`)
  await fs.writeFile(file, data)
  try {
    // Arguments are passed as an array (no shell), so the printer name cannot inject commands.
    await new Promise<void>((resolve, reject) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Printer', printer, '-Path', file],
        { timeout: 30_000, windowsHide: true },
        (err, _stdout, stderr) => {
          if (err) reject(new Error(stderr.trim() || err.message))
          else resolve()
        },
      )
    })
  } finally {
    await fs.rm(file, { force: true })
  }
}

function sendTcp(host: string, port: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port })
    socket.setTimeout(5_000, () => socket.destroy(new Error(`Timed out talking to ${host}:${port}`)))
    socket.once('error', reject)
    socket.once('connect', () => socket.end(data, () => resolve()))
  })
}
