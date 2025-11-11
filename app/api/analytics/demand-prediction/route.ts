import { NextRequest } from 'next/server';
import { DemandPredictionService } from '@/lib/services/demand-prediction';
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api);

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      throw new UnauthorizedError();
    }

    if (!['ADMIN', 'VENDOR'].includes(session.user.role)) {
      throw new ForbiddenError('Only admins and vendors can access demand predictions');
    }

    const searchParams = request.nextUrl.searchParams;
    const zoneId = searchParams.get('zoneId');
    const dateStr = searchParams.get('date');

    if (!zoneId) {
      return errorResponse(new Error('Zone ID is required'), 400);
    }

    // Validate zoneId format
    try {
      z.string().cuid().parse(zoneId);
    } catch {
      return errorResponse(new Error('Invalid zone ID format'), 400);
    }

    // Verify zone exists
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });

    if (!zone) {
      return errorResponse(new Error('Delivery zone not found'), 404);
    }

    // Validate and parse date
    let date: Date;
    if (dateStr) {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return errorResponse(new Error('Invalid date format'), 400);
      }
    } else {
      date = new Date();
    }

    // Get demand prediction
    const demand = await DemandPredictionService.predictDemandForZone(zoneId, date);
    if (!demand) {
      return errorResponse(new Error('Failed to calculate demand prediction'), 500);
    }

    // Get pricing multipliers
    const pricing = await DemandPredictionService.getPricingMultipliers(zoneId, date);

    return successResponse({
      demand,
      pricing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorResponse(error);
  }
}