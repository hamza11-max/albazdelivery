/**
 * After next build (standalone): copy `public/` into the standalone tree so
 * `/logo.png`, `/sw.js`, `/manifest.webmanifest`, etc. exist beside `server.js`
 * (monorepo standalone layouts sometimes omit or trim `public`).
 */
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")
const publicDir = path.join(root, "public")
const standaloneRoot = path.join(root, ".next", "standalone")

if (!fs.existsSync(publicDir)) {
  console.warn("[copy-standalone-public] public/ not found, skipping")
  process.exit(0)
}
if (!fs.existsSync(standaloneRoot)) {
  console.warn("[copy-standalone-public] .next/standalone not found, skipping")
  process.exit(0)
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

try {
  const standaloneVendor = path.join(standaloneRoot, "apps", "vendor")
  if (fs.existsSync(standaloneVendor)) {
    const dest = path.join(standaloneVendor, "public")
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true })
    copyRecursive(publicDir, dest)
    console.log("[copy-standalone-public] Copied public/ → standalone/apps/vendor/public")
  }
  const destRoot = path.join(standaloneRoot, "public")
  if (fs.existsSync(destRoot)) fs.rmSync(destRoot, { recursive: true })
  copyRecursive(publicDir, destRoot)
  console.log("[copy-standalone-public] Copied public/ → standalone/public")
} catch (err) {
  console.error("[copy-standalone-public] Error:", err.message)
  process.exit(1)
}
