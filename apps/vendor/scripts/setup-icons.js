#!/usr/bin/env node

/**
 * Icon Setup Helper Script
 * - Syncs `public/logo.png` → `assets/logo.png` so Electron matches the browser mark.
 * - Generates `logo.ico` + copies to `build/icon.ico` for electron-builder.
 * - Writes square web assets: icon-192/512, apple-touch-icon, favicon.ico in public/.
 */

const fs = require('fs')
const path = require('path')

const vendorRoot = path.join(__dirname, '..')
const assetsDir = path.join(vendorRoot, 'assets')
const publicDir = path.join(vendorRoot, 'public')
const logoPath = path.join(assetsDir, 'logo.png')
const publicLogoPath = path.join(publicDir, 'logo.png')
const logoIcoPath = path.join(assetsDir, 'logo.ico')

console.log('🎨 AlBaz Vendor - Icon Setup Helper\n')

/** Single source for the dashboard mark in the browser lives in `public/`; Electron reads `assets/`. */
function syncPublicLogoToAssets() {
  if (!fs.existsSync(publicLogoPath)) {
    if (!fs.existsSync(logoPath)) {
      console.warn('   No public/logo.png or assets/logo.png — add artwork first')
    }
    return
  }
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.copyFileSync(publicLogoPath, logoPath)
  console.log('   Synced public/logo.png → assets/logo.png')
}

async function writeSquarePngOutputs() {
  if (!fs.existsSync(logoPath)) return false
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.warn('   sharp unavailable; skipping web PNG icons')
    return false
  }
  const write = async (relativeName, px) => {
    const out = path.join(publicDir, relativeName)
    await sharp(logoPath)
      .resize(px, px, {
        fit: 'contain',
        background: { r: 18, g: 27, b: 38, alpha: 1 }, // matches theme_color / background
      })
      .png({ compressionLevel: 9 })
      .toFile(out)
    console.log(`   ✅ public/${relativeName} (${px}×${px})`)
    return true
  }
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
  await write('icon-192.png', 192)
  await write('icon-512.png', 512)
  await sharp(logoPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 18, g: 27, b: 38, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('   ✅ public/apple-touch-icon.png (180×180)')
  return true
}

async function copyIcoToPublicFavicon() {
  const dest = path.join(publicDir, 'favicon.ico')
  if (!fs.existsSync(logoIcoPath)) return
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
  fs.copyFileSync(logoIcoPath, dest)
  console.log('   ✅ Copied logo.ico → public/favicon.ico')
}

/** Square PNGs + favicon from current assets/logo.png and assets/logo.ico. */
async function refreshWebDerivedIcons() {
  try {
    await writeSquarePngOutputs()
  } catch (err) {
    console.warn('   Web PNG icons skipped:', err.message)
  }
  await copyIcoToPublicFavicon()
}

// Try to generate logo.ico from logo.png (used by Electron Windows exe and window icon)
function tryGenerateIco() {
  try {
    const mod = require('png-to-ico')
    const pngToIco = typeof mod === 'function' ? mod : (mod.default || mod)
    if (typeof pngToIco !== 'function') return false
    return pngToIco
  } catch (e) {
    return false
  }
}

