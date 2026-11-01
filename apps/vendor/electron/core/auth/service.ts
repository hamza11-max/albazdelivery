import type Database from 'better-sqlite3'

import type { Language, Session, SessionRole, ShopInfo, UserSummary } from '../../shared/ipc'
import { AppError } from '../errors'
import { uuidv7 } from '../ids'
import { hashPin, verifyPin } from './pin'

export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCK_MS = 60_000

interface UserRow {
  id: string
  name: string
  role: 'OWNER' | 'CASHIER'
  is_manager: number
  pin_hash: string
  is_active: number
  failed_pin_attempts: number
  pin_locked_until: string | null
}

/**
 * Shop setup, users and the signed-in session. The session lives only in the
 * main process: the renderer is told who is signed in but cannot change it
 * except by calling login/logout.
 */
export class AuthService {
  private session: Session | null = null

  constructor(
    private readonly db: Database.Database,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  // ---------- session ----------

  current(): Session | null {
    return this.session
  }

  requireUser(): Session {
    if (!this.session) throw new AppError('UNAUTHENTICATED', 'Sign in first')
    return this.session
  }

  requireOwner(): Session {
    const s = this.requireUser()
    if (s.role !== 'OWNER') throw new AppError('FORBIDDEN', 'Only the owner can do this')
    return s
  }

  isSetUp(): boolean {
    return !!this.db.prepare("SELECT 1 FROM shop WHERE id = 'shop'").get()
  }

  /** Active users for the sign-in screen (names and roles only). */
  signInUsers(): UserSummary[] {
    return this.db.prepare('SELECT id, name, role, is_active AS isActive FROM users WHERE is_active = 1 ORDER BY role DESC, lower(name)').all()
      .map((u) => ({ ...(u as UserSummary), isActive: true }))
  }

  async login(userId: string, pin: string): Promise<Session> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined
    if (!user || !user.is_active) throw new AppError('WRONG_PIN', 'Wrong PIN')
    const now = this.clock()
    if (user.pin_locked_until && new Date(user.pin_locked_until) > now) {
      const seconds = Math.ceil((new Date(user.pin_locked_until).getTime() - now.getTime()) / 1000)
      throw new AppError('PIN_LOCKED', String(seconds))
    }
    if (!(await verifyPin(pin, user.pin_hash))) {
      // A finished lock starts a fresh count.
      const attempts = (user.pin_locked_until ? 0 : user.failed_pin_attempts) + 1
      if (attempts >= MAX_PIN_ATTEMPTS) {
        const until = new Date(now.getTime() + PIN_LOCK_MS).toISOString()
        this.db.prepare('UPDATE users SET failed_pin_attempts = 0, pin_locked_until = ? WHERE id = ?').run(until, userId)
        this.audit(null, 'PIN_LOCKOUT', 'user', userId, null, { name: user.name })
        throw new AppError('PIN_LOCKED', String(PIN_LOCK_MS / 1000))
      }
      this.db.prepare('UPDATE users SET failed_pin_attempts = ?, pin_locked_until = NULL WHERE id = ?').run(attempts, userId)
      throw new AppError('WRONG_PIN', String(MAX_PIN_ATTEMPTS - attempts))
    }
    this.db.prepare('UPDATE users SET failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?').run(userId)
    this.session = { userId: user.id, name: user.name, role: user.role === 'CASHIER' && user.is_manager ? 'MANAGER' : user.role, since: now.toISOString() }
    return this.session
  }

  logout(): void {
    this.session = null
  }

