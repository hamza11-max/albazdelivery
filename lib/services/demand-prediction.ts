import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/cache';

interface DemandZone {
  zoneId: string;
  predictedDemand: number;
  peakHours: number[];
  weatherImpact: number;
  eventImpact: number;
}

interface TimeBasedPricing {
  hour: number;
  multiplier: number;
  reason: string;
}

export class DemandPredictionService {
  private static CACHE_KEY_PREFIX = 'demand_prediction:';
  private static CACHE_DURATION = 1800; // 30 minutes

  static async predictDemandForZone(zoneId: string, date: Date): Promise<DemandZone | null> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${zoneId}:${date.toISOString().split('T')[0]}`;
    
    // Try to get from cache first
    const cached = await cacheGet<DemandZone>(cacheKey);
    if (cached) return cached;

    // Calculate demand prediction
    const prediction = await this.calculateDemandPrediction(zoneId, date);
    if (prediction) {
      await cacheSet(cacheKey, prediction, this.CACHE_DURATION);
    }

    return prediction;
  }

  private static async calculateDemandPrediction(zoneId: string, date: Date): Promise<DemandZone | null> {
    try {
      // Get historical orders data
      const historicalOrders = await prisma.order.findMany({
        where: {
          deliveryAddress: {
            contains: zoneId // Simplified - in real implementation, use proper geo queries
          },
          createdAt: {
            gte: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          createdAt: true,
          total: true,
        }
      });

      interface HistoricalOrder {
        createdAt: Date;
        total: number;
      }

      // Calculate peak hours
      const hourlyDistribution = new Array(24).fill(0);
      historicalOrders.forEach((order: HistoricalOrder) => {
        const hour = new Date(order.createdAt).getHours();
        hourlyDistribution[hour]++;
      });

      const peakHours = hourlyDistribution
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(x => x.hour);

      // Calculate average daily orders
      const dailyOrders = historicalOrders.length / 30;
      
      // Apply time-based adjustments
      const dayOfWeek = date.getDay();
      const monthOfYear = date.getMonth();
      
      let predictedDemand = dailyOrders;

      // Day of week adjustment
      const dayMultipliers = [0.8, 1.0, 1.0, 1.1, 1.2, 1.4, 1.3]; // Sun-Sat
      predictedDemand *= dayMultipliers[dayOfWeek];

      // Month seasonality
      const monthMultipliers = [
        0.9, 0.9, 1.0, 1.0, 1.1, 1.2, // Jan-Jun
        1.2, 1.1, 1.0, 1.0, 1.1, 1.3  // Jul-Dec
      ];
      predictedDemand *= monthMultipliers[monthOfYear];

      // TODO: Integrate with weather API for weather impact
      const weatherImpact = 1.0;

      // TODO: Integrate with local events API for event impact
      const eventImpact = 1.0;

      return {
        zoneId,
        predictedDemand: Math.round(predictedDemand),
        peakHours,
        weatherImpact,
        eventImpact
      };

    } catch (error) {
      console.error('[DemandPrediction] Error calculating demand:', error);
      return null;
    }
  }

  static async getPricingMultipliers(zoneId: string, date: Date): Promise<TimeBasedPricing[]> {
    const demand = await this.predictDemandForZone(zoneId, date);
    if (!demand) return [];

    const multipliers: TimeBasedPricing[] = [];
    const baseMultiplier = 1.0;

    // Generate hourly multipliers based on predicted demand
    for (let hour = 0; hour < 24; hour++) {
      let multiplier = baseMultiplier;
      let reasons: string[] = [];

      // Peak hour adjustment
      if (demand.peakHours.includes(hour)) {
        multiplier *= 1.2;
        reasons.push('Peak hour');
      }

      // Weather impact
      if (demand.weatherImpact !== 1.0) {
        multiplier *= demand.weatherImpact;
        reasons.push('Weather conditions');
      }

      // Event impact
      if (demand.eventImpact !== 1.0) {
        multiplier *= demand.eventImpact;
        reasons.push('Local events');
      }

      // High demand adjustment
      if (demand.predictedDemand > 100) { // Threshold can be adjusted
        multiplier *= 1.1;
        reasons.push('High demand expected');
      }

      multipliers.push({
        hour,
        multiplier: Number(multiplier.toFixed(2)),
        reason: reasons.join(', ') || 'Base pricing'
      });
    }

    return multipliers;
  }
}