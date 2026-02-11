/**
 * Remove .next and Next.js cache so the next "next build" is a full rebuild.
 * Use before electron build so the packaged app always has the latest UI/code.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const nextDir = path.join(root, '.next')
const cacheDir = path.join(root, 'node_modules', '.cache')

function remove(dir, label) {
  if (!fs.existsSync(dir)) return
  try {
    fs.rmSync(dir, { recursive: true, maxRetries: 3, retryDelay: 100 })
    console.log('[clean-next] Removed ' + label)
  } catch (err) {
    console.warn('[clean-next] Could not remove ' + label + ':', err.message)
  }
}

remove(nextDir, '.next')
remove(cacheDir, 'node_modules/.cache')
