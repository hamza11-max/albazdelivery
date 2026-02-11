/**
 * Clean dist folder with retries (handles EBUSY/locked files on Windows).
 */
const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')
const maxRetries = 5
const retryDelayMs = 1500

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function clean() {
  if (!fs.existsSync(distDir)) {
    console.log('Cleaned dist (already empty)')
    return
  }
  let lastErr
  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.rmSync(distDir, { recursive: true, maxRetries: 3, retryDelay: 200 })
      console.log('Cleaned dist')
      return
    } catch (err) {
      lastErr = err
      if (i < maxRetries - 1) {
        console.warn(`Clean attempt ${i + 1} failed (${err.code || err.message}), retrying in ${retryDelayMs}ms...`)
        await sleep(retryDelayMs)
      }
    }
  }
  console.warn('Could not clean dist (files may be locked). Close other apps using dist/ and try again.')
  console.warn('Continuing build anyway; electron-builder may overwrite.')
  process.exit(0)
}

clean().catch((err) => {
  console.warn('Clean failed:', err.message)
  process.exit(0)
})
