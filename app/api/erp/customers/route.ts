import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

function maxDate(a: Date | null | undefined, b: Date | null | undefined): Date | null {
  const ta = a?.getTime() ?? 0
  const tb = b?.getTime() ?? 0
  if (!ta && !tb) return null
  return ta >= tb! ? a! : b!
}

// GET - Fetch all customers who have ordered from this vendor (POS sales + delivery / WhatsApp orders)
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access customers')
    }

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const sortParam = searchParams.get('sort') // 'totalPurchases' | 'lastPurchaseDate'
    const vendorIdParam = searchParams.get('vendorId')

    const vendorId = isAdmin ? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId query parameter is required for admin access'), 400)
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const [saleAggregates, orderAggregates, waAggregates] = await Promise.all([
      prisma.sale.groupBy({
        by: ['customerId'],
        where: { vendorId, NOT: { customerId: null } },
        _sum: { total: true },
        _max: { createdAt: true },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { vendorId },
        _sum: { total: true },
        _max: { createdAt: true },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { vendorId, orderSource: 'WHATSAPP' },
        _count: { id: true },
      }),
    ])

    type Merged = {
      customerId: string
      saleTotal: number
      saleCount: number
      saleLast: Date | null
      orderTotal: number
      deliveryOrderCount: number
      orderLast: Date | null
      whatsappOrderCount: number
    }

    const empty = (id: string): Merged => ({
      customerId: id,
      saleTotal: 0,
      saleCount: 0,
      saleLast: null,
      orderTotal: 0,
      deliveryOrderCount: 0,
      orderLast: null,
      whatsappOrderCount: 0,
    })

    const merged = new Map<string, Merged>()

    for (const a of saleAggregates) {
      const id = a.customerId!
      merged.set(id, {
        ...empty(id),
        saleTotal: a._sum.total ?? 0,
        saleCount: a._count.id,
        saleLast: a._max.createdAt,
      })
    }

    for (const a of orderAggregates) {
      const id = a.customerId
      const cur = merged.get(id) ?? empty(id)
      cur.orderTotal = a._sum.total ?? 0
      cur.deliveryOrderCount = a._count.id
      cur.orderLast = a._max.createdAt
      merged.set(id, cur)
    }

    for (const a of waAggregates) {
      const id = a.customerId!
      const cur = merged.get(id) ?? empty(id)
      cur.whatsappOrderCount = a._count.id
      merged.set(id, cur)
    }

    const rows = Array.from(merged.values())

    if (sortParam === 'lastPurchaseDate') {
      rows.sort((a, b) => {
        const da = Math.max(a.saleLast?.getTime() ?? 0, a.orderLast?.getTime() ?? 0)
        const db = Math.max(b.saleLast?.getTime() ?? 0, b.orderLast?.getTime() ?? 0)
        return db - da
      })
    } else {
      rows.sort((a, b) => {
        const ta = a.saleTotal + a.orderTotal
        const tb = b.saleTotal + b.orderTotal
        return tb - ta
      })
    }

    const paginatedRows = rows.slice((page - 1) * limit, page * limit)
    const customerIds = paginatedRows.map((r) => r.customerId).filter(Boolean)

    const users = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true, phone: true },
    })

    const customers = paginatedRows.map((row) => {
      const u = users.find((x) => x.id === row.customerId)
      return {
        id: u?.id || row.customerId,
        name: u?.name || 'Client',
        email: u?.email || undefined,
        phone: u?.phone || '',
        totalPurchases: row.saleTotal,
        orderCount: row.saleCount,
        deliveryTotal: row.orderTotal,
        deliveryOrderCount: row.deliveryOrderCount,
        whatsappOrderCount: row.whatsappOrderCount,
        lastPurchaseDate: maxDate(row.saleLast, row.orderLast),
      }
    })

    return successResponse({
      customers,
      pagination: {
        page,
        limit,
        total: rows.length,
        pages: Math.ceil(rows.length / limit),
      },
    })
  } catch (error) {
    console.error('[API] Customers GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new customer (stub for future implementation)
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create customers')
    }

    // For now, return a message that customers are created through registration
    return successResponse({
      message: 'Customers are created through user registration',
    })
  } catch (error) {
    console.error('[API] Customers POST error:', error)
    return errorResponse(error)
  }
}
