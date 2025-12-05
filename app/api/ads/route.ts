import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/errors'

// GET /api/ads - Get all active ads (public)
export async function GET(request: NextRequest) {
  try {
    const ads = await prisma.ad.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return successResponse({ ads })
  } catch (error) {
    return errorResponse(error)
  }
}

