import { redis } from './db';
import { NextRequest } from 'next/server';

export async function checkRateLimit(request: NextRequest, action: string, limit: number, windowSeconds: number): Promise<boolean> {
  // Use IP or token (if available) for rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
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
    const exists = await redis.setnx(key, '1');
    if (exists === 1) {
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
