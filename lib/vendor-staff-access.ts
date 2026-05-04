import { prisma } from '@/root/lib/prisma'
import { ForbiddenError } from '@/root/lib/errors'

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
  if (m.role === 'CASHIER') {
    throw new ForbiddenError('Inventory catalog changes require a manager role')
  }
}
