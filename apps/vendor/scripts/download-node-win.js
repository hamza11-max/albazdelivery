/**
 * Download Node.js Windows x64 binary for bundling with Electron.
 * Puts node.exe in build/node/node.exe so extraResources can ship it.
 * Run before electron-builder on Windows (e.g. in electron:build).
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const BUILD_NODE = path.join(ROOT, 'build', 'node')
const NODE_EXE = path.join(BUILD_NODE, 'node.exe')

if (process.platform !== 'win32') {
  console.log('[download-node-win] Skipping (not Windows). Bundle Node only needed for Windows exe.')
  process.exit(0)
}

if (fs.existsSync(NODE_EXE)) {
  console.log('[download-node-win] build/node/node.exe already exists, skipping.')
  process.exit(0)
}

try {
  const ps1 = path.join(__dirname, 'download-node-win.ps1')
  execSync(`powershell -ExecutionPolicy Bypass -File "${ps1}"`, { cwd: ROOT, stdio: 'inherit' })
} catch (e) {
  console.error('[download-node-win] Failed:', e.message)
  process.exit(1)
}
