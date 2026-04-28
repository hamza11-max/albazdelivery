import { describe, it, expect, jest, beforeEach } from '@jest/globals'

const mockFindUnique = jest.fn() as jest.MockedFunction<(args: unknown) => Promise<unknown>>

jest.mock('@/lib/prisma', () => ({
  prisma: {
    vendorStaffMember: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
  },
}))

describe('vendor-staff-access', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('resolveVendorOwnerContextId returns employer id when staff link exists', async () => {
    mockFindUnique.mockResolvedValue({ vendorOwnerId: 'owner_1' })
    const { resolveVendorOwnerContextId } = await import('@/lib/vendor-staff-access')
    await expect(resolveVendorOwnerContextId('staff_1')).resolves.toBe('owner_1')
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { staffUserId: 'staff_1' },
      select: { vendorOwnerId: true },
    })
  })

  it('resolveVendorOwnerContextId returns actor id when no link', async () => {
    mockFindUnique.mockResolvedValue(null)
    const { resolveVendorOwnerContextId } = await import('@/lib/vendor-staff-access')
    await expect(resolveVendorOwnerContextId('owner_self')).resolves.toBe('owner_self')
  })

  it('userActsAsVendorOwner true for owner', async () => {
    const { userActsAsVendorOwner } = await import('@/lib/vendor-staff-access')
    await expect(
      userActsAsVendorOwner({ actorId: 'v1', vendorOwnerId: 'v1' })
    ).resolves.toBe(true)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('userActsAsVendorOwner true for linked staff', async () => {
    mockFindUnique.mockResolvedValue({ id: 'link1' })
    const { userActsAsVendorOwner } = await import('@/lib/vendor-staff-access')
    await expect(
      userActsAsVendorOwner({ actorId: 'staff_1', vendorOwnerId: 'owner_1' })
    ).resolves.toBe(true)
  })

  it('assertVendorMayMutateInventoryCatalog allows owner without DB lookup', async () => {
    const { assertVendorMayMutateInventoryCatalog } = await import('@/lib/vendor-staff-access')
    await expect(assertVendorMayMutateInventoryCatalog('v1', 'v1')).resolves.toBeUndefined()
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('assertVendorMayMutateInventoryCatalog allows MANAGER staff', async () => {
    mockFindUnique.mockResolvedValue({ role: 'MANAGER' })
    const { assertVendorMayMutateInventoryCatalog } = await import('@/lib/vendor-staff-access')
    await expect(
      assertVendorMayMutateInventoryCatalog('staff_1', 'owner_1')
    ).resolves.toBeUndefined()
  })

  it('assertVendorMayMutateInventoryCatalog rejects CASHIER', async () => {
    mockFindUnique.mockResolvedValue({ role: 'CASHIER' })
    const { assertVendorMayMutateInventoryCatalog } = await import('@/lib/vendor-staff-access')
    await expect(assertVendorMayMutateInventoryCatalog('staff_1', 'owner_1')).rejects.toThrow(
      'manager role'
    )
  })
})
