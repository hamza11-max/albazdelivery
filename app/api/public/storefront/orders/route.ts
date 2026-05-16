import { NextRequest } from 'next/server'
import {
  errorResponse,
  successResponse,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { createStorefrontOrder } from '@/lib/storefront/create-order'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const raw = await request.json().catch(() => null)
    const result = await createStorefrontOrder({
      rawBody: raw,
      tenantHost: request.headers.get('x-tenant-host'),
    })

    return successResponse(result, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
