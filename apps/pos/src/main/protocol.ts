import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** The UI is served from app://pos/ rather than file://, so it has a real, isolated origin. */
export const APP_ORIGIN = 'app://pos'

/** Must run before the app is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ])
}

/** Serves files from `rootDir` for app://pos/…, refusing anything outside it. */
export function serveAppScheme(rootDir: string): void {
  const root = path.resolve(rootDir)
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    if (url.host !== 'pos') return new Response('Not found', { status: 404 })
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
    const file = path.resolve(root, relative)
    if (file !== root && !file.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 })
    return net.fetch(pathToFileURL(file).toString())
  })
}
