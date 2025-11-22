const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null
let nextProcess = null

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  })

  // Set app title
  mainWindow.setTitle('AlBaz Vendor App')

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Load the app
  if (isDev) {
    // Development: Start Next.js dev server and load from localhost
    startNextDevServer()
  } else {
    // Production: Start Next.js standalone server
    startNextStandaloneServer()
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
    if (nextProcess) {
      nextProcess.kill()
      nextProcess = null
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })
}

function startNextDevServer() {
  // Start Next.js dev server
  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  })

  let serverReady = false

  nextProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('[Next.js]', output)
    
    // Check if server is ready
    if (!serverReady && (output.includes('Ready') || output.includes('Local:') || output.includes('localhost:3001'))) {
      serverReady = true
      // Wait a bit for server to be fully ready
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:3001/vendor')
        }
      }, 2000)
    }
  })

  nextProcess.stderr.on('data', (data) => {
    console.error('[Next.js Error]', data.toString())
  })

  nextProcess.on('close', (code) => {
    console.log(`[Next.js] Process exited with code ${code}`)
    nextProcess = null
  })

  nextProcess.on('error', (error) => {
    console.error('[Next.js] Failed to start:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL('http://localhost:3001/vendor')
    }
  })
}

function startNextStandaloneServer() {
  // Start Next.js standalone server from .next/standalone
  const standalonePath = path.join(__dirname, '../.next/standalone')
  const serverPath = path.join(standalonePath, 'server.js')
  
  // Check if standalone build exists
  const fs = require('fs')
  if (!fs.existsSync(serverPath)) {
    console.error('[Electron] Standalone build not found. Run: npm run build')
    mainWindow.loadURL('about:blank')
    return
  }

  // Set PORT environment variable
  process.env.PORT = '3001'
  process.env.HOSTNAME = 'localhost'

  // Start the standalone server
  nextProcess = spawn('node', ['server.js'], {
    cwd: standalonePath,
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: '3001',
      HOSTNAME: 'localhost',
    },
  })

  let serverReady = false

  nextProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('[Next.js Standalone]', output)
    
    if (!serverReady && (output.includes('Ready') || output.includes('Local:') || output.includes('localhost:3001'))) {
      serverReady = true
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:3001/vendor')
        }
      }, 2000)
    }
  })

  nextProcess.stderr.on('data', (data) => {
    console.error('[Next.js Standalone Error]', data.toString())
  })

  nextProcess.on('close', (code) => {
    console.log(`[Next.js Standalone] Process exited with code ${code}`)
    nextProcess = null
  })

  nextProcess.on('error', (error) => {
    console.error('[Next.js Standalone] Failed to start:', error)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL('http://localhost:3001/vendor')
    }
  })
}

// App event handlers
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On Windows/Linux, quit when all windows are closed
  if (process.platform !== 'darwin') {
    if (nextProcess) {
      nextProcess.kill()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  // Clean up Next.js process
  if (nextProcess) {
    nextProcess.kill()
    nextProcess = null
  }
})

// IPC handlers for app updates
ipcMain.handle('app-version', () => {
  return app.getVersion()
})

ipcMain.handle('app-name', () => {
  return app.getName()
})

