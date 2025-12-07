const { BrowserWindow } = require('electron')
const path = require('path')

let authWindow = null

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

  return authWindow
}

function closeAuthWindow() {
  if (authWindow) {
    authWindow.close()
    authWindow = null
  }
}

module.exports = {
  createAuthWindow,
  closeAuthWindow,
  getAuthWindow: () => authWindow,
}

