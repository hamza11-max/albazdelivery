import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { getSessionFromRequest } from '@/root/lib/get-session-from-request'

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

    const session = await getSessionFromRequest(request)
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

    let vendorId = isAdmin ? vendorIdParam : session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      try {
        const firstVendor = await prisma.user.findFirst({
          where: { role: 'VENDOR', status: 'APPROVED' },
          select: { id: true },
        })
        if (firstVendor) {
          vendorId = firstVendor.id
        }
      } catch (e) {
        console.warn('[API/customers] Error fetching first vendor:', e)
      }
    }

    if (!vendorId) {
      return successResponse({
        customers: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
      })
    }

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

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

    type SaleCustomerAgg = {
      customerId: string | null
      _sum: { total: number | null }
      _max: { createdAt: Date | null }
      _count: { id: number }
    }
    type OrderCustomerAgg = {
      customerId: string
      _sum: { total: number | null }
      _max: { createdAt: Date | null }
      _count: { id: number }
    }
    type OrderWaAgg = {
      customerId: string
      _count: { id: number }
    }

    let saleAggregates: SaleCustomerAgg[] = []
    let orderAggregates: OrderCustomerAgg[] = []
    let waAggregates: OrderWaAgg[] = []

    try {
      ;[saleAggregates, orderAggregates, waAggregates] = await Promise.all([
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
    } catch (e) {
      console.warn('[API/customers] Error aggregating customers:', e)
    }

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

    let users: Array<{ id: string; name: string | null; email: string | null; phone: string | null }> = []
    try {
      users = await prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, email: true, phone: true },
      })
    } catch (e) {
      console.warn('[API/customers] Error fetching user data:', e)
    }

    const customers = paginatedRows.map((row) => {
      const matchedUser = users.find((x) => x.id === row.customerId)
      return {
        id: matchedUser?.id || row.customerId,
        name: matchedUser?.name || 'Client',
        email: matchedUser?.email || undefined,
        phone: matchedUser?.phone || '',
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

/**
 * POST — **By design** customers are not created from this ERP endpoint.
 * End-users register (customer role); the vendor CRM lists linked users from sales/orders.
 * A future “invite / quick-add customer” flow would extend this with validation and `User`/`Customer` creation.
 */
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create customers')
    }

    return successResponse({
      message: 'Customers are created through user registration',
    })
  } catch (error) {
    console.error('[API] Customers POST error:', error)
    return errorResponse(error)
  }
}
