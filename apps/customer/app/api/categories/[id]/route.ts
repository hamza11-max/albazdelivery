import { type NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { categories } from '@/app/lib/mock-data'

// GET /api/categories/[id] - Get category by ID
// Note: Categories are currently defined in mock-data.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    const categoryId = parseInt(params.id)

    if (isNaN(categoryId)) {
      return errorResponse(new Error('Invalid category ID'), 400)
    }

    const category = categories.find((c) => c.id === categoryId)

    if (!category) {
      return errorResponse(new Error('Category not found'), 404)
    }

    return successResponse({ category })
  } catch (error) {
    return errorResponse(error)
  }
}

