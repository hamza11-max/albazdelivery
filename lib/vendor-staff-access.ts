import { prisma } from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'

/** API-enforced permissions (aligned with apps/vendor/utils/permissionsUtils catalog). */
export type StaffApiPermission =
  | 'orders.view'
  | 'orders.edit'
  | 'sales.create'
  | 'sales.view'
  | 'customers.create'
  | 'customers.view'
  | 'inventory.mutate'
  | 'suppliers.mutate'

const MANAGER_PERMISSIONS: ReadonlySet<StaffApiPermission> = new Set([
  'orders.view',
  'orders.edit',
  'sales.create',
  'sales.view',
  'customers.create',
  'customers.view',
  'inventory.mutate',
  'suppliers.mutate',
])

const CASHIER_PERMISSIONS: ReadonlySet<StaffApiPermission> = new Set([
  'sales.create',
  'sales.view',
  'customers.create',
  'customers.view',
])

/**
 * Resolves the vendor **owner** user id for scoped data (orders, ERP inventory).
 * - Store owner acting as themselves → their own `userId`.
 * - Linked staff (`VendorStaffMember`) → `vendorOwnerId` they belong to.
 */
export async function resolveVendorOwnerContextId(actorUserId: string): Promise<string> {
  const link = await prisma.vendorStaffMember.findUnique({
    where: { staffUserId: actorUserId },
    select: { vendorOwnerId: true },
  })
  return link?.vendorOwnerId ?? actorUserId
}

/** True if `actorId` is the vendor owner or an employed staff member for that owner. */
export async function userActsAsVendorOwner(params: {
  actorId: string
  vendorOwnerId: string | null | undefined
}): Promise<boolean> {
  const { actorId, vendorOwnerId } = params
  if (!vendorOwnerId) return false
  if (actorId === vendorOwnerId) return true
  const m = await prisma.vendorStaffMember.findUnique({
    where: {
      vendorOwnerId_staffUserId: {
        vendorOwnerId,
        staffUserId: actorId,
      },
    },
    select: { id: true },
  })
  return !!m
}

/**
 * Inventory catalog mutations (create / update / delete SKU rows) require vendor **owner** or **MANAGER** staff.
 * **CASHIER** may use POS sales but must not change the catalog.
 */
export async function assertVendorMayMutateInventoryCatalog(
  actorUserId: string,
  vendorOwnerId: string
): Promise<void> {
  await assertStaffPermission(actorUserId, vendorOwnerId, 'inventory.mutate')
}

/**
 * Enforce Prisma staff role against an API permission.
 * Owner (actor === vendorOwnerId) always allowed.
 * localStorage role catalogs remain display-only in the UI.
 */
export async function assertStaffPermission(
  actorUserId: string,
  vendorOwnerId: string,
  permission: StaffApiPermission
): Promise<void> {
  if (actorUserId === vendorOwnerId) {
    return
  }

  const m = await prisma.vendorStaffMember.findUnique({
    where: {
      vendorOwnerId_staffUserId: {
        vendorOwnerId,
        staffUserId: actorUserId,
      },
    },
    select: { role: true },
  })

  if (!m) {
    throw new ForbiddenError('You are not a staff member of this vendor')
  }

  const allowed =
    m.role === 'MANAGER'
      ? MANAGER_PERMISSIONS.has(permission)
      : m.role === 'CASHIER'
        ? CASHIER_PERMISSIONS.has(permission)
        : false

  if (!allowed) {
    throw new ForbiddenError(`Missing permission: ${permission}`)
  }
}
