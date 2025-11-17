import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// POST /api/erp/inventory/[id]/post-to-delivery - Post inventory product to customer-facing Product table
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can post products to delivery')
    }

    const paramsResolved = await context.params
    const { id: inventoryProductId } = paramsResolved

    // Validate ID format
    try {
      z.string().cuid().parse(inventoryProductId)
    } catch {
      return errorResponse(new Error('Invalid inventory product ID format'), 400)
    }

    // Get inventory product
    const inventoryProduct = await prisma.inventoryProduct.findUnique({
      where: { id: inventoryProductId },
    })

    if (!inventoryProduct) {
      throw new NotFoundError('Inventory Product')
    }

    // Verify ownership
    if (isVendor && inventoryProduct.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only post your own products to delivery')
    }

    // Get vendor's store (or first store if multiple)
    const store = await prisma.store.findFirst({
      where: { vendorId: inventoryProduct.vendorId },
      orderBy: { createdAt: 'asc' }, // Get first store created
    })

    if (!store) {
      return errorResponse(new Error('No store found for this vendor. Please create a store first.'), 404)
    }

    // Check if product already exists for this store with same name
    const existingProduct = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        name: inventoryProduct.name,
      },
    })

    let product

    if (existingProduct) {
      // Update existing product
      product = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: inventoryProduct.name,
          description: inventoryProduct.description || inventoryProduct.name,
          price: inventoryProduct.sellingPrice,
          image: inventoryProduct.image || null,
          category: inventoryProduct.category || null,
          available: inventoryProduct.stock > 0, // Available if stock > 0
        },
      })
    } else {
      // Create new product
      product = await prisma.product.create({
        data: {
          storeId: store.id,
          name: inventoryProduct.name,
          description: inventoryProduct.description || inventoryProduct.name,
          price: inventoryProduct.sellingPrice,
          image: inventoryProduct.image || null,
          category: inventoryProduct.category || null,
          available: inventoryProduct.stock > 0, // Available if stock > 0
        },
      })
    }

    console.log('[API] Posted inventory product to delivery:', inventoryProductId, '-> Product:', product.id)

    return successResponse({ 
      product,
      message: existingProduct ? 'Product updated in delivery' : 'Product posted to delivery successfully'
    })
  } catch (error) {
    console.error('[API] Post to delivery error:', error)
    return errorResponse(error)
  }
}
