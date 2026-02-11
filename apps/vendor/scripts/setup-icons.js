#!/usr/bin/env node

/**
 * Icon Setup Helper Script
 * Uses logo.png as source; generates logo.ico for Windows (electron-builder uses assets/logo.ico).
 */

const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '../assets')
const logoPath = path.join(assetsDir, 'logo.png')
const logoIcoPath = path.join(assetsDir, 'logo.ico')

console.log('🎨 AlBaz Vendor - Icon Setup Helper\n')

if (!fs.existsSync(logoPath)) {
  console.error('❌ Error: logo.png not found in assets directory')
  console.log('   Expected location:', logoPath)
  process.exit(1)
}

console.log('✅ Found logo.png')

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

async function run() {
  const pngToIco = tryGenerateIco()
  if (pngToIco && !fs.existsSync(logoIcoPath)) {
    console.log('   Generating logo.ico from logo.png...')
    try {
      const buf = await pngToIco(logoPath)
      fs.writeFileSync(logoIcoPath, buf)
      console.log('✅ Created logo.ico (Windows)')
    } catch (err) {
      console.warn('   Could not generate logo.ico:', err.message)
    }
  }

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
  const buildDir = path.join(__dirname, '../build')
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