/** Large HD marks can hang png-to-ico; downscale for ICO only. */
async function resolveIcoSourcePng() {
  try {
    const sharp = require('sharp')
    const tmp = path.join(assetsDir, '.logo-256-for-ico.png')
    await sharp(logoPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(tmp)
    return tmp
  } catch (e) {
    console.warn('   sharp resize for ico skipped:', e.message)
    return logoPath
  }
}

async function run() {
  syncPublicLogoToAssets()

  const pngToIco = tryGenerateIco()
  if (fs.existsSync(logoPath) && pngToIco) {
    console.log('   Generating logo.ico from logo.png...')
    let icoSource = logoPath
    try {
      icoSource = await resolveIcoSourcePng()
      const buf = await pngToIco(icoSource)
      fs.writeFileSync(logoIcoPath, buf)
      console.log('✅ Created logo.ico (Windows)')
    } catch (err) {
      console.warn('   Could not generate logo.ico:', err.message)
    } finally {
      if (icoSource !== logoPath && fs.existsSync(icoSource)) {
        try {
          fs.unlinkSync(icoSource)
        } catch (_) {
          /* ignore */
        }
      }
    }
  }

  // Fallback: generate a simple branded ico if no source icon exists.
  if (!fs.existsSync(logoIcoPath)) {
    console.log('   Creating fallback logo.ico...')
    const width = 16
    const height = 16
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0) // reserved
    header.writeUInt16LE(1, 2) // icon type
    header.writeUInt16LE(1, 4) // image count

    const dibHeaderSize = 40
    const pixelDataSize = width * height * 4
    const maskRowSize = Math.ceil(width / 32) * 4
    const maskSize = maskRowSize * height
    const imageSize = dibHeaderSize + pixelDataSize + maskSize

    const entry = Buffer.alloc(16)
    entry.writeUInt8(width, 0)
    entry.writeUInt8(height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4) // planes
    entry.writeUInt16LE(32, 6) // bpp
    entry.writeUInt32LE(imageSize, 8)
    entry.writeUInt32LE(22, 12)

    const dib = Buffer.alloc(imageSize)
    dib.writeUInt32LE(dibHeaderSize, 0)
    dib.writeInt32LE(width, 4)
    dib.writeInt32LE(height * 2, 8) // include mask
    dib.writeUInt16LE(1, 12)
    dib.writeUInt16LE(32, 14)
    dib.writeUInt32LE(0, 16) // BI_RGB
    dib.writeUInt32LE(pixelDataSize, 20)
    dib.writeInt32LE(2835, 24)
    dib.writeInt32LE(2835, 28)

    const pixelOffset = dibHeaderSize
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = pixelOffset + ((height - 1 - y) * width + x) * 4
        const border = x < 2 || y < 2 || x > width - 3 || y > height - 3
        if (border) {
          dib[i] = 17 // B
          dib[i + 1] = 24 // G
          dib[i + 2] = 39 // R
          dib[i + 3] = 255 // A
        } else {
          dib[i] = 49 // B
          dib[i + 1] = 130 // G
          dib[i + 2] = 246 // R
          dib[i + 3] = 255 // A
        }
      }
    }

    fs.writeFileSync(logoIcoPath, Buffer.concat([header, entry, dib]))
    console.log('✅ Created fallback logo.ico')
  }

  if (fs.existsSync(logoIcoPath)) await refreshWebDerivedIcons()

  // Status: electron-builder expects assets/logo.ico (win), assets/logo.icns (mac), assets/logo.png (linux)
  const icons = {
    'logo.ico (Windows exe & window)': logoIcoPath,
    'logo.icns (macOS)': path.join(assetsDir, 'logo.icns'),
    'logo.png (Linux & tray)': logoPath,
  }

  console.log('\n📋 Icon Status:')
  for (const [name, filePath] of Object.entries(icons)) {
    const exists = fs.existsSync(filePath)
    console.log(`   ${exists ? '✅' : '❌'} ${name}`)
  }

  // electron-builder expects buildResources/build/icon.ico for Windows exe & shortcuts
  const buildDir = path.join(vendorRoot, 'build')
  const buildIconPath = path.join(buildDir, 'icon.ico')
  if (fs.existsSync(logoIcoPath)) {
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })
    fs.copyFileSync(logoIcoPath, buildIconPath)
    console.log('✅ Copied logo.ico → build/icon.ico (for installer & exe)')
  }

  if (fs.existsSync(logoIcoPath)) {
    console.log('\n✅ Windows icon (logo.ico) is ready. You can run: npm run electron:build:win')
  } else {
    console.log('\n📝 To create logo.ico for Windows:')
    console.log('   npm install png-to-ico --save-dev && npm run setup:icons')
    console.log('   Or: https://convertio.co/png-ico/ → upload logo.png → save as assets/logo.ico')
  }

  console.log('\n📚 See assets/ICON_SETUP.md for more options')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

