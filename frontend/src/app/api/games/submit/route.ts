import { NextRequest, NextResponse } from 'next/server';
import { addGame, scrapeUrl } from '../store';
import { GameDocument } from '@/types/game';
import { auth } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const isAllowed = await checkRateLimit(request, 'submit', 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired authorization token' }, { status: 401 });
    }

    const email = decodedToken.email || '';
    if (!email.endsWith('@rmuti.ac.th')) {
      return NextResponse.json({ error: 'Only @rmuti.ac.th email addresses are allowed' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const scraped = await scrapeUrl(body.url);

    const newGame: GameDocument = {
      id: crypto.randomUUID(),
      title: body.custom_title || scraped.title,
      description: body.custom_description || scraped.description,
      original_url: body.url,
      embed_code: body.embed_code || scraped.embed_code,
      thumbnail_url: body.custom_thumbnail_url || scraped.thumbnail_url,
      creator_id: decodedToken.uid,
      display_mode: scraped.display_mode,
      metrics: { views: 0, likes: 0, rating: 5.0 },
      tags: body.custom_tags || scraped.tags,
      created_at: new Date().toISOString(),
    };

    await addGame(newGame);

    return NextResponse.json({
      message: 'Game submitted successfully',
      game: newGame,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
