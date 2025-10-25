import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all inventory products
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can access inventory')
    }

    const products = await prisma.inventoryProduct.findMany({
      where: { vendorId: session.user.id },
      orderBy: { createdAt: 'desc' },
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
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can create products')
    }

    const body = await request.json()
    const { sku, name, category, supplierId, costPrice, sellingPrice, stock, lowStockThreshold, barcode, image } = body

    const product = await prisma.inventoryProduct.create({
      data: {
        vendorId: session.user.id,
        sku,
        name,
        category,
        supplierId: supplierId || undefined,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stock: parseInt(stock),
        lowStockThreshold: parseInt(lowStockThreshold),
        barcode: barcode || undefined,
        image: image || undefined,
      },
    })

    return successResponse({ product })
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
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can update products')
    }

    const body = await request.json()
    const { id, sku, name, category, supplierId, costPrice, sellingPrice, stock, lowStockThreshold, barcode, image } = body

    // Verify ownership
    const existing = await prisma.inventoryProduct.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    const updated = await prisma.inventoryProduct.update({
      where: { id },
      data: {
        sku,
        name,
        category,
        supplierId: supplierId || undefined,
        costPrice: typeof costPrice !== 'undefined' ? parseFloat(costPrice) : undefined,
        sellingPrice: typeof sellingPrice !== 'undefined' ? parseFloat(sellingPrice) : undefined,
        stock: typeof stock !== 'undefined' ? parseInt(stock) : undefined,
        lowStockThreshold: typeof lowStockThreshold !== 'undefined' ? parseInt(lowStockThreshold) : undefined,
        barcode: typeof barcode !== 'undefined' ? barcode : undefined,
        image: typeof image !== 'undefined' ? image : undefined,
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
    if (!session?.user || session.user.role !== 'VENDOR') {
      throw new UnauthorizedError('Only vendors can delete products')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse(new Error('Product ID required'), 400)
    }

    // Verify ownership
    const existing = await prisma.inventoryProduct.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    await prisma.inventoryProduct.delete({ where: { id } })

    return successResponse({ message: 'Product deleted' })
  } catch (error) {
    console.error('[API] Inventory DELETE error:', error)
    return errorResponse(error)
  }
}
