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

function expectedVendorExeName() {
  let shopType = 'other'
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'bundled-flavor.json'), 'utf8')
    const bf = JSON.parse(raw)
    if (bf && typeof bf.shopType === 'string') shopType = bf.shopType.toLowerCase().trim()
  } catch {
    /* default other */
  }
  const map = {
    restaurant: 'AlBazVendorRestaurant.exe',
    retail: 'AlBazVendorRetail.exe',
    grocery: 'AlBazVendorGrocery.exe',
    other: 'AlBazVendor.exe',
  }
  return map[shopType] || map.other
}

const distExe = path.join(distUnpacked, expectedVendorExeName())
const distStandalone = path.join(distUnpacked, '.next', 'standalone', 'apps', 'vendor', 'server.js')
const distNode = path.join(distUnpacked, 'resources', 'node', 'node.exe')
const standalonePublicLogo = path.join(ROOT, '.next', 'standalone', 'apps', 'vendor', 'public', 'logo.png')

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
check('Standalone public/logo.png (after copy-standalone-public)', standalonePublicLogo, false)

console.log('\n2. After "node scripts/download-node-win.js" (Node for Windows):')
check('Bundled node.exe', nodeExe, true)

console.log('\n3. After full "npm run electron:build" (packaged app):')
const hasDist = fs.existsSync(distUnpacked)
check('dist/win-unpacked', distUnpacked, true)
if (hasDist) {
  check(`Vendor exe (${path.basename(distExe)})`, distExe, true)
  check('.next/standalone (extraFiles)', distStandalone, true)
  check('resources/node/node.exe', distNode, true)
}

console.log('')
process.exit(0)
