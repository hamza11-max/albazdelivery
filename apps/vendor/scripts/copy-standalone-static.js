/**
 * After next build (standalone): copy .next/static into .next/standalone/apps/vendor/.next/static
 * so the standalone server (run from apps/vendor) finds static assets and does not exit with code 1.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const staticDir = path.join(root, '.next', 'static')
const standaloneStaticDir = path.join(root, '.next', 'standalone', 'apps', 'vendor', '.next', 'static')

if (!fs.existsSync(staticDir)) {
  console.warn('[copy-standalone-static] .next/static not found, skipping')
  process.exit(0)
}

const standaloneRoot = path.join(root, '.next', 'standalone')
if (!fs.existsSync(standaloneRoot)) {
  console.warn('[copy-standalone-static] .next/standalone not found, skipping')
  process.exit(0)
}

// Target 1: standalone/apps/vendor/.next/static (monorepo layout; server runs from apps/vendor)
const standaloneVendor = path.join(standaloneRoot, 'apps', 'vendor')
const targetVendor = path.join(standaloneVendor, '.next', 'static')
// Target 2: standalone/.next/static (single-app layout; server runs from standalone root)
const targetRoot = path.join(standaloneRoot, '.next', 'static')

function copyTo(destDir) {
  const parent = path.dirname(destDir)
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true })
  }
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true })
  }
  copyRecursive(staticDir, destDir)
}

try {
  if (fs.existsSync(standaloneVendor)) {
    copyTo(targetVendor)
    console.log('[copy-standalone-static] Copied .next/static into standalone/apps/vendor/.next/static')
  }
  copyTo(targetRoot)
  console.log('[copy-standalone-static] Copied .next/static into standalone/.next/static')
} catch (err) {
  console.error('[copy-standalone-static] Error:', err.message)
  process.exit(1)
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name)
    const destPath = path.join(dest, name)
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
