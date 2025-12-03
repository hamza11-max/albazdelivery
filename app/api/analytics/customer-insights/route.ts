import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { analyticsDashboardSchema } from '@/lib/validations/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const searchParams = request.nextUrl.searchParams
    const vendorIdParam = searchParams.get('vendorId')

    // Determine vendorId - vendors see their own, admins can specify
    let vendorId = session.user.role === 'VENDOR' ? session.user.id : null

    if (vendorIdParam) {
      // Validate vendorId format
      try {
        z.string().cuid().parse(vendorIdParam)
      } catch {
        return errorResponse(new Error('Invalid vendor ID format'), 400)
      }
      vendorId = vendorIdParam
    }

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== vendorId) {
      throw new ForbiddenError('Cannot access other vendor data')
    }

    // Verify vendor exists
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { id: true, role: true },
    })

    if (!vendor || vendor.role !== 'VENDOR') {
      return errorResponse(new Error('Vendor not found'), 404)
    }

    // Get unique customers
    const totalCustomers = await prisma.order.findMany({
      where: { vendorId },
      select: { customerId: true },
      distinct: ['customerId'],
    })

    // Get customer order counts
    const customerOrders = await prisma.order.groupBy({
      by: ['customerId'],
      where: { vendorId },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

  const repeatCount = customerOrders.filter((c: any) => c._count.id > 1).length
    const repeatRate = totalCustomers.length > 0 
      ? (repeatCount / totalCustomers.length) * 100 
      : 0

    // Top customers with user details
  const topCustomerIds = customerOrders.slice(0, 10).map((c: any) => c.customerId)
    const customerDetails = await prisma.user.findMany({
      where: { id: { in: topCustomerIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const topCustomers = customerOrders.slice(0, 10).map((c: any) => {
      const details = customerDetails.find((d: any) => d.id === c.customerId)
      return {
        customerId: c.customerId,
        customerName: details?.name || 'Unknown',
        orderCount: c._count.id,
        totalSpent: c._sum.total || 0,
      }
    })

    return successResponse({
      insights: {
        totalCustomers: totalCustomers.length,
        repeatCustomers: repeatCount,
        repeatRate: Math.round(repeatRate),
        topCustomers,
      },
    })
  } catch (error) {
    console.error('[API] Customer insights error:', error)
    return errorResponse(error)
  }
}
