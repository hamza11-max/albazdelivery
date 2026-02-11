/**
 * Before electron-builder: ensure dist\win-unpacked is not locked (so packaging can overwrite).
 * If the exe or folder is locked, exit with 1 and print clear instructions.
 */
const fs = require('fs')
const path = require('path')

if (process.platform !== 'win32') {
  process.exit(0)
}

const distUnpacked = path.join(__dirname, '..', 'dist', 'win-unpacked')
const exeNames = ['AlBazVendor.exe', 'AlBaz Vendor.exe']
const maxRetries = 3
const retryDelayMs = 2000

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function tryRemove() {
  if (!fs.existsSync(distUnpacked)) return true
  for (const name of exeNames) {
    const exe = path.join(distUnpacked, name)
    if (fs.existsSync(exe)) {
      try {
        fs.unlinkSync(exe)
      } catch (e) {
        return false
      }
    }
  }
  try {
    fs.rmSync(distUnpacked, { recursive: true, maxRetries: 2, retryDelay: 100 })
  } catch (e) {
    return false
  }
  return true
}

async function main() {
  for (let i = 0; i < maxRetries; i++) {
    if (await tryRemove()) {
      console.log('[electron:build] dist/win-unpacked is free for packaging.')
      process.exit(0)
    }
    if (i < maxRetries - 1) {
      console.warn(`Attempt ${i + 1}: dist is locked. Waiting ${retryDelayMs}ms...`)
      await sleep(retryDelayMs)
    }
  }
  console.error('')
  console.error('Cannot overwrite dist\\win-unpacked (Access denied).')
  console.error('  - Close the AlBaz Vendor app if it is running.')
  console.error('  - Close any File Explorer window open in apps\\vendor\\dist.')
  console.error('  - Temporarily exclude dist folder from antivirus if needed.')
  console.error('Then run: npm run electron:build')
  console.error('')
  process.exit(1)
}

main()
