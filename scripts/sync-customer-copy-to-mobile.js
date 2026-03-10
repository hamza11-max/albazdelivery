#!/usr/bin/env node
/**
 * Syncs shared customer copy (packages/shared) to mobile customer app.
 * Run from repo root: node scripts/sync-customer-copy-to-mobile.js
 * Or: npm run sync:customer-copy
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'packages', 'shared', 'src', 'customer-copy.json');
const OUT_DIR = path.join(ROOT, 'mobile-apps', 'customer-app');
const OUT_JSON = path.join(OUT_DIR, 'copy.json');
const OUT_TS = path.join(OUT_DIR, 'copy.ts');

if (!fs.existsSync(SOURCE)) {
  console.warn('sync-customer-copy: source not found (run from repo root)');
  process.exit(0);
}
if (!fs.existsSync(OUT_DIR)) {
  console.warn('sync-customer-copy: mobile-app dir not found');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

// Write copy.json for mobile import
fs.writeFileSync(OUT_JSON, JSON.stringify(data, null, 2), 'utf8');
console.log('Wrote', OUT_JSON);

// Write copy.ts that re-exports with type so mobile gets same structure
const tsContent = `/**
 * Auto-generated from packages/shared/src/customer-copy.json
 * Do not edit by hand. Run from repo root: npm run sync:customer-copy
 */
const copy = ${JSON.stringify(data, null, 2)} as const;
export type CustomerCopy = typeof copy;
export default copy;
`;
fs.writeFileSync(OUT_TS, tsContent, 'utf8');
console.log('Wrote', OUT_TS);
