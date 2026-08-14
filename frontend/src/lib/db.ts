import { GameDocument } from '@/types/game';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Default Seed Games for CS67 (Empty so only user submitted games appear)
export const SEED_GAMES: GameDocument[] = [];

export async function getCloudGames(): Promise<GameDocument[]> {
  try {
    // Fetch all game IDs from the ZSET (newest first)
    const gameIds = await redis.zrange('games:index', 0, -1, { rev: true });
    if (!gameIds || gameIds.length === 0) return SEED_GAMES;

    // Use a pipeline to fetch all game documents
    const p = redis.pipeline();
    for (const id of gameIds) {
      p.get(`game:${id}`);
    }
    const games = await p.exec<GameDocument[]>();
    
    // Filter out any nulls if keys expired/missing
    return games.filter(Boolean);
  } catch (err) {
    console.error('KV Storage Error:', err);
    throw new Error('Failed to fetch games from database');
  }
}

export async function saveCloudGames(games: GameDocument[]): Promise<boolean> {
  // Migration or bulk save helper
  try {
    const p = redis.pipeline();
    for (const game of games) {
      p.set(`game:${game.id}`, game);
      // Score by created_at timestamp or current time
      const score = game.created_at ? new Date(game.created_at).getTime() : Date.now();
      p.zadd('games:index', { score, member: game.id });
    }
    await p.exec();
    return true;
  } catch (err) {
    console.error('KV Storage Error:', err);
    throw new Error('Failed to save games to database');
  }
}

export async function addCloudGame(game: GameDocument): Promise<GameDocument[]> {
  try {
    const p = redis.pipeline();
    p.set(`game:${game.id}`, game);
    const score = game.created_at ? new Date(game.created_at).getTime() : Date.now();
    p.zadd('games:index', { score, member: game.id });
    await p.exec();
    return await getCloudGames();
  } catch (err) {
    console.error('KV Add Error:', err);
    throw new Error('Failed to add game to database');
  }
}

export async function deleteCloudGame(id: string): Promise<GameDocument[]> {
  try {
    const p = redis.pipeline();
    p.del(`game:${id}`);
    p.zrem('games:index', id);
    await p.exec();
    return await getCloudGames();
  } catch (err) {
    console.error('KV Delete Error:', err);
    throw new Error('Failed to delete game from database');
  }
}

export async function incrementCloudGameMetrics(id: string, viewInc: number, likeInc: number): Promise<GameDocument | null> {
  try {
    // Check if the game exists first to prevent creating useless metrics hashes for fake IDs
    let game = await redis.get<GameDocument>(`game:${id}`);
    if (!game) {
      return null;
    }

    // Increment metrics atomically
    const p = redis.pipeline();
    if (viewInc > 0) p.hincrby(`game_metrics:${id}`, 'views', viewInc);
    if (likeInc > 0) p.hincrby(`game_metrics:${id}`, 'likes', likeInc);
    await p.exec();
    
    // Fetch the updated metrics
    const metrics = await redis.hgetall<Record<string, string>>(`game_metrics:${id}`);
    
    game.metrics.views = parseInt(metrics?.views || '0', 10);
    game.metrics.likes = parseInt(metrics?.likes || '0', 10);
    
    // Update the main document cache just in case (optional, but good if we read from game:${id} directly)
    await redis.set(`game:${id}`, game);
    
    return game;
  } catch (err) {
    console.error('KV Metrics Error:', err);
    throw new Error('Failed to update game metrics');
  }
}

export { redis };
