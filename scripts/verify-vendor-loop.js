const { chromium } = require('playwright')
const http = require('http')
const https = require('https')

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForUrl(url, timeoutMs = 180000, intervalMs = 1000) {
  const start = Date.now()
  const isHttps = url.startsWith('https:')
  const client = isHttps ? https : http

  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = client.request(url, { method: 'HEAD', timeout: 2000 }, (res) => {
          res.resume()
          resolve(res.statusCode)
        })
        req.on('error', reject)
        req.on('timeout', () => {
          req.destroy()
          reject(new Error('timeout'))
        })
        req.end()
      })
      return true
    } catch (e) {
      await wait(intervalMs)
    }
  }
  return false
}

async function run() {
  const url = process.env.VENDOR_URL || 'http://localhost:3001/vendor'
  console.log('Waiting for vendor server to become available at', url)
  const ok = await waitForUrl(url, 180000, 1000)
  if (!ok) {
    console.error('Timed out waiting for vendor server at', url)
    process.exit(2)
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let consoleErrors = []
  let pageErrors = []
  let maxUpdateDetected = false

  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error' || /error/i.test(msg.type())) {
      consoleErrors.push(text)
    }
    if (/Maximum update depth exceeded/.test(text)) {
      maxUpdateDetected = true
    }
    console.log('[console]', msg.type(), text)
  })

  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
    if (/Maximum update depth exceeded/.test(err.message)) {
      maxUpdateDetected = true
    }
    console.error('[pageerror]', err.message)
  })

  // Also capture window.onerror via evaluate
  await page.exposeFunction('nodeLog', (type, msg) => {
    if (/Maximum update depth exceeded/.test(msg)) maxUpdateDetected = true
    console.log('[window]', type, msg)
  })

  await page.addInitScript(() => {
    const orig = window.onerror
    window.onerror = function (msg, src, line, col, err) {
      try { window.nodeLog('error', String(msg)) } catch (e) {}
      if (orig) return orig(msg, src, line, col, err)
      return false
    }
  })

  console.log('Navigating to', url)
  try {
    // Wait for full load (not only DOMContentLoaded) and allow extra time in dev
    const response = await page.goto(url, { waitUntil: 'load', timeout: 180000 })
    console.log('Initial response status:', response && response.status())
  } catch (err) {
    console.error('Failed to load page:', err.message)
    // Dump a short HTML snapshot to help debugging
    try {
      const html = await (await page.content()).slice(0, 2000)
      console.error('Page snapshot (truncated):', html)
    } catch (e) {
      // ignore
    }
    await browser.close()
    process.exit(2)
  }

  // Wait longer for client runtime and HMR to settle; poll for the specific error
  const maxWaitMs = 120000
  const pollInterval = 1000
  let waited = 0
  while (waited < maxWaitMs && !maxUpdateDetected) {
    await wait(pollInterval)
    waited += pollInterval
  }

  await browser.close()

  if (maxUpdateDetected) {
    console.error('Detected "Maximum update depth exceeded" on the vendor page')
    process.exit(1)
  }

  console.log('No infinite update error detected (vendor page)')
  process.exit(0)
}

run().catch((err) => {
  console.error('Script failed:', err)
  process.exit(3)
})
