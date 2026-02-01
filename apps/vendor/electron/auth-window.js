const { BrowserWindow } = require('electron')
const path = require('path')

let authWindow = null
let allowClose = false

function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    title: 'AlBaz Vendor - Login',
  })

  authWindow.once('ready-to-show', () => {
    authWindow.show()
  })

  // Load login page
  const isDev = process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged
  if (isDev) {
    authWindow.loadURL('http://localhost:3001/login')
  } else {
    authWindow.loadURL('http://localhost:3001/login')
  }

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

