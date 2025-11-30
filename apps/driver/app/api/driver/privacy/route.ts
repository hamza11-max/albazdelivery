import { type NextRequest } from "next/server"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { emitDriverPrivacyChanged } from "@/root/lib/events"
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== "DRIVER") {
      throw new ForbiddenError('Only drivers can update privacy settings')
    }

    const body = await request.json()
    const { isActive } = body

    // Validate isActive is a boolean
    if (typeof isActive !== 'boolean') {
      return errorResponse(new Error('isActive must be a boolean'), 400)
    }

    const driverId = session.user.id

    // Verify driver exists (drivers are Users with role DRIVER)
    const driver = await prisma.user.findUnique({
      where: { id: driverId, role: 'DRIVER' },
      select: { id: true },
    })

    if (!driver) {
      return errorResponse(new Error('Driver not found'), 404)
    }

    // Update driver location privacy settings
    const location = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        isActive: isActive,
        status: isActive ? "online" : "offline",
        updatedAt: new Date(),
      },
      create: {
        driverId,
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0,
        isActive: isActive,
        status: isActive ? "online" : "offline",
      },
      select: {
        isActive: true,
        status: true,
        updatedAt: true,
      },
    })

    // Emit privacy changed event
    emitDriverPrivacyChanged(driverId, !isActive)

    return successResponse({
      isActive: location.isActive,
      status: location.status,
    })
  } catch (error) {
    console.error("[DRIVER] Error updating privacy settings:", error)
    return errorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== "DRIVER") {
      throw new ForbiddenError('Only drivers can view privacy settings')
    }

    const driverId = session.user.id

    // Get driver location privacy settings
    const location = await prisma.driverLocation.findUnique({
      where: { driverId },
      select: {
        isActive: true,
        status: true,
        updatedAt: true,
      },
    })

    return successResponse({
      isActive: location?.isActive ?? false,
      status: location?.status ?? 'offline',
    })
  } catch (error) {
    console.error("[DRIVER] Error fetching privacy settings:", error)
    return errorResponse(error)
  }
}
