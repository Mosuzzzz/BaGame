import { NextRequest, NextResponse } from 'next/server';
import { updateGameMetrics } from '../../store';
import { checkRateLimit, hasUserActionOccurred } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const isAllowed = await checkRateLimit(request, 'view', 60, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const hasAction = await hasUserActionOccurred(ip, params.id, 'view');
  if (hasAction) {
    // Return early if view was already counted for this IP, but don't error
    return NextResponse.json({ message: 'View already recorded' });
  }

  const updated = await updateGameMetrics(params.id, 1, 0);
  if (!updated) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json({ game: updated });
}
