import { GameDocument, ScrapedMetadata, SubmitGamePayload } from '@/types/game';

const RUST_BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${RUST_BACKEND_BASE}${endpoint}`;
  console.log(`Fetching from backend: ${url}`);
  
  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `API request failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getGames(tag?: string, search?: string): Promise<{ count: number; games: GameDocument[] }> {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);
  params.append('_t', Date.now().toString()); // Cache buster to force fresh data
  
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  return fetchFromBackend<{ count: number; games: GameDocument[] }>(
    `/games${queryStr}`
  );
}

export async function getGameById(id: string): Promise<{ game: GameDocument }> {
  return fetchFromBackend<{ game: GameDocument }>(
    `/games/${id}`
  );
}

export async function deleteGameApi(id: string, token: string): Promise<{ message: string }> {
  return fetchFromBackend<{ message: string }>(
    `/games/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
}

export async function scrapeUrlPreview(url: string): Promise<ScrapedMetadata> {
  return fetchFromBackend<ScrapedMetadata>(
    `/games/scrape`,
    {
      method: 'POST',
      body: JSON.stringify({ url }),
    }
  );
}

export async function submitGame(payload: SubmitGamePayload): Promise<{ message: string; game: GameDocument }> {
  return fetchFromBackend<{ message: string; game: GameDocument }>(
    `/games/submit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function incrementGameView(id: string): Promise<{ game: GameDocument }> {
  return fetchFromBackend<{ game: GameDocument }>(
    `/games/${id}/view`,
    { method: 'POST' }
  );
}

export async function incrementGameLike(id: string): Promise<{ game: GameDocument }> {
  return fetchFromBackend<{ game: GameDocument }>(
    `/games/${id}/like`,
    { method: 'POST' }
  );
}
