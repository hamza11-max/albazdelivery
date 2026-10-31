import { test } from 'node:test'
import assert from 'node:assert/strict'

import { DRAWER_KICK, rasterCommands, receiptJob, toMonochrome } from './escpos'

function solid(width: number, height: number, value: number, alpha = 255): Uint8Array {
  const px = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) px.set([value, value, value, alpha], i * 4)
  return px
}

test('white image packs to all zeros', () => {
  const img = toMonochrome(solid(16, 2, 255), 16, 2)
  assert.equal(img.bytesPerRow, 2)
  assert.deepEqual([...img.data], [0, 0, 0, 0])
})

test('black image packs to all ones, padding bits stay clear', () => {
  const img = toMonochrome(solid(10, 1, 0), 10, 1)
  assert.equal(img.bytesPerRow, 2)
  assert.deepEqual([...img.data], [0xff, 0xc0])
})

test('transparent pixels print as paper', () => {
  const img = toMonochrome(solid(8, 1, 0, 0), 8, 1)
  assert.deepEqual([...img.data], [0])
})

test('mid grey dithers to roughly half the dots', () => {
  const img = toMonochrome(solid(64, 64, 128), 64, 64)
  let black = 0
  for (const byte of img.data) for (let b = 0; b < 8; b++) black += (byte >> b) & 1
  const ratio = black / (64 * 64)
  assert.ok(ratio > 0.4 && ratio < 0.6, `ratio ${ratio}`)
})

test('single pixel is MSB first', () => {
  const px = solid(8, 1, 255)
  px.set([0, 0, 0, 255], 0)
  assert.deepEqual([...toMonochrome(px, 8, 1).data], [0x80])
})

test('raster header encodes width in bytes and row count', () => {
  const img = toMonochrome(solid(576, 3, 255), 576, 3)
  const cmd = rasterCommands(img)
  assert.deepEqual([...cmd.subarray(0, 8)], [0x1d, 0x76, 0x30, 0x00, 72, 0, 3, 0])
  assert.equal(cmd.length, 8 + 72 * 3)
})

test('tall images are split into 128-row bands', () => {
  const img = toMonochrome(solid(8, 300, 255), 8, 300)
  const cmd = rasterCommands(img)
  // 3 bands: 128 + 128 + 44 rows, 1 byte per row, 8-byte header each.
  assert.equal(cmd.length, 3 * 8 + 300)
  assert.deepEqual([...cmd.subarray(8 + 128, 8 + 128 + 8)], [0x1d, 0x76, 0x30, 0x00, 1, 0, 128, 0])
  assert.deepEqual([...cmd.subarray(2 * (8 + 128), 2 * (8 + 128) + 8)], [0x1d, 0x76, 0x30, 0x00, 1, 0, 44, 0])
})

test('job starts with ESC @, ends with cut, appends drawer kick on request', () => {
  const img = toMonochrome(solid(8, 1, 255), 8, 1)
  const job = receiptJob(img, { openDrawer: true })
  assert.deepEqual([...job.subarray(0, 2)], [0x1b, 0x40])
  const tail = job.subarray(job.length - DRAWER_KICK.length - 4)
  assert.deepEqual([...tail.subarray(0, 4)], [0x1d, 0x56, 0x42, 0x00])
  assert.deepEqual([...tail.subarray(4)], [...DRAWER_KICK])
})

test('cut can be disabled', () => {
  const img = toMonochrome(solid(8, 1, 255), 8, 1)
  const job = receiptJob(img, { cut: false })
  assert.deepEqual([...job.subarray(job.length - 3)], [0x1b, 0x64, 0x04])
})
