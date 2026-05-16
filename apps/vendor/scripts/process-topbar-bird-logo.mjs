/**
 * Removes flat background from the vendor mark (PNG) — matte black, navy slate, or cool UI lines.
 * Input: apps/vendor/public/_topbar-bird-source.png (replace with new export when needed)
 * Output: apps/vendor/public/logo.png (+ public/assets/albaz-logo.png + assets/logo.png for Electron)
 *
 * Run from repo root:
 *   node apps/vendor/scripts/process-topbar-bird-logo.mjs
 */
import sharp from "sharp"
import { copyFileSync, mkdirSync, unlinkSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, "../public/_topbar-bird-source.png")
const outLogo = join(__dirname, "../public/logo.png")
const outAsset = join(__dirname, "../public/assets/albaz-logo.png")
const assetsLogo = join(__dirname, "../assets/logo.png")
const tmpPath = join(__dirname, "../public/_topbar-bird.tmp.png")

/** Pixels that belong to the mark (warm phoenix, glow, dark warm outline) — not navy/cool BG. */
function isForeground(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const avg = (r + g + b) / 3

  if (max < 12) return false

  // Fire / gold / orange (bird, diamonds, hot glow)
  if (r > b + 18 && sat > 14) return true
  if (r > 70 && g > 35 && sat > 28) return true
  if (sat > 38 && r + g > b * 2 - 10 && avg > 35) return true
  if (r > 200 && g > 100 && b < 200 && sat > 25) return true

  // Deep navy / blue-grey background (#121B26 family) and cool midtones
  if (b >= r - 2 && b >= g - 2 && max < 100 && sat < 58) return false
  if (b > r + 8 && avg < 72) return false
  if (avg < 52 && sat < 45 && b + 4 >= r && b + 4 >= g) return false

  // Subtle cool geometric lines on dark
  if (avg > 50 && avg < 200 && b >= r && b >= g && sat < 58 && r < 230) return false

  // Dark warm outline (thick border around the mark)
  if (avg > 20 && avg < 120 && sat > 10 && sat < 72 && r > b - 8) return true

  // Drop ambiguous dark/cool pixels (reduces navy halos)
  if (avg < 72 && sat < 52 && !(r > b + 12)) return false

  return sat > 18 && r > b - 10
}

async function main() {
  let pipeline = sharp(inputPath).ensureAlpha()

  const meta = await pipeline.metadata()
  const longSide = Math.max(meta.width || 0, meta.height || 0)
  /** Downscale before CPU matting — full-res 4K+ is too slow in JS per-pixel loop. */
  const maxMatteSide = 1280
  if (longSide > maxMatteSide) {
    pipeline = pipeline.resize({
      width: (meta.width || 0) >= (meta.height || 0) ? maxMatteSide : undefined,
      height: (meta.height || 0) > (meta.width || 0) ? maxMatteSide : undefined,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
  } else if (longSide > 0 && longSide < 384) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? 512 : undefined,
      height: meta.height > meta.width ? 512 : undefined,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
  }

  const { data, info } = await pipeline.clone().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const out = Buffer.from(data)

  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    if (!isForeground(r, g, b)) {
      out[o + 3] = 0
    }
  }

  await sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(tmpPath)

  copyFileSync(tmpPath, outLogo)
  copyFileSync(tmpPath, outAsset)
  unlinkSync(tmpPath)

  mkdirSync(join(__dirname, "../assets"), { recursive: true })
  copyFileSync(outLogo, assetsLogo)

  console.log(`Topbar bird logo (transparent) → ${outLogo}, ${outAsset}, ${assetsLogo} (${w}x${h})`)
  console.log("Then run from apps/vendor: npm run setup:icons (ICO + shortcut + square PWA icons).")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
