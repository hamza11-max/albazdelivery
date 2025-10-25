import { Redis } from '@upstash/redis';
import { Queue } from 'bullmq';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

// Initialize queues
export const queues = {
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
};

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
    console.error(`[Queue] Error adding job to ${queueName}:`, error);
    return false;
  }
}