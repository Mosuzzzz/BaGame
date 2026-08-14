import { redis } from './db';
import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return request.ip || forwarded?.split(',')[0].trim() || 'unknown';
}

export async function checkRateLimit(request: NextRequest, action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const ip = getClientIp(request);
  const key = `ratelimit:${action}:${ip}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current <= limit;
  } catch (err) {
    console.error('Rate limit error:', err);
    return true; // fail open
  }
}

export async function hasUserActionOccurred(userId: string, gameId: string, action: 'like' | 'view'): Promise<boolean> {
  const key = `action:${action}:${gameId}:${userId}`;
  try {
    const result = await redis.set(key, '1', {
      nx: true,
      ex: 1800, // 30 minutes TTL
    });
    
    if (result === 'OK') {
      // It did not exist, we just set it.
      return false;
    }
    // It already existed
    return true;
  } catch (err) {
    console.error('Action check error:', err);
    return false; // fail open, but ideally we'd fail close for security. But let's allow if Redis is down.
  }
}