  /**
   * Vendor desktop: the vendor app signs people in itself (owner password/PIN, staff codes).
   * The account is mirrored into users (no PIN of its own: it can't use the PIN login)
   * and a session opened for it. The first call also creates the shop row.
   */
  signInExternal(input: { id: string; name: string; role: SessionRole; shopName: string }): Session {
    const stored = input.role === 'OWNER' ? 'OWNER' : 'CASHIER'
    const manager = input.role === 'MANAGER' ? 1 : 0
    const now = this.clock().toISOString()
    this.db.transaction(() => {
      // users.name is unique: two staff with the same name get the end of their id appended.
      const clash = this.db.prepare('SELECT 1 FROM users WHERE lower(name) = lower(?) AND id <> ?').get(input.name, input.id)
      const name = clash ? `${input.name} (${input.id.slice(-4)})` : input.name
      this.db.prepare(`INSERT INTO users (id, name, role, is_manager, pin_hash, created_at, updated_at) VALUES (?, ?, ?, ?, '!external', ?, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role, is_manager = excluded.is_manager, is_active = 1, updated_at = excluded.updated_at`)
        .run(input.id, name, stored, manager, now, now)
      if (!this.isSetUp()) {
        this.db.prepare("INSERT INTO shop (id, name, locale, created_at, updated_at) VALUES ('shop', ?, 'ar', ?, ?)").run(input.shopName || 'Boutique', now, now)
        this.audit(input.id, 'SHOP_SETUP', 'shop', 'shop', null, { shopName: input.shopName, source: 'vendor' })
      }
    })()
    const user = this.db.prepare('SELECT id, name FROM users WHERE id = ?').get(input.id) as { id: string; name: string }
    this.session = { userId: user.id, name: user.name, role: input.role, since: now }
    return this.session
  }

  // ---------- first run ----------

