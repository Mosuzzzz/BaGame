import { NextRequest, NextResponse } from 'next/server';
import { updateGameMetrics } from '../../store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const updated = await updateGameMetrics(params.id, 0, 1);
  if (!updated) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json({ game: updated });
}
