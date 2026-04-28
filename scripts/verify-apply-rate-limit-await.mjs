/**
 * Fails (exit 1) if a route file calls applyRateLimit( without "await" on the same line.
 * Run in CI: npm run check:rate-limit
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || '.')
const skip = new Set(['node_modules', '.next', 'generated', 'dist', 'mcps', 'scripts/add-await-apply-rate-limit.mjs'])

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (skip.has(ent.name)) continue
      walk(p, out)
    } else if (ent.name === 'route.ts' && /[/\\]api[/\\]/.test(p) && p.includes('route.ts')) {
      out.push(p)
    }
  }
  return out
}

let bad = []
for (const f of walk(root)) {
  if (f.replace(/\\/g, '/').endsWith('lib/rate-limit.ts')) continue
  const s = fs.readFileSync(f, 'utf8')
  const lines = s.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*')) continue
    if (!t.includes('applyRateLimit(')) continue
    if (t.includes('await applyRateLimit(')) continue
    if (t.includes('import') && t.includes('applyRateLimit')) continue
    if (t.includes('export') && t.includes('applyRateLimit')) continue
    bad.push(`${f.replace(root + path.sep, '')}:${i + 1}: ${t.slice(0, 120)}`)
  }
}

if (bad.length) {
  console.error('applyRateLimit( must be awaited on the same line in API routes:\n')
  for (const b of bad) console.error(' ', b)
  process.exit(1)
}
console.log('check:rate-limit: OK (no un-awaited applyRateLimit in api route.ts files)')
