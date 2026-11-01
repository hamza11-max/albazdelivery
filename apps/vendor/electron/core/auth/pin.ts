import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>

/** scrypt cost. ~50 ms on a shop PC: fine for a login, slow for guessing through the UI. */
const PARAMS = { N: 2 ** 15, r: 8, p: 1 }
const KEY_LEN = 32

/** 4 to 6 digits (spec §5: "4–6 digit PIN"). */
export const PIN_RE = /^\d{4,6}$/

/** Stored as `scrypt$N$r$p$saltBase64$hashBase64` so the cost can be raised later. */
export async function hashPin(pin: string): Promise<string> {
  if (!PIN_RE.test(pin)) throw new Error('PIN must be 4 to 6 digits')
  const salt = randomBytes(16)
  const hash = await scrypt(pin, salt, KEY_LEN, { ...PARAMS, maxmem: 64 * 1024 * 1024 })
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), hash.toString('base64')].join('$')
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash || !PIN_RE.test(pin)) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = await scrypt(pin, Buffer.from(salt, 'base64'), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
