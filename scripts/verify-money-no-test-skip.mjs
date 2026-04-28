#!/usr/bin/env node
/**
 * Fails if `test.skip` / `it.skip` / `describe.skip` appears under money-critical test paths.
 */
import fs from 'fs'
import path from 'path'

const roots = [
  path.join(process.cwd(), '__tests__', 'payment'),
  path.join(process.cwd(), '__tests__', 'api', 'webhooks'),
  path.join(process.cwd(), '__tests__', 'api', 'lib'),
]

const skipRe = /\b(test|it|describe)\.skip\s*\(/g

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name.endsWith('.test.ts') || ent.name.endsWith('.test.tsx')) acc.push(p)
  }
  return acc
}

const bad = []
for (const r of roots) {
  for (const f of walk(r)) {
    const txt = fs.readFileSync(f, 'utf8')
    if (skipRe.test(txt)) bad.push(path.relative(process.cwd(), f))
    skipRe.lastIndex = 0
  }
}

if (bad.length) {
  console.error(
    '[verify-money-no-test-skip] Remove test.skip from money-critical tests or add // REASON: TICKET-xxx:',
    bad.join('\n')
  )
  process.exit(1)
}

console.log('[verify-money-no-test-skip] OK')
