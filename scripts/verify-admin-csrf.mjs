#!/usr/bin/env node
/**
 * Ensures root app/api/admin route.ts mutating handlers reference csrfProtection.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve(process.cwd(), 'app', 'api', 'admin')

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name === 'route.ts') acc.push(p)
  }
  return acc
}

const files = walk(root)
const mutRe = /export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\s*\(/g
const offenders = []

for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8')
  if (!mutRe.test(txt)) continue
  mutRe.lastIndex = 0
  if (!txt.includes('csrfProtection')) {
    offenders.push(path.relative(process.cwd(), f))
  }
}

if (offenders.length) {
  console.error('[verify-admin-csrf] Missing csrfProtection in:', offenders.join('\n'))
  process.exit(1)
}

console.log('[verify-admin-csrf] OK')
