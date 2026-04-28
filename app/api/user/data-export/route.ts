/**
 * Authenticated user: portable JSON snapshot for DSAR / GDPR-style export hooks.
 * Excludes secrets (password hash). Not a full legal "erase" — see docs/COMPLIANCE_DATA_SUBJECTS.md.
 */
import { NextRequest } from 'next/server'

import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        city: true,
        licenseNumber: true,
        shopType: true,
        vehicleType: true,
        photoUrl: true,
        vendorSubdomain: true,
        vendorCustomDomain: true,
        vendorDomainStatus: true,
        addresses: {
          select: {
            id: true,
            label: true,
            address: true,
            city: true,
            isDefault: true,
            createdAt: true,
          },
        },
        orders: {
          take: 150,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            storeId: true,
          },
        },
        vendorOrders: {
          take: 150,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            storeId: true,
          },
        },
        driverDeliveries: {
          take: 150,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedError()
    }

    return successResponse({
      export: {
        exportVersion: 1,
        generatedAt: new Date().toISOString(),
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          address: user.address,
          city: user.city,
          licenseNumber: user.licenseNumber,
          shopType: user.shopType,
          vehicleType: user.vehicleType,
          photoUrl: user.photoUrl,
          vendorSubdomain: user.vendorSubdomain,
          vendorCustomDomain: user.vendorCustomDomain,
          vendorDomainStatus: user.vendorDomainStatus,
        },
        addresses: user.addresses.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
        ordersAsCustomer: user.orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
        ordersAsVendor: user.vendorOrders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
        deliveriesAsDriver: user.driverDeliveries.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
