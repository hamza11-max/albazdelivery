/**
 * Minimal ESC/POS encoding for image (raster) receipts.
 *
 * Text mode on cheap thermal printers cannot shape Arabic, so the whole receipt
 * is rendered by Chromium and sent as a 1-bit bitmap with `GS v 0`.
 */

const ESC = 0x1b
const GS = 0x1d

/** Rows per `GS v 0` command. Small bands keep cheap printers' buffers from overflowing. */
const BAND_ROWS = 128

/** Printable width in dots at 203 dpi. */
export const PAPER_DOTS = { 58: 384, 80: 576 } as const
export type PaperWidth = keyof typeof PAPER_DOTS

/** `ESC p 0 25 250`: pulse drawer pin 2 for 50 ms on / 500 ms off. */
export const DRAWER_KICK = Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa])

export interface MonoImage {
  width: number
  height: number
  /** Packed rows, MSB first, 1 = black. Each row is `bytesPerRow` long. */
  bytesPerRow: number
  data: Uint8Array
}

/**
 * Converts a BGRA bitmap (Electron's `NativeImage.toBitmap()` layout) to 1-bit
 * with Floyd-Steinberg dithering. Text stays crisp because it is already
 * near-black or near-white; only logos/greys get dithered.
 */
export function toMonochrome(bgra: Uint8Array, width: number, height: number): MonoImage {
  if (bgra.length < width * height * 4) {
    throw new Error(`bitmap too small: ${bgra.length} bytes for ${width}x${height}`)
  }
  const lum = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const b = bgra[i * 4]!
    const g = bgra[i * 4 + 1]!
    const r = bgra[i * 4 + 2]!
    const a = bgra[i * 4 + 3]! / 255
    // Composite on white so transparent pixels print as paper.
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    lum[i] = y * a + 255 * (1 - a)
  }

  const bytesPerRow = Math.ceil(width / 8)
  const data = new Uint8Array(bytesPerRow * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const old = lum[i]!
      const black = old < 128
      const err = old - (black ? 0 : 255)
      if (black) data[y * bytesPerRow + (x >> 3)]! |= 0x80 >> (x & 7)

      if (x + 1 < width) lum[i + 1]! += (err * 7) / 16
      if (y + 1 < height) {
        if (x > 0) lum[i + width - 1]! += (err * 3) / 16
        lum[i + width]! += (err * 5) / 16
        if (x + 1 < width) lum[i + width + 1]! += (err * 1) / 16
      }
    }
  }

  return { width, height, bytesPerRow, data }
}

/** `GS v 0` raster commands for the image, split into bands. */
export function rasterCommands(img: MonoImage): Buffer {
  const parts: Buffer[] = []
  for (let top = 0; top < img.height; top += BAND_ROWS) {
    const rows = Math.min(BAND_ROWS, img.height - top)
    parts.push(
      Buffer.from([
        GS, 0x76, 0x30, 0x00,
        img.bytesPerRow & 0xff, (img.bytesPerRow >> 8) & 0xff,
        rows & 0xff, (rows >> 8) & 0xff,
      ]),
      Buffer.from(img.data.subarray(top * img.bytesPerRow, (top + rows) * img.bytesPerRow)),
    )
  }
  return Buffer.concat(parts)
}

export interface JobOptions {
  cut?: boolean
  openDrawer?: boolean
}

/** Full print job: init, image, feed, optional partial cut and drawer kick. */
export function receiptJob(img: MonoImage, opts: JobOptions = {}): Buffer {
  const parts = [
    Buffer.from([ESC, 0x40]), // ESC @ initialise
    rasterCommands(img),
    Buffer.from([ESC, 0x64, 0x04]), // ESC d 4: feed 4 lines past the cutter
  ]
  if (opts.cut !== false) parts.push(Buffer.from([GS, 0x56, 0x42, 0x00])) // GS V 66 0: feed + partial cut
  if (opts.openDrawer) parts.push(DRAWER_KICK)
  return Buffer.concat(parts)
}