  async setup(input: { shopName: string; phone: string; address: string; lang: Language; ownerName: string; pin: string }): Promise<Session> {
    if (this.isSetUp() || this.db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
      throw new AppError('ALREADY_SET_UP', 'This shop is already set up')
    }
    const pinHash = await hashPin(input.pin)
    const now = this.clock().toISOString()
    const ownerId = uuidv7()
    this.db.transaction(() => {
      this.db
        .prepare("INSERT INTO shop (id, name, phone, address, locale, created_at, updated_at) VALUES ('shop', ?, ?, ?, ?, ?, ?)")
        .run(input.shopName, input.phone || null, input.address || null, input.lang, now, now)
      this.db
        .prepare("INSERT INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES (?, ?, 'OWNER', ?, ?, ?)")
        .run(ownerId, input.ownerName, pinHash, now, now)
      this.db.prepare("INSERT INTO kv (key, value) VALUES ('ui.lang', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(input.lang)
      this.audit(ownerId, 'SHOP_SETUP', 'shop', 'shop', null, { shopName: input.shopName, ownerName: input.ownerName })
    })()
    this.session = { userId: ownerId, name: input.ownerName, role: 'OWNER', since: now }
    return this.session
  }

  // ---------- shop ----------

  shop(): ShopInfo {
    const row = this.db.prepare("SELECT name, phone, address, receipt_footer FROM shop WHERE id = 'shop'").get() as
      | { name: string; phone: string | null; address: string | null; receipt_footer: string | null }
      | undefined
    if (!row) throw new AppError('NOT_SET_UP', 'Shop is not set up')
    return { name: row.name, phone: row.phone ?? '', address: row.address ?? '', receiptFooter: row.receipt_footer ?? '' }
  }

  saveShop(input: ShopInfo): ShopInfo {
    const owner = this.requireOwner()
    const before = this.shop()
    this.db.transaction(() => {
      this.db
        .prepare("UPDATE shop SET name = ?, phone = ?, address = ?, receipt_footer = ?, updated_at = ? WHERE id = 'shop'")
        .run(input.name, input.phone || null, input.address || null, input.receiptFooter || null, this.clock().toISOString())
      this.audit(owner.userId, 'SETTINGS_CHANGE', 'shop', 'shop', before, input)
    })()
    return this.shop()
  }

  // ---------- users (owner only) ----------

  users(): UserSummary[] {
    this.requireOwner()
    return (this.db.prepare('SELECT id, name, role, is_active AS isActive FROM users ORDER BY is_active DESC, role DESC, lower(name)').all() as
      { id: string; name: string; role: 'OWNER' | 'CASHIER'; isActive: number }[]).map((u) => ({ ...u, isActive: u.isActive === 1 }))
  }

  async saveUser(input: { id?: string | undefined; name: string; role: 'OWNER' | 'CASHIER'; pin?: string | undefined }): Promise<UserSummary> {
    const owner = this.requireOwner()
    const pinHash = input.pin ? await hashPin(input.pin) : null
    const now = this.clock().toISOString()
    const id = input.id ?? uuidv7()
    this.db.transaction(() => {
      const clash = this.db.prepare('SELECT 1 FROM users WHERE lower(name) = lower(?) AND id <> ?').get(input.name, id)
      if (clash) throw new AppError('DUPLICATE_USER', `A user named “${input.name}” already exists`)
      const before = input.id ? (this.db.prepare('SELECT name, role, is_active FROM users WHERE id = ?').get(id) as { name: string; role: string; is_active: number } | undefined) : undefined
      if (input.id && !before) throw new AppError('NOT_FOUND', 'User not found')

      if (before) {
        if (before.role === 'OWNER' && input.role !== 'OWNER' && before.is_active) this.assertAnotherActiveOwner(id)
        this.db.prepare('UPDATE users SET name = ?, role = ?, updated_at = ? WHERE id = ?').run(input.name, input.role, now, id)
        if (pinHash) this.db.prepare('UPDATE users SET pin_hash = ?, failed_pin_attempts = 0, pin_locked_until = NULL WHERE id = ?').run(pinHash, id)
      } else {
        if (!pinHash) throw new AppError('PIN_REQUIRED', 'A new user needs a PIN')
        this.db.prepare('INSERT INTO users (id, name, role, pin_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, input.name, input.role, pinHash, now, now)
      }
      this.audit(owner.userId, before ? 'USER_CHANGE' : 'USER_CREATE', 'user', id, before ? { name: before.name, role: before.role } : null, {
        name: input.name,
        role: input.role,
        pinChanged: !!pinHash,
      })
    })()
    if (this.session?.userId === id) this.session = { ...this.session, name: input.name, role: input.role }
    // Read back directly: an owner who just made themselves a cashier may no longer call users().
    const saved = this.db.prepare('SELECT id, name, role, is_active AS isActive FROM users WHERE id = ?').get(id) as { id: string; name: string; role: 'OWNER' | 'CASHIER'; isActive: number }
    return { ...saved, isActive: saved.isActive === 1 }
  }

  setActive(id: string, active: boolean): void {
    const owner = this.requireOwner()
    this.db.transaction(() => {
      const user = this.db.prepare('SELECT role, is_active FROM users WHERE id = ?').get(id) as { role: string; is_active: number } | undefined
      if (!user) throw new AppError('NOT_FOUND', 'User not found')
      if (!active && id === owner.userId) throw new AppError('CANNOT_DEACTIVATE_SELF', 'You cannot deactivate yourself')
      if (!active && user.role === 'OWNER') this.assertAnotherActiveOwner(id)
      this.db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(active ? 1 : 0, this.clock().toISOString(), id)
      this.audit(owner.userId, 'USER_CHANGE', 'user', id, { isActive: !!user.is_active }, { isActive: active })
    })()
  }

  private assertAnotherActiveOwner(exceptId: string) {
    const others = this.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'OWNER' AND is_active = 1 AND id <> ?").get(exceptId) as { n: number }
    if (others.n === 0) throw new AppError('LAST_OWNER', 'The shop needs at least one active owner')
  }

  private audit(userId: string | null, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
    this.db
      .prepare('INSERT INTO audit_events (id, user_id, action, entity, entity_id, before_json, after_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv7(), userId, action, entity, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after), this.clock().toISOString())
  }
}
