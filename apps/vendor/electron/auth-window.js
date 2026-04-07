const { BrowserWindow } = require('electron')
const path = require('path')
const { getVendorWindowIconPath } = require('./app-icon')

let authWindow = null
let allowClose = false

function createAuthWindow() {
  // Only one auth window: reuse if it already exists
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.show()
    authWindow.focus()
    return authWindow
  }
  allowClose = false
  const authIcon = getVendorWindowIconPath()
  authWindow = new BrowserWindow({
    // Open authentication in fullscreen so it fully covers the screen
    fullscreen: true,
    resizable: true,
    show: false,
    frame: false,
    ...(authIcon ? { icon: authIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    title: 'AlBaz Vendor - Login',
  })

  authWindow.once('ready-to-show', () => {
    // Ensure the window is actually fullscreen on all platforms
    try {
      authWindow.maximize()
      authWindow.setFullScreen(true)
    } catch (e) {
      // ignore if not supported
    }
    authWindow.show()
  })

  authWindow.loadURL('http://localhost:3001/login')

  authWindow.on('closed', () => {
    authWindow = null
  })

  authWindow.on('close', (event) => {
    if (!allowClose) {
      event.preventDefault()
      try {
        authWindow.show()
      } catch (e) {
        // ignore
      }
    }
  })

  return authWindow
}

function closeAuthWindow() {
  if (authWindow) {
    allowClose = true
    authWindow.close()
    authWindow = null
  }
}

module.exports = {
  createAuthWindow,
  closeAuthWindow,
  getAuthWindow: () => authWindow,
  setAuthWindowClosable: (canClose) => {
    allowClose = !!canClose
    if (authWindow && authWindow.setClosable) {
      authWindow.setClosable(!!canClose)
    }
  },
}

