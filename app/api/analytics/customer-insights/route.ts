import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const vendorId = request.nextUrl.searchParams.get('vendorId') || 
      (session.user.role === 'VENDOR' ? session.user.id : null)

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    if (session.user.role !== 'ADMIN' && session.user.id !== vendorId) {
      throw new UnauthorizedError('Cannot access other vendor data')
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
