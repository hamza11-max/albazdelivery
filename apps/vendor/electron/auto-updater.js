/**
 * Auto-Updater Module for Electron Vendor App
 * Uses electron-updater for automatic updates
 */

const { ipcMain } = require('electron')

let autoUpdater = null
let mainWindow = null

function initAutoUpdater(win) {
  mainWindow = win
  
  try {
    // electron-updater is optional - only works in production builds
    const { autoUpdater: updater } = require('electron-updater')
    autoUpdater = updater
    
    // Configure auto-updater
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    
    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      sendStatusToWindow('checking')
    })
    
    autoUpdater.on('update-available', (info) => {
      sendStatusToWindow('available', info)
    })
    
    autoUpdater.on('update-not-available', (info) => {
      sendStatusToWindow('not-available', info)
    })
    
    autoUpdater.on('error', (err) => {
      sendStatusToWindow('error', { message: err.message })
    })
    
    autoUpdater.on('download-progress', (progressObj) => {
      sendStatusToWindow('downloading', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      })
    })
    
    autoUpdater.on('update-downloaded', (info) => {
      sendStatusToWindow('downloaded', info)
    })
    
    console.log('[Auto-Updater] Initialized')
    
    // Check for updates on startup (after 10 seconds)
    setTimeout(() => {
      checkForUpdates()
    }, 10000)
    
  } catch (error) {
    console.log('[Auto-Updater] Not available in development mode')
  }
}

function sendStatusToWindow(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { status, ...data })
  }
}

function checkForUpdates() {
  if (autoUpdater) {
    autoUpdater.checkForUpdates()
  }
}

function downloadUpdate() {
  if (autoUpdater) {
    autoUpdater.downloadUpdate()
  }
}

function installUpdate() {
  if (autoUpdater) {
    autoUpdater.quitAndInstall()
  }
}

// IPC handlers
function registerUpdaterIPC() {
  ipcMain.handle('updater-check', async () => {
    if (!autoUpdater) {
      return { available: false, message: 'Auto-updater not available in development' }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      return { available: !!result?.updateInfo, info: result?.updateInfo }
    } catch (error) {
      return { available: false, error: error.message }
    }
  })
  
  ipcMain.handle('updater-download', async () => {
    if (!autoUpdater) return { success: false }
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('updater-install', () => {
    if (autoUpdater) {
      autoUpdater.quitAndInstall()
    }
  })
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  registerUpdaterIPC
}

