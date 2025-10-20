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

    const products = await prisma.product.findMany({
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
    const { name, description, price, stock, category, image } = body

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || 'General',
        image: image || '/placeholder.jpg',
        vendorId: session.user.id,
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
    const { id, name, description, price, stock, category, image } = body

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        stock: stock ? parseInt(stock) : undefined,
        category,
        image,
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
    const existing = await prisma.product.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return errorResponse(new Error('Product not found'), 404)
    }

    await prisma.product.delete({ where: { id } })

    return successResponse({ message: 'Product deleted' })
  } catch (error) {
    console.error('[API] Inventory DELETE error:', error)
    return errorResponse(error)
  }
}
