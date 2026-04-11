/**
 * Makes albaz-logo.png UI-ready: transparent where the solid black/neutral
 * background was, without recoloring logo artwork (green wordmark, warm bird).
 * Run from repo root: node apps/vendor/scripts/strip-albaz-logo-bg.mjs
 */
import sharp from "sharp"
import { readFileSync, writeFileSync, renameSync, unlinkSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logoPath = join(__dirname, "../public/assets/albaz-logo.png")
const tmpPath = join(__dirname, "../public/assets/albaz-logo.tmp.png")

function isLikelyLogoPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const avg = (r + g + b) / 3

  if (max < 14) return false

  // Olive / green wordmark (G channel leads)
  if (g >= r + 5 && g >= b + 5 && sat >= 10) return true

  // Warm bird: copper / gold / orange (R leads or high saturation warm)
  if (r >= 55 && (r >= g + 8 || sat >= 28)) return true
  if (sat >= 38 && avg > 25) return true

  return false
}

function isBackgroundPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const avg = (r + g + b) / 3

  if (isLikelyLogoPixel(r, g, b)) return false

  // Near-white matte (common export background)
  if (avg > 232 && sat < 38) return true

  // Pure / near-black
  if (max <= 22 && sat <= 18) return true

  // Dark neutral fringe (anti-alias on black)
  if (avg < 52 && sat < 26 && max < 72) return true

  return false
}

async function main() {
  let pipeline = sharp(logoPath).ensureAlpha()

  const meta = await pipeline.metadata()
  const longSide = Math.max(meta.width || 0, meta.height || 0)
  if (longSide > 0 && longSide < 512) {
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
    if (isBackgroundPixel(r, g, b)) {
      out[o + 3] = 0
    }
  }

  await sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(tmpPath)

  renameSync(tmpPath, logoPath)
  console.log(`Transparent logo written: ${logoPath} (${w}x${h})`)
}

main().catch((err) => {
  console.error(err)
  try {
    unlinkSync(tmpPath)
  } catch {
    /* ignore */
  }
  process.exit(1)
})
