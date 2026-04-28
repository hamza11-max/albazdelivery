#!/usr/bin/env node
/**
 * Lists workspace app API ts files whose relative path is missing under root app/api.
 * Exit 1 if any paths are missing (drift risk). Opt out with VERIFY_API_PARITY_SKIP=1.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

if (process.env.VERIFY_API_PARITY_SKIP === '1') {
  console.log('[verify-api-parity] Skip (VERIFY_API_PARITY_SKIP=1)')
  process.exit(0)
}

function gitLs(pattern) {
  try {
    return execSync(`git ls-files "${pattern}"`, { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

const appFiles = gitLs('apps/admin/app/api/**/*.ts')
const mapped = appFiles.map((f) => {
  const m = f.match(/^apps\/admin\/app\/api\/(.+)$/)
  return m ? m[1] : null
}).filter(Boolean)

function walkTsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkTsFiles(p, acc)
    else if (ent.name.endsWith('.ts')) acc.push(p)
  }
  return acc
}

const rootFiles = new Set(
  walkTsFiles(path.join(process.cwd(), 'app', 'api')).map((f) =>
    path.relative(process.cwd(), f).replace(/\\/g, '/')
  )
)

const missing = []
for (const rel of mapped) {
  if (!rel.endsWith('route.ts') && !rel.endsWith('.ts')) continue
  const candidate = path.join('app', 'api', rel).replace(/\\/g, '/')
  if (!rootFiles.has(candidate)) missing.push(candidate)
}

if (missing.length) {
  console.error(
    '[verify-api-parity] Workspace API files without matching root path (add mirror or document exception):\n' +
      missing.slice(0, 80).join('\n') +
      (missing.length > 80 ? `\n... and ${missing.length - 80} more` : '')
  )
  process.exit(1)
}

console.log('[verify-api-parity] OK')
