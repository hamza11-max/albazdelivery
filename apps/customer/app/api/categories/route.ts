import { type NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { categories } from '@/app/lib/mock-data'

// GET /api/categories - Get all categories
// Note: Categories are currently defined in mock-data.ts
// In the future, this should be moved to a database table
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Return categories from mock data
    // TODO: Replace with database query when Category model is added
    return successResponse({ categories })
  } catch (error) {
    return errorResponse(error)
  }
}

