/**
 * One-off / idempotent: prefix `applyRateLimit(` with `await` on its own statement line.
 * Skips lib/rate-limit.ts (definition) and lines that already have `await applyRateLimit`.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || '.')
const skipDirs = new Set(['node_modules', '.next', 'generated', 'dist', '.git', 'mcps'])

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (skipDirs.has(ent.name)) continue
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) {
      out.push(p)
    }
  }
  return out
}

let updated = 0
for (const f of walk(root)) {
  if (f.replace(/\\/g, '/').endsWith('lib/rate-limit.ts')) continue
  let s = fs.readFileSync(f, 'utf8')
  if (!s.includes('applyRateLimit(')) continue
  const orig = s
  const lines = s.split('\n')
  const next = lines.map((line) => {
    if (line.includes('import') && line.includes('applyRateLimit')) return line
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('//')) return line
    if (t.startsWith('*')) return line
    if (t.includes('applyRateLimit(') && !t.includes('await applyRateLimit(')) {
      return line.replace(/^(\s*)applyRateLimit\(/, '$1await applyRateLimit(')
    }
    return line
  })
  s = next.join('\n')
  if (s !== orig) {
    fs.writeFileSync(f, s)
    updated++
  }
}
console.log(`add-await-apply-rate-limit: updated ${updated} files`)
