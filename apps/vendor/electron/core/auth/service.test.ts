// Run with Electron's Node (npm run test:db): uses the real database.
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type Database from 'better-sqlite3'

import { ACCESS } from '../access'
import { openDatabase } from '../db/database'
import { loadMigrations, migrate } from '../db/migrate'
import { AppError } from '../errors'
import { hashPin, verifyPin } from './pin'
import { AuthService, MAX_PIN_ATTEMPTS, PIN_LOCK_MS } from './service'

let db: Database.Database
let now: Date
let auth: AuthService

beforeEach(async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'albaz-pos-auth-'))
  db = openDatabase(path.join(dir, 'pos.db'))
  await migrate(db, loadMigrations(path.join(__dirname, '..', '..', '..', 'migrations')), { backupDir: dir })
  now = new Date('2026-10-31T10:00:00Z')
  auth = new AuthService(db, () => now)
})

const code = (c: string) => (err: unknown) => err instanceof AppError && err.code === c
const setup = () => auth.setup({ shopName: 'Boutique Amina', phone: '', address: '', lang: 'ar', ownerName: 'Amina', pin: '1234' })

test('vendor login bridge: accounts are mirrored by stable id, cannot use PIN login, and create the shop once', async () => {
  const owner = auth.signInExternal({ id: 'owner', name: 'Amina', role: 'OWNER', shopName: 'Boutique Amina' })
  assert.deepEqual([owner.userId, owner.role], ['owner', 'OWNER'])
  assert.equal(auth.shop().name, 'Boutique Amina')
  // Same staff id twice → one row, role and name kept up to date; a namesake gets a suffix.
  auth.signInExternal({ id: 'staff-1', name: 'Karim', role: 'CASHIER', shopName: 'Other name' })
  auth.signInExternal({ id: 'staff-1', name: 'Karim B', role: 'CASHIER', shopName: 'Other name' })
  const twin = auth.signInExternal({ id: 'staff-2', name: 'karim b', role: 'CASHIER', shopName: '' })
  assert.equal(twin.name, 'karim b (ff-2)')
  assert.equal((db.prepare('SELECT COUNT(*) n FROM users').get() as { n: number }).n, 3)
  assert.equal(auth.shop().name, 'Boutique Amina', 'shop row is created once')
  await assert.rejects(auth.login('owner', '1234'), code('WRONG_PIN'), 'mirrored accounts have no PIN')
  // A manager is stored as a cashier with the manager flag; the session says MANAGER.
  assert.equal(auth.signInExternal({ id: 'staff-3', name: 'Yacine', role: 'MANAGER', shopName: '' }).role, 'MANAGER')
  assert.deepEqual(db.prepare("SELECT role, is_manager AS m FROM users WHERE id = 'staff-3'").get(), { role: 'CASHIER', m: 1 })
})

test('PIN hashes are salted scrypt and verify only the right PIN', async () => {
  const a = await hashPin('1234')
  const b = await hashPin('1234')
  assert.match(a, /^scrypt\$32768\$8\$1\$/)
  assert.notEqual(a, b, 'random salt')
  assert.equal(await verifyPin('1234', a), true)
  assert.equal(await verifyPin('1235', a), false)
  assert.equal(await verifyPin('12a4', a), false)
  await assert.rejects(hashPin('12'))
})

test('first-run setup creates the shop and owner, signs in, and can only run once', async () => {
  assert.equal(auth.isSetUp(), false)
  const session = await setup()
  assert.equal(session.role, 'OWNER')
  assert.equal(auth.isSetUp(), true)
  assert.equal(auth.shop().name, 'Boutique Amina')
  assert.equal(auth.current()?.name, 'Amina')
  await assert.rejects(setup(), code('ALREADY_SET_UP'))
})

test('login: right PIN signs in, wrong PIN counts down, 5 wrong PINs lock for a minute', async () => {
  const owner = await setup()
  auth.logout()
  await assert.rejects(auth.login(owner.userId, '0000'), (e: unknown) => code('WRONG_PIN')(e) && (e as Error).message === String(MAX_PIN_ATTEMPTS - 1))
  for (let i = 2; i < MAX_PIN_ATTEMPTS; i++) await assert.rejects(auth.login(owner.userId, '0000'), code('WRONG_PIN'))
  await assert.rejects(auth.login(owner.userId, '0000'), code('PIN_LOCKED'))
  // Even the right PIN is refused while locked.
  await assert.rejects(auth.login(owner.userId, '1234'), code('PIN_LOCKED'))
  assert.equal(auth.current(), null)

  now = new Date(now.getTime() + PIN_LOCK_MS + 1)
  assert.equal((await auth.login(owner.userId, '1234')).userId, owner.userId)
})

