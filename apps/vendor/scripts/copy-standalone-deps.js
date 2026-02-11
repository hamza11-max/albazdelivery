/**
 * After next build (standalone): copy dependencies that Next.js standalone sometimes
 * omits but that the server requires at runtime (e.g. styled-jsx/package.json).
 * Prevents "Cannot find module 'styled-jsx/package.json'" when running the packaged app.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const appNodeModules = path.join(root, 'node_modules')
const workspaceNodeModules = path.join(root, '..', '..', 'node_modules')
const standaloneRoot = path.join(root, '.next', 'standalone')

// Packages that Next standalone may not include correctly (server needs them)
const STANDALONE_DEPS = ['styled-jsx']

if (!fs.existsSync(standaloneRoot)) {
  console.warn('[copy-standalone-deps] .next/standalone not found, skipping')
  process.exit(0)
}

function findPackageSource(pkg) {
  const inApp = path.join(appNodeModules, pkg)
  if (fs.existsSync(inApp) && fs.existsSync(path.join(inApp, 'package.json'))) return inApp
  const inWorkspace = path.join(workspaceNodeModules, pkg)
  if (fs.existsSync(inWorkspace) && fs.existsSync(path.join(inWorkspace, 'package.json'))) return inWorkspace
  return null
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return
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

function ensureDepInStandalone(standaloneNodeModules) {
  if (!fs.existsSync(standaloneNodeModules)) {
    fs.mkdirSync(standaloneNodeModules, { recursive: true })
  }
  for (const pkg of STANDALONE_DEPS) {
    const src = findPackageSource(pkg)
    const dest = path.join(standaloneNodeModules, pkg)
    if (src) {
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true })
      copyRecursive(src, dest)
      console.log('[copy-standalone-deps] Copied ' + pkg + ' into standalone node_modules (from ' + src + ')')
    } else {
      console.warn('[copy-standalone-deps] Source not found for ' + pkg + ' (tried ' + appNodeModules + ' and ' + workspaceNodeModules + ')')
    }
  }
}

try {
  const standaloneVendor = path.join(standaloneRoot, 'apps', 'vendor')
  const vendorNodeModules = path.join(standaloneVendor, 'node_modules')
  const rootNodeModules = path.join(standaloneRoot, 'node_modules')

  if (fs.existsSync(standaloneVendor)) {
    ensureDepInStandalone(vendorNodeModules)
  }
  ensureDepInStandalone(rootNodeModules)
} catch (err) {
  console.error('[copy-standalone-deps] Error:', err.message)
  process.exit(1)
}
