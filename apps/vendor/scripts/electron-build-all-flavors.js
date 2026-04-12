/**
 * One codebase → multiple Windows installers (sequential).
 * Runs electron-build-win-flavor.js for each vertical so bundled-flavor.json + electron-builder config stay aligned.
 *
 * Optional env: VENDOR_FLAVORS_TO_BUILD=comma list (default: restaurant,retail,grocery)
 * Example: VENDOR_FLAVORS_TO_BUILD=restaurant npm run electron:build:win:all-verticals
 */
const path = require("path")
const { spawnSync } = require("child_process")

const vendorRoot = path.join(__dirname, "..")
const defaultList = ["restaurant", "retail", "grocery"]
const fromEnv = process.env.VENDOR_FLAVORS_TO_BUILD
const flavors = fromEnv
  ? fromEnv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  : defaultList

const ALLOWED = new Set(["restaurant", "retail", "grocery", "other"])
for (const f of flavors) {
  if (!ALLOWED.has(f)) {
    console.error(`[electron-build-all-flavors] Unknown flavor "${f}". Allowed: ${[...ALLOWED].join(", ")}`)
    process.exit(1)
  }
}

console.log(`[electron-build-all-flavors] Building ${flavors.length} flavor(s): ${flavors.join(", ")}\n`)

for (let i = 0; i < flavors.length; i++) {
  const flavor = flavors[i]
  console.log(`\n========== (${i + 1}/${flavors.length}) FLAVOR: ${flavor} ==========\n`)
  const r = spawnSync("node", [path.join(__dirname, "electron-build-win-flavor.js"), flavor], {
    cwd: vendorRoot,
    stdio: "inherit",
    env: { ...process.env, VENDOR_BUILD_FLAVOR: flavor },
  })
  if (r.status !== 0 && r.status !== null) {
    console.error(`[electron-build-all-flavors] Flavor "${flavor}" failed with exit ${r.status}`)
    process.exit(r.status)
  }
}

console.log("\n[electron-build-all-flavors] All requested flavors completed.\n")
