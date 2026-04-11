/**
 * Removes solid black / neutral matte from the topbar bird mark (PNG).
 * Input: apps/vendor/public/_topbar-bird-source.png (replace with new export when needed)
 * Output: apps/vendor/public/logo.png (+ copies to public/assets/albaz-logo.png)
 *
 * Run from repo root:
 *   node apps/vendor/scripts/process-topbar-bird-logo.mjs
 */
import sharp from "sharp"
import { copyFileSync, unlinkSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, "../public/_topbar-bird-source.png")
const outLogo = join(__dirname, "../public/logo.png")
const outAsset = join(__dirname, "../public/assets/albaz-logo.png")
const tmpPath = join(__dirname, "../public/_topbar-bird.tmp.png")

/** Pixels that belong to the bird, diamonds, or outline — not flat black. */
function isForeground(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const avg = (r + g + b) / 3

  if (max < 10) return false

  // Saturated wing / diamonds (orange–red–yellow)
  if (sat > 16 && avg > 24) return true
  if (r > 34 && sat > 10) return true

  // Dark olive / brown outline (not pure black)
  if (avg > 18 && avg < 110 && sat > 6 && sat < 55) return true

  return false
}

async function main() {
  let pipeline = sharp(inputPath).ensureAlpha()

  const meta = await pipeline.metadata()
  const longSide = Math.max(meta.width || 0, meta.height || 0)
  if (longSide > 0 && longSide < 384) {
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

  console.log(`Topbar bird logo (transparent) → ${outLogo} and ${outAsset} (${w}x${h})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
