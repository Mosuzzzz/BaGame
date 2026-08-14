import { NextRequest, NextResponse } from 'next/server';
import { updateGameMetrics } from '../../store';
import { checkRateLimit, hasUserActionOccurred } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const isAllowed = await checkRateLimit(request, 'like', 30, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const hasAction = await hasUserActionOccurred(ip, params.id, 'like');
  if (hasAction) {
    return NextResponse.json({ error: 'Already liked' }, { status: 400 });
  }

  const updated = await updateGameMetrics(params.id, 0, 1);
  if (!updated) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json({ game: updated });
}
