import { GameDocument, DisplayMode, ScrapedMetadata } from '@/types/game';
import { getCloudGames, deleteCloudGame, saveCloudGames, SEED_GAMES } from '@/lib/db';
import crypto from 'crypto';

// SHA-256 Hash of "67morethen66"
export const ADMIN_PASSWORD_HASH = 'b9982e40e58fffb52a1df3c6da5dc2f5c7c260c3881bd68f667a8e301c92a821';

export function hashString(input: string): string {
  if (!input) return '';
  if (input.length === 64 && /^[a-f0-9]+$/i.test(input)) {
    return input.toLowerCase(); // Already SHA-256 hash
  }
  return crypto.createHash('sha256').update(input).digest('hex').toLowerCase();
}

const BLOCKED_KEYWORDS = [
  // Gambling / Casino keywords
  'casino', 'slot', 'baccarat', 'pgslot', 'pg-slot', 'bet', 'gambling', 'poker', 'hilo',
  'แทงบอล', 'สล็อต', 'คาสิโน', 'บาคาร่า', 'หวย', 'ufabet', '777', '888', 'vipbet', 'bk8',
  'w88', 'fun88', 'm88', 'sa gaming', 'sexy baccarat', 'เว็บพนัน', 'แทงหวย', 'พนัน',
  // Adult / NSFW keywords
  'porn', 'xxx', 'adult', 'hentai', 'nsfw', 'sex', 'erotic', 'xvideos', 'pornhub', 'xnxx', '18+'
];

export function checkUrlSafety(url: string, htmlContent?: string): { safe: boolean; reason?: string } {
  const lowerUrl = url.toLowerCase();

  for (const kw of BLOCKED_KEYWORDS) {
    if (lowerUrl.includes(kw)) {
      return {
        safe: false,
        reason: `⚠️ ระบบปฏิเสธ URL นี้: ตรวจพบคำต้องห้าม "${kw}" (ไม่อนุญาตเว็บพนัน สล็อต หรือสื่อไม่เหมาะสม)`,
      };
    }
  }

  if (htmlContent) {
    const lowerHtml = htmlContent.toLowerCase();
    for (const kw of BLOCKED_KEYWORDS) {
      if (lowerHtml.includes(` ${kw} `) || lowerHtml.includes(`"${kw}"`) || lowerHtml.includes(`>${kw}<`)) {
        return {
          safe: false,
          reason: `⚠️ ระบบปฏิเสธ URL นี้: ตรวจพบเนื้อหาเว็บพนันหรือสื่อไม่เหมาะสมในเว็บไซต์ ("${kw}")`,
        };
      }
    }
  }

  return { safe: true };
}

let inMemoryGames: GameDocument[] = [];

export async function getStore(): Promise<GameDocument[]> {
  try {
    const cloud = await getCloudGames();
    if (cloud) {
      inMemoryGames = cloud;
    }
  } catch (e) {}
  return inMemoryGames;
}

export async function addGame(game: GameDocument): Promise<GameDocument> {
  game.display_mode = 'EMBEDDED';
  inMemoryGames.unshift(game);
  try {
    await saveCloudGames(inMemoryGames);
  } catch (e) {}
  return game;
}

export async function deleteGame(id: string, passOrHash: string): Promise<boolean> {
  if (!passOrHash) return false;
  
  const inputHash = hashString(passOrHash);
  const isValidAdmin =
    inputHash === ADMIN_PASSWORD_HASH ||
    passOrHash === '67morethen66' ||
    passOrHash === ADMIN_PASSWORD_HASH;

  if (!isValidAdmin) {
    return false;
  }

  const currentStore = await getStore();
  const initialLen = currentStore.length;
  const updatedGames = currentStore.filter((g) => g.id !== id);
  inMemoryGames = updatedGames;

  try {
    await deleteCloudGame(id);
    await saveCloudGames(updatedGames);
  } catch (e) {}

  return updatedGames.length < initialLen || initialLen > 0;
}

export async function updateGameMetrics(id: string, viewInc = 0, likeInc = 0): Promise<GameDocument | null> {
  const games = await getStore();
  const g = games.find((item) => item.id === id);
  if (!g) return null;
  g.metrics.views += viewInc;
  g.metrics.likes += likeInc;
  try {
    await saveCloudGames(games);
  } catch (e) {}
  return g;
}

export async function scrapeUrl(targetUrl: string): Promise<ScrapedMetadata> {
  const urlCheck = checkUrlSafety(targetUrl);
  if (!urlCheck.safe) {
    throw new Error(urlCheck.reason || 'URL ไม่อนุญาต');
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebGameAggregator/1.0',
      },
    });

    const html = await res.text();

    const htmlCheck = checkUrlSafety(targetUrl, html);
    if (!htmlCheck.safe) {
      throw new Error(htmlCheck.reason || 'เนื้อหาเว็บไซต์ไม่ผ่านเกณฑ์ความปลอดภัย');
    }

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = ogTitleMatch?.[1] || titleTagMatch?.[1] || 'ผลงานเกม CS67';

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = ogDescMatch?.[1] || metaDescMatch?.[1] || 'เล่นผลงานเว็บเกมนี้บนแพลตฟอร์ม BaGame (CS67)';

    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    let thumbnail_url = ogImgMatch?.[1] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';

    if (thumbnail_url.startsWith('/')) {
      const u = new URL(targetUrl);
      thumbnail_url = `${u.origin}${thumbnail_url}`;
    }

    const tags: string[] = ['cs67', 'arcade'];
    if (targetUrl.includes('itch.io')) tags.push('itch-io');
    if (targetUrl.includes('gamejolt')) tags.push('game-jolt');
    if (html.toLowerCase().includes('webgl')) tags.push('webgl');
    if (html.toLowerCase().includes('canvas')) tags.push('html5');

    return {
      title: title.trim(),
      description: description.trim(),
      thumbnail_url,
      display_mode: 'EMBEDDED' as DisplayMode,
      tags: Array.from(new Set(tags)),
      original_url: targetUrl,
      embed_code: undefined,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('⚠️')) {
      throw err;
    }
    return {
      title: 'ผลงานเว็บเกม CS 67',
      description: 'เล่นผลงานเว็บเกมสดผ่านระบบ Sandboxed Player 16:9',
      thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      display_mode: 'EMBEDDED' as DisplayMode,
      tags: ['cs67', 'arcade', 'webgl'],
      original_url: targetUrl,
      embed_code: undefined,
    };
  }
}
