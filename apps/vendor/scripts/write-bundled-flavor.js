/**
 * Writes apps/vendor/bundled-flavor.json before electron-pack.
 * Reads VENDOR_BUILD_FLAVOR: restaurant | retail | grocery | other (default).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'bundled-flavor.json')
const ALLOWED = new Set(['restaurant', 'retail', 'grocery', 'other'])

const raw = (process.env.VENDOR_BUILD_FLAVOR || 'other').toLowerCase().trim()
const shopType = ALLOWED.has(raw) ? raw : 'other'

fs.writeFileSync(OUT, JSON.stringify({ shopType }, null, 2), 'utf8')
console.log('[write-bundled-flavor]', OUT, '→', shopType)
