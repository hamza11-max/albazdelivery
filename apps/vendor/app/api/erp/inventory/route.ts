import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { createInventoryProductSchema, updateInventoryProductSchema } from '@/root/lib/validations/api'
import { z } from 'zod'

// GET - Fetch all inventory products
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
    //   throw new ForbiddenError('Only vendors or admins can access inventory')
    // }

    const searchParams = request.nextUrl.searchParams
    const lowStock = searchParams.get('lowStock')
    const category = searchParams.get('category')
    const vendorIdParam = searchParams.get('vendorId')

    let targetVendorId = isAdmin ? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !targetVendorId) {
      const firstVendor = await prisma.user.findFirst({
        where: { role: 'VENDOR', status: 'APPROVED' },
        select: { id: true },
      })
      if (firstVendor) {
        targetVendorId = firstVendor.id
      }
    }

    if (isAdmin && !targetVendorId) {
      return errorResponse(new Error('No vendor found. Please create a vendor first.'), 400)
    }

    const where: any = {}
    if (targetVendorId) {
      where.vendorId = targetVendorId
    }
    if (lowStock === 'true') {
      // Get products where stock <= lowStockThreshold
      const products = await prisma.inventoryProduct.findMany({
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

    const products = await prisma.inventoryProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include,
    })

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

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can create products')
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')

    const body = await request.json()
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

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
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

    // DISABLED for Electron app
    // if (isVendor && existing.vendorId !== session.user.id) {
    //   throw new ForbiddenError('You can only update your own products')
    // }

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

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // DISABLED for Electron app
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
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

    // DISABLED for Electron app
    // DISABLED for Electron app
    // if (isVendor && existing.vendorId !== session.user.id) {
    //   throw new ForbiddenError('You can only delete your own products')
    // }

    await prisma.inventoryProduct.delete({ where: { id } })

    return successResponse({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('[API] Inventory DELETE error:', error)
    return errorResponse(error)
  }
}
