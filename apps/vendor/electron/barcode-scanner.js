/**
 * Hardware Barcode Scanner Module
 * Supports USB HID and Serial barcode scanners
 */

const { ipcMain } = require('electron')

let scannerBuffer = ''
let scannerTimeout = null
let scannerCallback = null
const SCAN_TIMEOUT = 50 // ms between keystrokes for barcode

/**
 * USB HID barcode scanners typically work as keyboard devices
 * They send characters rapidly followed by Enter
 * This module detects rapid keyboard input patterns
 */
function initBarcodeScanner(mainWindow) {
  if (!mainWindow) return
  
  // Listen for keyboard input in the renderer
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Only process key presses, not releases
    if (input.type !== 'keyDown') return
    
    // Check if this looks like scanner input (rapid keystrokes)
    if (scannerTimeout) {
      clearTimeout(scannerTimeout)
    }
    
    // Handle Enter key - end of barcode
    if (input.key === 'Enter' && scannerBuffer.length > 3) {
      const barcode = scannerBuffer
      scannerBuffer = ''
      
      // Send barcode to renderer
      mainWindow.webContents.send('barcode-scanned', barcode)
      console.log('[Barcode Scanner] Scanned:', barcode)
      
      // Prevent the Enter from being processed
      event.preventDefault()
      return
    }
    
    // Accumulate printable characters
    if (input.key.length === 1 && !input.control && !input.alt && !input.meta) {
      scannerBuffer += input.key
      
      // Reset buffer after timeout (user is typing normally)
      scannerTimeout = setTimeout(() => {
        scannerBuffer = ''
      }, SCAN_TIMEOUT)
    }
  })
  
  console.log('[Barcode Scanner] USB HID scanner support initialized')
}

/**
 * Serial port barcode scanner support
 * Requires serialport package: npm install serialport
 */
async function initSerialScanner(portPath, baudRate = 9600) {
  try {
    const { SerialPort } = require('serialport')
    const { ReadlineParser } = require('@serialport/parser-readline')
    
    const port = new SerialPort({
      path: portPath,
      baudRate: baudRate
    })
    
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
    
    parser.on('data', (barcode) => {
      console.log('[Serial Scanner] Scanned:', barcode)
      if (scannerCallback) {
        scannerCallback(barcode.trim())
      }
    })
    
    port.on('error', (err) => {
      console.error('[Serial Scanner] Error:', err.message)
    })
    
    console.log(`[Serial Scanner] Connected to ${portPath} at ${baudRate} baud`)
    return port
  } catch (error) {
    console.error('[Serial Scanner] Failed to initialize:', error.message)
    return null
  }
}

/**
 * List available serial ports
 */
async function listSerialPorts() {
  try {
    const { SerialPort } = require('serialport')
    const ports = await SerialPort.list()
    return ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      vendorId: port.vendorId,
      productId: port.productId
    }))
  } catch (error) {
    console.error('[Serial Scanner] Failed to list ports:', error.message)
    return []
  }
}

// IPC handlers
function registerBarcodeIPC() {
  ipcMain.handle('scanner-list-ports', async () => {
    return await listSerialPorts()
  })
  
  ipcMain.handle('scanner-connect-serial', async (event, portPath, baudRate) => {
    const port = await initSerialScanner(portPath, baudRate)
    return { success: !!port }
  })
}

module.exports = {
  initBarcodeScanner,
  initSerialScanner,
  listSerialPorts,
  registerBarcodeIPC
}

