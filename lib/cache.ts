import { Redis } from '@upstash/redis';
import { Queue } from 'bullmq';

// Skip initialization during build to prevent connection errors
const isBuildTime = () => {
  return process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.VERCEL_ENV === 'production' ||
         process.env.__NEXT_PRIVATE_PREBUILD === 'true' ||
         typeof window !== 'undefined'
}

// Initialize Redis client lazily
let _redis: Redis | null = null

// Use function to ensure proper initialization order
function createRedisProxy(): Redis {
  return new Proxy({} as Redis, {
  get(target, prop) {
    if (isBuildTime()) {
      // Return no-op functions during build
      return () => Promise.resolve(null)
    }
    
    if (!_redis && process.env.REDIS_URL && process.env.REDIS_TOKEN) {
      _redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    }
    
    if (_redis) {
      return (_redis as any)[prop]
    }
    
    // Return no-op if Redis not configured
    return () => Promise.resolve(null)
  }
  });
}

export const redis = createRedisProxy();

// Initialize queues lazily
let _queues: any = null

function createQueuesProxy() {
  return new Proxy({} as any, {
  get(target, prop) {
    if (isBuildTime()) {
      // Return mock queue during build
      return {
        add: () => Promise.resolve(null),
        process: () => Promise.resolve(null),
      }
    }
    
    if (!_queues && process.env.REDIS_HOST) {
      _queues = {
        orders: new Queue('orders', {
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
        notifications: new Queue('notifications', {
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
        analytics: new Queue('analytics', {
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
      }
    }
    
    if (_queues && prop in _queues) {
      return _queues[prop]
    }
    
    // Return mock queue if not configured
    return {
      add: () => Promise.resolve(null),
      process: () => Promise.resolve(null),
    }
  }
  });
}

export const queues = createQueuesProxy();

// Cache helper functions
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key as string);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('[Cache] Error getting data:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, expirationSeconds = 300) {
  try {
    await redis.set(key, JSON.stringify(value), { ex: expirationSeconds });
    return true;
  } catch (error) {
    console.error('[Cache] Error setting data:', error);
    return false;
  }
}

export async function cacheDelete(key: string) {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] Error deleting data:', error);
    return false;
  }
}

// Queue helper functions
export async function addToQueue(
  queueName: keyof typeof queues,
  jobData: any,
  options?: { priority?: number; delay?: number }
) {
  try {
    const queue = queues[queueName];
    await queue.add(queueName, jobData, {
      priority: options?.priority,
      delay: options?.delay,
    });
    return true;
  } catch (error) {
    console.error(`[Queue] Error adding job to ${String(queueName)}:`, error);
    return false;
  }
}