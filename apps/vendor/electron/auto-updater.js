/**
 * Auto-Updater Module for Electron Vendor App
 * Production-only updater with explicit renderer-controlled UX flow.
 */

const { app } = require('electron')
const Store = require('electron-store').default || require('electron-store')
const { registerUpdaterIPCHandlers } = require('./ipc/updater-ipc')
const { UPDATE_CHANNELS, UPDATE_CHANNEL_STORE_KEY, UPDATE_EVENTS } = require('./updater/constants')

let autoUpdater = null
let mainWindow = null
let updaterReady = false

const updateStore = new Store({ name: 'vendor-updater' })

function getStoredChannel() {
  const raw = updateStore.get(UPDATE_CHANNEL_STORE_KEY)
  return raw === UPDATE_CHANNELS.BETA ? UPDATE_CHANNELS.BETA : UPDATE_CHANNELS.STABLE
}

function getActiveChannel() {
  if (autoUpdater && autoUpdater.channel) return autoUpdater.channel
  return getStoredChannel()
}

function sendToRenderer(channel, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send(channel, payload)
}

function sendStatusToWindow(status, data = {}) {
  sendToRenderer(UPDATE_EVENTS.STATUS, { status, ...data })
}

function wireAutoUpdaterEvents() {
  autoUpdater.on('update-available', (info) => {
    console.log('[Auto-Updater] update-available', info?.version || '')
    sendStatusToWindow('available', info)
    sendToRenderer(UPDATE_EVENTS.AVAILABLE, info || {})
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Auto-Updater] update-not-available')
    sendStatusToWindow('not-available', info)
  })

  autoUpdater.on('error', (err) => {
    const message = err?.message || String(err)
    console.error('[Auto-Updater] error', message)
    sendStatusToWindow('error', { message })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const payload = {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    }
    console.log('[Auto-Updater] download-progress', `${Math.round(progressObj.percent || 0)}%`)
    sendStatusToWindow('downloading', payload)
    sendToRenderer(UPDATE_EVENTS.PROGRESS, payload)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Auto-Updater] update-downloaded', info?.version || '')
    sendStatusToWindow('downloaded', info)
    sendToRenderer(UPDATE_EVENTS.DOWNLOADED, info || {})
  })
}

function isUpdaterUsable() {
  return Boolean(autoUpdater && updaterReady && app.isPackaged)
}

function normalizeChannel(channel) {
  return channel === UPDATE_CHANNELS.BETA ? UPDATE_CHANNELS.BETA : UPDATE_CHANNELS.STABLE
}

function setUpdateChannel(channel) {
  const nextChannel = normalizeChannel(channel)
  updateStore.set(UPDATE_CHANNEL_STORE_KEY, nextChannel)
  if (autoUpdater) {
    autoUpdater.channel = nextChannel
  }
  console.log('[Auto-Updater] channel set to', nextChannel)
  return { success: true, channel: nextChannel }
}

async function checkForUpdates() {
  if (!isUpdaterUsable()) {
    return { available: false, message: 'Auto-updater not available in development' }
  }

  try {
    console.log('[Auto-Updater] checking for updates...')
    sendStatusToWindow('checking')
    const result = await autoUpdater.checkForUpdates()
    return { available: Boolean(result?.updateInfo), info: result?.updateInfo }
  } catch (error) {
    const message = error?.message || String(error)
    console.error('[Auto-Updater] check failed', message)
    return { available: false, error: message }
  }
}

async function startDownload() {
  if (!isUpdaterUsable()) return { success: false, error: 'Auto-updater unavailable' }
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    const message = error?.message || String(error)
    console.error('[Auto-Updater] download failed', message)
    return { success: false, error: message }
  }
}

function installUpdate() {
  if (!isUpdaterUsable()) return
  console.log('[Auto-Updater] quitAndInstall requested by user')
  autoUpdater.quitAndInstall()
}

function remindLater() {
  console.log('[Auto-Updater] user selected remind later')
}

function initAutoUpdater(win) {
  mainWindow = win

  if (!app.isPackaged) {
    console.log('[Auto-Updater] skipped: development mode')
    return
  }

  try {
    const { autoUpdater: updater } = require('electron-updater')
    autoUpdater = updater
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.channel = getStoredChannel()
    wireAutoUpdaterEvents()
    updaterReady = true
    console.log('[Auto-Updater] initialized on channel', autoUpdater.channel)

    setTimeout(() => {
      checkForUpdates()
    }, 10000)
  } catch (error) {
    updaterReady = false
    console.log('[Auto-Updater] unavailable:', error?.message || String(error))
  }
}

function registerUpdaterIPC() {
  registerUpdaterIPCHandlers({
    checkForUpdates,
    startDownload,
    installUpdate,
    remindLater,
    getChannel: () => ({ channel: getActiveChannel() }),
    setChannel: (channel) => setUpdateChannel(channel),
  })
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate: startDownload,
  installUpdate,
  registerUpdaterIPC,
  getUpdateChannel: getActiveChannel,
  setUpdateChannel,
}

