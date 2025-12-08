import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { createInventoryProductSchema, updateInventoryProductSchema } from '@/root/lib/validations/api'
import { z } from 'zod'

// In-memory fallback storage for when database is unavailable
const fallbackProducts: Map<string, any> = new Map()
let fallbackIdCounter = 1

async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// GET - Fetch all inventory products
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    
    if (!dbAvailable) {
      // Return fallback data
      console.log('[API/inventory] Database unavailable, using fallback storage')
      const products = Array.from(fallbackProducts.values())
      return successResponse({ products, fallback: true })
    }

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access inventory')
    }

    const searchParams = request.nextUrl.searchParams
    const lowStock = searchParams.get('lowStock')
    const category = searchParams.get('category')
    const vendorIdParam = searchParams.get('vendorId')

    let targetVendorId = isAdmin ? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !targetVendorId) {
      try {
        const firstVendor = await prisma.user.findFirst({
          where: { role: 'VENDOR', status: 'APPROVED' },
          select: { id: true },
        })
        if (firstVendor) {
          targetVendorId = firstVendor.id
        }
      } catch (e) {
        console.warn('[API/inventory] Error fetching first vendor:', e)
        // Continue without targetVendorId - will return empty results below
      }
    }

    if (isAdmin && !targetVendorId) {
      // Return empty results instead of error for dev/missing DB scenarios
      return successResponse({ products: [] })
    }

    const where: any = {}
    if (targetVendorId) {
      where.vendorId = targetVendorId
    }
    if (lowStock === 'true') {
      // Get products where stock <= lowStockThreshold
      let products: any[] = []
      try {
        products = await prisma.inventoryProduct.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            ...(isAdmin
              ? {
                  vendor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                }
              : {}),
          },
        })
      } catch (e) {
        console.warn('[API/inventory] Error fetching products:', e)
        products = []
      }
      const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold)
      return successResponse({ products: lowStockProducts })
    }
    if (category) {
      where.category = category
    }

    const include: any = {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    }

    if (isAdmin) {
      include.vendor = {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      }
    }

    const products: any[] = []
    try {
      const fetchedProducts = await prisma.inventoryProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      })
      products.push(...fetchedProducts)
    } catch (e) {
      console.warn('[API/inventory] Error fetching inventory products:', e)
    }

    return successResponse({ products })
  } catch (error) {
    console.error('[API] Inventory GET error:', error)
    return errorResponse(error)
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // Dev mode: bypass auth for Electron
    const isDev = process.env.NODE_ENV === 'development'
    let session = null
    try {
      session = await auth()
    } catch (e) {
      // Auth might fail in Electron
    }
    
    if (!isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can create products')
    }

    const body = await request.json()
    
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    
    if (!dbAvailable) {
      // Use fallback storage
      console.log('[API/inventory] Database unavailable, using fallback storage for POST')
      const id = `fallback-${fallbackIdCounter++}`
      const product = {
        id,
        ...body,
        vendorId: body.vendorId || 'dev-vendor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      fallbackProducts.set(id, product)
      return successResponse({ product, fallback: true })
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    const validatedData = createInventoryProductSchema.parse(body)
    const {
      vendorId: overrideVendorId,
      sku,
      name,
      category,
      supplierId,
      costPrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      barcode,
      image,
    } = validatedData

    const vendorId = isAdmin ? overrideVendorId ?? vendorIdParam : session.user.id

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required to create a product'), 400)
    }

    // Verify supplier belongs to vendor if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          vendorId,
        },
      })
      if (!supplier) {
        return errorResponse(new Error('Supplier not found or does not belong to you'), 404)
      }
    }

    // Verify SKU is unique for this vendor
    const existingSku = await prisma.inventoryProduct.findFirst({
      where: {
        sku,
        vendorId,
      },
    })
    if (existingSku) {
      return errorResponse(new Error('SKU already exists'), 409)
    }

    const product = await prisma.inventoryProduct.create({
      data: {
        vendorId,
        sku,
        name,
        category,
        supplierId: supplierId || null,
        costPrice,
        sellingPrice,
        stock: Math.floor(stock),
        lowStockThreshold: Math.floor(lowStockThreshold),
        barcode: barcode || null,
        image: image && image.length > 0 ? image : null,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
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
    })

    return successResponse({ product }, 201)
  } catch (error) {
    console.error('[API] Inventory POST error:', error)
    return errorResponse(error)
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const isDev = process.env.NODE_ENV === 'development'
    let session = null
    try {
      session = await auth()
    } catch (e) {}
    
    if (!isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can update products')
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return errorResponse(new Error('Product ID is required'), 400)
    }

    // Validate update data
    const validatedData = updateInventoryProductSchema.parse(updateData)

    // Verify ownership
    const existing = await prisma.inventoryProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    if (isVendor && existing.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only update your own products')
    }

    // Verify supplier belongs to vendor if provided
    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: validatedData.supplierId,
          vendorId: existing.vendorId,
        },
      })
      if (!supplier) {
        return errorResponse(new Error('Supplier not found or does not belong to you'), 404)
      }
    }

    // Prepare update data
    const updatePayload: any = {}
    if (validatedData.name !== undefined) updatePayload.name = validatedData.name
    if (validatedData.category !== undefined) updatePayload.category = validatedData.category
    if (validatedData.costPrice !== undefined) updatePayload.costPrice = validatedData.costPrice
    if (validatedData.sellingPrice !== undefined) updatePayload.sellingPrice = validatedData.sellingPrice
    if (validatedData.stock !== undefined) updatePayload.stock = Math.floor(validatedData.stock)
    if (validatedData.lowStockThreshold !== undefined) updatePayload.lowStockThreshold = Math.floor(validatedData.lowStockThreshold)
    if (validatedData.barcode !== undefined) updatePayload.barcode = validatedData.barcode || null
    if (validatedData.image !== undefined) {
      updatePayload.image =
        validatedData.image && validatedData.image.length > 0 ? validatedData.image : null
    }
    if (validatedData.supplierId !== undefined) updatePayload.supplierId = validatedData.supplierId || null

    const updated = await prisma.inventoryProduct.update({
      where: { id },
      data: updatePayload,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
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
    })

    return successResponse({ product: updated })
  } catch (error) {
    console.error('[API] Inventory PUT error:', error)
    return errorResponse(error)
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const isDev = process.env.NODE_ENV === 'development'
    let session = null
    try {
      session = await auth()
    } catch (e) {}
    
    if (!isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can delete products')
    }

    // Get id from query parameters
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return errorResponse(new Error('Product ID is required'), 400)
    }

    // Validate ID format
    try {
      z.string().cuid().parse(id)
    } catch {
      return errorResponse(new Error('Invalid product ID format'), 400)
    }

    // Verify ownership
    const existing = await prisma.inventoryProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    if (isVendor && existing.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only delete your own products')
    }

    await prisma.inventoryProduct.delete({ where: { id } })

    return successResponse({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('[API] Inventory DELETE error:', error)
    return errorResponse(error)
  }
}
