/**
 * Verify Electron build prerequisites and output.
 * Run after "npm run build:electron" to check standalone, or after full build to check dist.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const standaloneServer = path.join(ROOT, '.next', 'standalone', 'apps', 'vendor', 'server.js')
const nodeExe = path.join(ROOT, 'build', 'node', 'node.exe')
const distUnpacked = path.join(ROOT, 'dist', 'win-unpacked')
const distExe = path.join(distUnpacked, 'AlBazVendor.exe')
const distStandalone = path.join(distUnpacked, '.next', 'standalone', 'apps', 'vendor', 'server.js')
const distNode = path.join(distUnpacked, 'resources', 'node', 'node.exe')

function check(name, filePath, required) {
  const exists = fs.existsSync(filePath)
  const status = exists ? 'OK' : (required ? 'MISSING' : 'optional')
  console.log(`  [${status}] ${name}`)
  if (required && !exists) console.log(`      path: ${filePath}`)
  return exists || !required
}

console.log('Build verification (apps/vendor)\n')

console.log('1. After "npm run build:electron" (Next.js standalone):')
check('Standalone server', standaloneServer, true)

console.log('\n2. After "node scripts/download-node-win.js" (Node for Windows):')
check('Bundled node.exe', nodeExe, true)

console.log('\n3. After full "npm run electron:build" (packaged app):')
const hasDist = fs.existsSync(distUnpacked)
check('dist/win-unpacked', distUnpacked, true)
if (hasDist) {
  check('AlBaz Vendor.exe', distExe, true)
  check('.next/standalone (extraFiles)', distStandalone, true)
  check('resources/node/node.exe', distNode, true)
}

console.log('')
process.exit(0)
