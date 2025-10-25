import { NextRequest } from 'next/server';
import { DemandPredictionService } from '@/lib/services/demand-prediction';
import { successResponse, errorResponse } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await applyRateLimit(request);

    // Check authentication
    const session = await auth();
    if (!session?.user || !['ADMIN', 'VENDOR'].includes(session.user.role)) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const zoneId = searchParams.get('zoneId');
    const dateStr = searchParams.get('date');

    if (!zoneId) {
      return errorResponse(new Error('Zone ID is required'), 400);
    }

    const date = dateStr ? new Date(dateStr) : new Date();

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