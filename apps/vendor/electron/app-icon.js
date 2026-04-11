/**
 * Resolve a usable .ico path for BrowserWindow / Tray across dev and packaged builds.
 * Packaged apps should resolve via app.getAppPath() (…/app.asar); __dirname alone can fail
 * when paths or ASAR layout differ from source tree.
 */
const path = require('path')
const fs = require('fs')

function getVendorWindowIconPath() {
  let appPath = ''
  let resourcesPath = ''
  try {
    const { app } = require('electron')
    if (app?.getAppPath) {
      appPath = app.getAppPath()
    }
    if (app?.getPath) {
      resourcesPath = app.getPath('exe') ? path.dirname(app.getPath('exe')) : ''
    }
  } catch (_) {
    /* electron not ready */
  }

  const candidates = []
  if (process?.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico'))
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'logo.ico'))
    candidates.push(path.join(process.resourcesPath, 'build', 'icon.ico'))
  }
  if (resourcesPath) {
    candidates.push(path.join(resourcesPath, 'resources', 'app.asar.unpacked', 'build', 'icon.ico'))
    candidates.push(path.join(resourcesPath, 'resources', 'app.asar.unpacked', 'assets', 'logo.ico'))
    candidates.push(path.join(resourcesPath, 'resources', 'build', 'icon.ico'))
  }
  if (appPath) {
    candidates.push(path.join(appPath, 'assets', 'logo.ico'))
    candidates.push(path.join(appPath, 'assets', 'icon.ico'))
    candidates.push(path.join(appPath, 'build', 'icon.ico'))
  }
  candidates.push(path.join(__dirname, '..', 'assets', 'logo.ico'))
  candidates.push(path.join(__dirname, '..', 'assets', 'icon.ico'))
  candidates.push(path.join(__dirname, '..', 'build', 'icon.ico'))

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p
    } catch (_) {
      /* ignore */
    }
  }
  return undefined
}

module.exports = { getVendorWindowIconPath }