test('lockout survives an app restart (stored in the database)', async () => {
  const owner = await setup()
  for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) await assert.rejects(auth.login(owner.userId, '9999'))
  const restarted = new AuthService(db, () => now)
  await assert.rejects(restarted.login(owner.userId, '1234'), code('PIN_LOCKED'))
})

test('owner manages cashiers; cashiers cannot manage anything', async () => {
  const owner = await setup()
  const cashier = await auth.saveUser({ name: 'Karim', role: 'CASHIER', pin: '5678' })
  await assert.rejects(auth.saveUser({ name: 'karim', role: 'CASHIER', pin: '1111' }), code('DUPLICATE_USER'))
  await assert.rejects(auth.saveUser({ name: 'NoPin', role: 'CASHIER' }), code('PIN_REQUIRED'))
  assert.deepEqual(auth.signInUsers().map((u) => u.name), ['Amina', 'Karim'])

  auth.logout()
  await auth.login(cashier.id, '5678')
  assert.throws(() => auth.users(), code('FORBIDDEN'))
  await assert.rejects(auth.saveUser({ name: 'Hacker', role: 'OWNER', pin: '0000' }), code('FORBIDDEN'))
  assert.throws(() => auth.saveShop({ name: 'X', phone: '', address: '', receiptFooter: '' }), code('FORBIDDEN'))

  auth.logout()
  await auth.login(owner.userId, '1234')
  auth.setActive(cashier.id, false)
  assert.deepEqual(auth.signInUsers().map((u) => u.name), ['Amina'])
  auth.logout()
  await assert.rejects(auth.login(cashier.id, '5678'), code('WRONG_PIN'), 'deactivated users cannot sign in')
})

test('the shop always keeps an active owner', async () => {
  const owner = await setup()
  await assert.rejects(auth.saveUser({ id: owner.userId, name: 'Amina', role: 'CASHIER' }), code('LAST_OWNER'))
  assert.throws(() => auth.setActive(owner.userId, false), code('CANNOT_DEACTIVATE_SELF'))
  const second = await auth.saveUser({ name: 'Yacine', role: 'OWNER', pin: '2222' })
  // With a second owner, the first can step down.
  await auth.saveUser({ id: owner.userId, name: 'Amina', role: 'CASHIER' })
  auth.logout()
  await auth.login(second.id, '2222')
  assert.throws(() => auth.setActive(second.id, false), code('CANNOT_DEACTIVATE_SELF'))
})

test('resetting a PIN clears the lock', async () => {
  await setup()
  const cashier = await auth.saveUser({ name: 'Karim', role: 'CASHIER', pin: '5678' })
  const owner = auth.current()!
  auth.logout()
  for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) await assert.rejects(auth.login(cashier.id, '0000'))
  await auth.login(owner.userId, '1234')
  await auth.saveUser({ id: cashier.id, name: 'Karim', role: 'CASHIER', pin: '4321' })
  auth.logout()
  assert.equal((await auth.login(cashier.id, '4321')).role, 'CASHIER')
})

test('user and setup changes are audited, PIN hashes never are', async () => {
  await setup()
  await auth.saveUser({ name: 'Karim', role: 'CASHIER', pin: '5678' })
  const rows = db.prepare('SELECT action, after_json FROM audit_events ORDER BY created_at, rowid').all() as { action: string; after_json: string }[]
  assert.deepEqual(rows.map((r) => r.action), ['SHOP_SETUP', 'USER_CREATE'])
  assert.ok(rows.every((r) => !/scrypt|5678/.test(r.after_json)))
})

test('access policy: users, shop and balance corrections are owner-only; catalog, stock and suppliers manager+', () => {
  for (const ch of ['users:save', 'shop:save', 'customers:adjust', 'settings:saveSales'] as const) assert.equal(ACCESS[ch], 'owner', ch)
  for (const ch of ['catalog:saveProduct', 'catalog:archiveProduct', 'import:commit', 'labels:print', 'stock:receive', 'stock:countFinish', 'suppliers:save'] as const) {
    assert.equal(ACCESS[ch], 'manager', ch)
  }
  for (const ch of ['catalog:products', 'catalog:findByCode', 'auth:logout', 'customers:save', 'customers:pay', 'sell:complete'] as const) assert.equal(ACCESS[ch], 'user', ch)
  for (const ch of ['auth:login', 'auth:users', 'auth:setup', 'auth:status'] as const) assert.equal(ACCESS[ch], 'public', ch)
})
