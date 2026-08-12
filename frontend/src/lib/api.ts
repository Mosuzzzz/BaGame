import { GameDocument, ScrapedMetadata, SubmitGamePayload } from '@/types/game';

const RUST_BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function fetchWithFallback<T>(rustEndpoint: string, nextEndpoint: string, options?: RequestInit): Promise<T> {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost) {
    try {
      const rustRes = await fetch(`${RUST_BACKEND_BASE}${rustEndpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      if (rustRes.ok) {
        return await rustRes.json();
      }
    } catch (err) {
      // Fall back to Next.js API routes when Rust server is offline
    }
  }

  const nextRes = await fetch(nextEndpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!nextRes.ok) {
    const errorData = await nextRes.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || 'API request failed');
  }

  return await nextRes.json();
}

export async function getGames(tag?: string, search?: string): Promise<{ count: number; games: GameDocument[] }> {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback<{ count: number; games: GameDocument[] }>(
    `/games${queryStr}`,
    `/api/games${queryStr}`
  );
}

export async function getGameById(id: string): Promise<{ game: GameDocument }> {
  return fetchWithFallback<{ game: GameDocument }>(
    `/games/${id}`,
    `/api/games/${id}`
  );
}

export async function deleteGameApi(id: string, token: string): Promise<{ message: string }> {
  return fetchWithFallback<{ message: string }>(
    `/games/${id}`,
    `/api/games/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
}

export async function scrapeUrlPreview(url: string): Promise<ScrapedMetadata> {
  return fetchWithFallback<ScrapedMetadata>(
    `/games/scrape`,
    `/api/games/scrape`,
    {
      method: 'POST',
      body: JSON.stringify({ url }),
    }
  );
}

export async function submitGame(payload: SubmitGamePayload): Promise<{ message: string; game: GameDocument }> {
  return fetchWithFallback<{ message: string; game: GameDocument }>(
    `/games/submit`,
    `/api/games/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function incrementGameView(id: string): Promise<{ game: GameDocument }> {
  return fetchWithFallback<{ game: GameDocument }>(
    `/games/${id}/view`,
    `/api/games/${id}/view`,
    { method: 'POST' }
  );
}

export async function incrementGameLike(id: string): Promise<{ game: GameDocument }> {
  return fetchWithFallback<{ game: GameDocument }>(
    `/games/${id}/like`,
    `/api/games/${id}/like`,
    { method: 'POST' }
  );
}
