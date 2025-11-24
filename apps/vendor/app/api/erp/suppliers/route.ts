import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

// Validation schema for suppliers
const createSupplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  contactPerson: z.string().min(2, 'Contact person name is required').max(100),
  phone: z.string().regex(/^0[567]\d{8}$/, 'Invalid Algerian phone number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500).optional(),
  vendorId: z.string().cuid('Invalid vendor ID').optional(),
})

const updateSupplierSchema = createSupplierSchema.partial()

// GET - Fetch all suppliers for a vendor
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // DISABLED for Electron app (no authentication)
    // const session = await auth()
    // if (!session?.user) {
    //   throw new UnauthorizedError()
    // }

    // For Electron app, default to admin mode
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    // if (!isAdmin && !isVendor) {
    //   throw new UnauthorizedError('Only vendors or admins can access suppliers')
    // }

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const vendorIdParam = searchParams.get('vendorId')

    let vendorId = isAdmin ? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      const firstVendor = await prisma.user.findFirst({
        where: { role: 'VENDOR', status: 'APPROVED' },
        select: { id: true },
      })
      if (firstVendor) {
        vendorId = firstVendor.id
      }
    }

    if (!vendorId) {
      return errorResponse(new Error('No vendor found. Please create a vendor first.'), 400)
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build where clause
    const where: any = {
      vendorId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (city) {
      where.address = { contains: city, mode: 'insensitive' }
    }

    // Get total count and suppliers with pagination
    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
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
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new UnauthorizedError('Only vendors or admins can create suppliers')
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')

    const body = await request.json()
    const validatedData = createSupplierSchema.parse(body)
    const { name, contactPerson, phone, email, address, vendorId: overrideVendorId } = validatedData

    let vendorId = isAdmin ? overrideVendorId ?? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      const firstVendor = await prisma.user.findFirst({
        where: { role: 'VENDOR', status: 'APPROVED' },
        select: { id: true },
      })
      if (firstVendor) {
        vendorId = firstVendor.id
      }
    }

    if (!vendorId) {
      return errorResponse(new Error('No vendor found. Please create a vendor first.'), 400)
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        vendorId,
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
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new UnauthorizedError('Only vendors or admins can update suppliers')
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return errorResponse(new Error('Supplier ID is required'), 400)
    }

    // Validate supplier ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid supplier ID format'), 400)
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

    // DISABLED for Electron app
    // if (isVendor && existingSupplier.vendorId !== session.user.id) {
    //   throw new ForbiddenError('You can only update your own suppliers')
    // }

    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return successResponse({ supplier })
  } catch (error) {
    console.error('[API] Suppliers PUT error:', error)
    return errorResponse(error)
  }
}

// DELETE - Delete supplier
export async function DELETE(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new UnauthorizedError('Only vendors or admins can delete suppliers')
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse(new Error('Supplier ID is required'), 400)
    }

    // Validate supplier ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid supplier ID format'), 400)
    }

    // Verify supplier belongs to this vendor
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!existingSupplier) {
      return errorResponse(new Error('Supplier not found'), 404)
    }

    // DISABLED for Electron app
    // if (isVendor && existingSupplier.vendorId !== session.user.id) {
    //   throw new ForbiddenError('You can only delete your own suppliers')
    // }

    // Check if supplier has products
    if (existingSupplier._count.products > 0) {
      return errorResponse(new Error('Cannot delete supplier with associated products'), 400)
    }

    // Delete supplier
    await prisma.supplier.delete({
      where: { id },
    })

    return successResponse({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('[API] Suppliers DELETE error:', error)
    return errorResponse(error)
  }
}
