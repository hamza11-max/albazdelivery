import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { getSessionFromRequest } from '@/root/lib/get-session-from-request'
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

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    const isDev = process.env.NODE_ENV === 'development'
    const isLocalVendorId = typeof vendorIdParam === 'string' && (vendorIdParam.startsWith('local-') || vendorIdParam.startsWith('electron-'))

    // When using local/electron vendor (no DB user), return fallback so import + POS see same data.
    // Allow in both dev and production so Electron packaged app works offline without auth.
    if (isLocalVendorId) {
      const all = Array.from(fallbackProducts.values())
      const products = vendorIdParam ? all.filter((p: any) => p.vendorId === vendorIdParam) : all
      return successResponse({ products, fallback: true })
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable()
    
    if (!dbAvailable) {
      // Return fallback data
      console.log('[API/inventory] Database unavailable, using fallback storage')
      const all = Array.from(fallbackProducts.values())
      const products = vendorIdParam ? all.filter((p: any) => p.vendorId === vendorIdParam) : all
      return successResponse({ products, fallback: true })
    }

    const session = await getSessionFromRequest(request)
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

    let targetVendorId = isAdmin ? vendorIdParam : session?.user?.id ?? null

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

    const body = await request.json()
    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    const bodyVendorId = body?.vendorId ?? vendorIdParam
    const isLocalVendorId = typeof bodyVendorId === 'string' && (bodyVendorId.startsWith('local-') || bodyVendorId.startsWith('electron-'))

    // Bypass auth for Electron/local vendor (offline mode) - same as GET
    const isDev = process.env.NODE_ENV === 'development'
    let session = null
    if (!isLocalVendorId) {
      try {
        session = await getSessionFromRequest(request)
      } catch (e) {
        // Auth might fail in Electron
      }
    }

    if (!isLocalVendorId && !isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session?.user?.role === 'ADMIN'
    const isVendor = session?.user?.role === 'VENDOR'

    if (!isLocalVendorId && !isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can create products')
    }
    
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

    // In dev with no session (e.g. Electron), use vendorId from body or query
    const vendorId = (isAdmin ? overrideVendorId ?? vendorIdParam : session?.user?.id) ?? overrideVendorId ?? vendorIdParam ?? body.vendorId

    if (!vendorId) {
      return errorResponse(new Error('vendorId is required to create a product'), 400)
    }

    // When vendorId is a local/Electron id (no DB user), use in-memory fallback so Excel import works
    const isLocalVendorIdForCreate = typeof vendorId === 'string' && (vendorId.startsWith('local-') || vendorId.startsWith('electron-'))
    if (isLocalVendorIdForCreate) {
      const id = `fallback-${fallbackIdCounter++}`
      const product = {
        id,
        vendorId,
        sku,
        name,
        category: category ?? '',
        supplierId: supplierId ?? null,
        costPrice,
        sellingPrice,
        stock: Math.floor(stock),
        lowStockThreshold: Math.floor(lowStockThreshold),
        barcode: barcode || null,
        image: image && image.length > 0 ? image : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      fallbackProducts.set(id, product)
      return successResponse({ product, fallback: true }, 201)
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

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return errorResponse(new Error('Product ID is required'), 400)
    }

    const isFallbackId = typeof id === 'string' && id.startsWith('fallback-')
    const isDev = process.env.NODE_ENV === 'development'

    let session = null
    if (!isFallbackId) {
      try {
        session = await getSessionFromRequest(request)
      } catch (e) {}
    }

    if (!isFallbackId && !isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session?.user?.role === 'ADMIN'
    const isVendor = session?.user?.role === 'VENDOR'

    if (!isFallbackId && !isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can update products')
    }

    // Handle fallback product ids (from Excel import / Electron) - allow in dev and production
    if (isFallbackId) {
      const existing = fallbackProducts.get(id)
      if (!existing) {
        return errorResponse(new Error('Product not found'), 404)
      }
      const validatedData = updateInventoryProductSchema.parse(updateData)
      const updated = {
        ...existing,
        name: validatedData.name ?? existing.name,
        category: validatedData.category ?? existing.category,
        costPrice: validatedData.costPrice ?? existing.costPrice,
        sellingPrice: validatedData.sellingPrice ?? existing.sellingPrice,
        stock: validatedData.stock !== undefined ? Math.floor(validatedData.stock) : existing.stock,
        lowStockThreshold: validatedData.lowStockThreshold !== undefined ? Math.floor(validatedData.lowStockThreshold) : existing.lowStockThreshold,
        barcode: validatedData.barcode !== undefined ? validatedData.barcode : existing.barcode,
        updatedAt: new Date().toISOString(),
      }
      fallbackProducts.set(id, updated)
      return successResponse({ product: updated })
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

    if (isVendor && session?.user && existing.vendorId !== session.user.id) {
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

    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return errorResponse(new Error('Product ID is required'), 400)
    }

    const isFallbackId = id.startsWith('fallback-')
    const isDev = process.env.NODE_ENV === 'development'

    let session = null
    if (!isFallbackId) {
      try {
        session = await getSessionFromRequest(request)
      } catch (e) {}
    }

    if (!isFallbackId && !isDev && !session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session?.user?.role === 'ADMIN'
    const isVendor = session?.user?.role === 'VENDOR'

    if (!isFallbackId && !isDev && !isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can delete products')
    }

    // Handle fallback product ids (from Excel import / Electron)
    if (isFallbackId) {
      const existing = fallbackProducts.get(id)
      if (!existing) {
        return errorResponse(new Error('Product not found'), 404)
      }
      fallbackProducts.delete(id)
      return successResponse({ message: 'Product deleted successfully' })
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

    if (isVendor && session?.user && existing.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only delete your own products')
    }

    await prisma.inventoryProduct.delete({ where: { id } })

    return successResponse({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('[API] Inventory DELETE error:', error)
    return errorResponse(error)
  }
}
