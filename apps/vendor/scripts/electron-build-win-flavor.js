/**
 * Windows pack for a vertical: sets VENDOR_BUILD_FLAVOR and merges electron-builder.flavor-<name>.yml
 * Usage: node scripts/electron-build-win-flavor.js <restaurant|retail|grocery|other>
 */
const path = require('path')
const { spawnSync } = require('child_process')

const ALLOWED = ['restaurant', 'retail', 'grocery', 'other']
const flavor = String(process.argv[2] || '').toLowerCase().trim()
if (!ALLOWED.includes(flavor)) {
  console.error('Usage: node scripts/electron-build-win-flavor.js <' + ALLOWED.join('|') + '>')
  process.exit(1)
}

const root = path.join(__dirname, '..')
const extraArgs =
  flavor === 'other' ? [] : ['--', '-c', path.join(root, `electron-builder.flavor-${flavor}.yml`)]

const result = spawnSync('npm', ['run', 'electron:build:win', ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VENDOR_BUILD_FLAVOR: flavor },
})

process.exit(result.status != null ? result.status : 1)
