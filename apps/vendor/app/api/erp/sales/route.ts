import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for sales
const createSaleSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID').optional(),
  items: z.array(
    z.object({
      productId: z.string().cuid('Invalid product ID').optional(),
      productName: z.string().min(1, 'Product name is required'),
      quantity: z.number().int().positive('Quantity must be positive'),
      price: z.number().positive('Price must be positive'),
      discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD'], {
    errorMap: () => ({ message: 'Payment method must be CASH or CARD' }),
  }),
  vendorId: z.string().cuid('Invalid vendor ID').optional(),
}).refine(
  (data) => {
    const calculatedTotal = data.subtotal - data.discount
    return Math.abs(data.total - calculatedTotal) < 0.01
  },
  {
    message: 'Total must equal subtotal - discount',
    path: ['total'],
  }
)

// GET - Fetch all sales (completed orders)
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
      throw new UnauthorizedError('Only vendors or admins can access sales')
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
    const vendorIdParam = searchParams.get('vendorId')

    const vendorId = isAdmin ? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId query parameter is required for admin access'), 400)
    }

    const where: any = {
      vendorId,
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ...(isAdmin
            ? {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return successResponse({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
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
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new UnauthorizedError('Only vendors or admins can create sales')
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')

    const body = await request.json()
    const validatedData = createSaleSchema.parse(body)
    const { customerId, items, subtotal, discount, total, paymentMethod, vendorId: overrideVendorId } = validatedData

    const vendorId = isAdmin ? overrideVendorId ?? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required to create a sale'), 400)
    }

    // Verify customer exists if provided
    if (customerId) {
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { id: true },
      })
      if (!customer) {
        return errorResponse(new Error('Customer not found'), 404)
      }
    }

    // Create sale with items in a transaction
    const sale = await prisma.$transaction(async (tx: any) => {
      const newSale = await tx.sale.create({
        data: {
          vendorId,
          customerId: customerId || null,
          subtotal,
          discount: discount || 0,
          total,
          paymentMethod: paymentMethod.toUpperCase(),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
            })),
          },
        },
        include: { items: true },
      })

      // If items have productId, update inventory
      for (const item of items) {
        if (item.productId) {
          await tx.inventoryProduct.updateMany({
            where: {
              id: item.productId,
              vendorId,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }

      return newSale
    })

    return successResponse({ sale }, 201)
  } catch (error) {
    console.error('[API] Sales POST error:', error)
    return errorResponse(error)
  }
}
