import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all sales (completed orders)
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access sales')
    }

    const sales = await prisma.sale.findMany({
      where: {
        vendorId: session.user.id,
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return successResponse({ sales })
  } catch (error) {
    console.error('[API] Sales GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new sale (POS transaction)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create sales')
    }

    const body = await request.json()
    const { customerId, items, subtotal, discount, total, paymentMethod } = body

    const sale = await prisma.sale.create({
      data: {
        vendorId: session.user.id,
        customerId: customerId || null,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount || 0),
        total: parseFloat(total),
        paymentMethod: (paymentMethod?.toUpperCase() === 'CARD') ? 'CARD' : 'CASH',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: parseFloat(item.price),
            discount: parseFloat(item.discount || 0),
          })),
        },
      },
      include: { items: true },
    })

    return successResponse({ sale })
  } catch (error) {
    console.error('[API] Sales POST error:', error)
    return errorResponse(error)
  }
}
