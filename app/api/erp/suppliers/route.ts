import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for suppliers
const createSupplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  contactPerson: z.string().min(2, 'Contact person name is required').max(100),
  phone: z.string().regex(/^0[567]\d{8}$/, 'Invalid Algerian phone number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500).optional(),
})

const updateSupplierSchema = createSupplierSchema.partial()

// GET - Fetch all suppliers for a vendor
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access suppliers')
    }

    // Fetch suppliers for this vendor
    const suppliers = await prisma.supplier.findMany({
      where: {
        vendorId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return successResponse({ suppliers })
  } catch (error) {
    console.error('[API] Suppliers GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create suppliers')
    }

    const body = await request.json()
    const validatedData = createSupplierSchema.parse(body)
    const { name, contactPerson, phone, email, address } = validatedData

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        vendorId: session.user.id,
        name,
        contactPerson,
        phone,
        email: email || null,
        address: address || null,
      },
    })

    return successResponse({ supplier }, 201)
  } catch (error) {
    console.error('[API] Suppliers POST error:', error)
    return errorResponse(error)
  }
}

// PUT - Update supplier
export async function PUT(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can update suppliers')
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return errorResponse(new Error('Supplier ID is required'), 400)
    }

    // Validate update data
    const validatedData = updateSupplierSchema.parse(updateData)

    // Verify supplier belongs to this vendor
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!existingSupplier) {
      return errorResponse(new Error('Supplier not found'), 404)
    }

    if (existingSupplier.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only update your own suppliers')
    }

    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    })

    return successResponse({ supplier })
  } catch (error) {
    console.error('[API] Suppliers PUT error:', error)
    return errorResponse(error)
  }
}
