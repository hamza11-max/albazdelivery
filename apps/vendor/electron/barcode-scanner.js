/**
 * Hardware Barcode Scanner Module
 * Supports USB HID and Serial barcode scanners.
 * Also supports RFID keyboard wedge: if the reader sends a prefix "RFID:" then
 * we emit 'rfid-scanned' with the tag ID; otherwise we emit 'barcode-scanned'.
 */

const { ipcMain } = require('electron')

let scannerBuffer = ''
let scannerTimeout = null
let scannerCallback = null
const SCAN_TIMEOUT = 50 // ms between keystrokes for barcode
const RFID_PREFIX = 'RFID:'

/**
 * USB HID barcode scanners (and RFID readers in keyboard wedge mode) typically
 * work as keyboard devices: they send characters rapidly followed by Enter.
 * This module detects that pattern. If the buffer starts with "RFID:", we
 * emit rfid-scanned(tagId); otherwise we emit barcode-scanned(barcode).
 */
function initBarcodeScanner(mainWindow) {
  if (!mainWindow) return

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return

    if (scannerTimeout) {
      clearTimeout(scannerTimeout)
    }

    if (input.key === 'Enter' && scannerBuffer.length > 3) {
      const raw = scannerBuffer
      scannerBuffer = ''

      if (raw.startsWith(RFID_PREFIX)) {
        const tagId = raw.slice(RFID_PREFIX.length).trim()
        mainWindow.webContents.send('rfid-scanned', tagId)
        console.log('[RFID] Scanned:', tagId)
      } else {
        mainWindow.webContents.send('barcode-scanned', raw)
        console.log('[Barcode Scanner] Scanned:', raw)
      }

      event.preventDefault()
      return
    }

    if (input.key.length === 1 && !input.control && !input.alt && !input.meta) {
      scannerBuffer += input.key
      scannerTimeout = setTimeout(() => {
        scannerBuffer = ''
      }, SCAN_TIMEOUT)
    }
  })

  console.log('[Barcode Scanner] USB HID scanner + RFID keyboard wedge support initialized')
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

