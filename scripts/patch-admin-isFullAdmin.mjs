import fs from 'fs'
import path from 'path'

const roots = [
  path.resolve('app/api/admin'),
  path.resolve('apps/admin/app/api/admin'),
]

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, files)
    else if (p.endsWith('.ts')) files.push(p)
  }
  return files
}

for (const root of roots) {
  for (const file of walk(root)) {
    let t = fs.readFileSync(file, 'utf8')
    const orig = t

    t = t.replace(
      /if \(!session\?\.user \|\| String\(session\.user\.role \?\? ''\)\.toUpperCase\(\) !== 'ADMIN'\)/g,
      'if (!session?.user || !isFullAdmin(session.user.role)'
    )
    t = t.replace(
      /if \(String\(session\.user\.role \?\? ''\)\.toUpperCase\(\) !== 'ADMIN'\)/g,
      'if (!isFullAdmin(session.user.role)'
    )
    t = t.replace(
      /if \(String\(session\.user\?\.role \|\| ''\)\.toUpperCase\(\) !== 'ADMIN'\)/g,
      'if (!isFullAdmin(session.user?.role)'
    )
    t = t.replace(
      /if \(String\(session\.user\.role\)\.toUpperCase\(\) !== 'ADMIN'\)/g,
      'if (!isFullAdmin(session.user.role)'
    )
    t = t.replace(
      /if \(session\.user\.role !== 'ADMIN'\)/g,
      'if (!isFullAdmin(session.user.role)'
    )

    if (t === orig) continue

    const imp = `import { isFullAdmin } from '@/root/lib/admin-roles'`

    if (!t.includes("@/root/lib/admin-roles")) {
      const lines = t.split('\n')
      let insertAt = 0
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) insertAt = i + 1
        else if (lines[i].trim() && !lines[i].startsWith('import ')) break
      }
      lines.splice(insertAt, 0, imp)
      t = lines.join('\n')
    }

    fs.writeFileSync(file, t)
    console.log('patched', file)
  }
}
