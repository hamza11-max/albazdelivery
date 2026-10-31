// Runs Electron's bundled Node (ELECTRON_RUN_AS_NODE) with the given arguments.
// Native modules like better-sqlite3 are built for Electron's ABI, so tests that
// open a database must run here rather than under the system Node.
const { spawnSync } = require('node:child_process')
const electron = require('electron')

const result = spawnSync(electron, process.argv.slice(2), {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
})
process.exit(result.status ?? 1)
