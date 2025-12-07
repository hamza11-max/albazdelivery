#!/usr/bin/env node

/**
 * Icon Setup Helper Script
 * Helps convert logo.png to required icon formats
 */

const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '../assets')
const logoPath = path.join(assetsDir, 'logo.png')

console.log('🎨 AlBaz Vendor - Icon Setup Helper\n')

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('❌ Error: logo.png not found in assets directory')
  console.log('   Expected location:', logoPath)
  process.exit(1)
}

console.log('✅ Found logo.png')

// Check for existing icons
const iconIco = path.join(assetsDir, 'icon.ico')
const iconIcns = path.join(assetsDir, 'icon.icns')
const iconPng = path.join(assetsDir, 'icon.png')

const icons = {
  'icon.ico (Windows)': iconIco,
  'icon.icns (macOS)': iconIcns,
  'icon.png (Linux)': iconPng,
}

console.log('\n📋 Icon Status:')
let allExist = true
for (const [name, filePath] of Object.entries(icons)) {
  const exists = fs.existsSync(filePath)
  console.log(`   ${exists ? '✅' : '❌'} ${name}`)
  if (!exists) allExist = false
}

if (allExist) {
  console.log('\n✅ All icons are ready!')
  console.log('   You can now build the Electron app: npm run electron:build:win')
  process.exit(0)
}

console.log('\n📝 To create missing icons:')
console.log('\n   Option 1: Online Converter (Easiest)')
console.log('   1. Visit: https://convertio.co/png-ico/')
console.log('   2. Upload:', logoPath)
console.log('   3. Download icon.ico')
console.log('   4. Save to:', assetsDir)
console.log('\n   Option 2: electron-icon-maker')
console.log('   npm install -g electron-icon-maker')
console.log('   cd', assetsDir)
console.log('   electron-icon-maker --input=logo.png --output=.')
console.log('\n   Option 3: ImageMagick')
console.log('   magick convert logo.png -define icon:auto-resize=16,32,48,64,128,256 icon.ico')

console.log('\n📚 See assets/ICON_SETUP.md for detailed instructions')

