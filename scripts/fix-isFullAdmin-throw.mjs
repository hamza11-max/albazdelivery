import fs from 'fs'
import path from 'path'

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name)
    if (n.isDirectory()) walk(p, files)
    else if (n.name.endsWith('.ts')) files.push(p)
  }
  return files
}

for (const f of walk('app/api/admin').concat(walk('apps/admin/app/api/admin'))) {
  let t = fs.readFileSync(f, 'utf8')
  const o = t
  t = t.replace(/!isFullAdmin\(session\.user\.role\) throw/g, '!isFullAdmin(session.user.role)) throw')
  t = t.replace(/!isFullAdmin\(session\.user\?\.role\) throw/g, '!isFullAdmin(session.user?.role)) throw')
  if (t !== o) {
    fs.writeFileSync(f, t)
    console.log('fix throw', f)
  }
}
