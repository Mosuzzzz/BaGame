import { GameDocument, DisplayMode, ScrapedMetadata } from '@/types/game';
import { getCloudGames, deleteCloudGame, addCloudGame, incrementCloudGameMetrics, SEED_GAMES } from '@/lib/db';

export function hashString(input: string): string {
  // Keeping this if needed elsewhere, though auth is moving to Firebase
  return input; 
}

const BLOCKED_KEYWORDS = [
  'casino', 'slot', 'baccarat', 'pgslot', 'pg-slot', 'bet', 'gambling', 'poker', 'hilo',
  'แทงบอล', 'สล็อต', 'คาสิโน', 'บาคาร่า', 'หวย', 'ufabet', '777', '888', 'vipbet', 'bk8',
  'w88', 'fun88', 'm88', 'sa gaming', 'sexy baccarat', 'เว็บพนัน', 'แทงหวย', 'พนัน',
  'porn', 'xxx', 'adult', 'hentai', 'nsfw', 'sex', 'erotic', 'xvideos', 'pornhub', 'xnxx', '18+'
];

export function checkUrlSafety(url: string, htmlContent?: string): { safe: boolean; reason?: string } {
  const lowerUrl = url.toLowerCase();

  for (const kw of BLOCKED_KEYWORDS) {
    if (lowerUrl.includes(kw)) {
      return {
        safe: false,
        reason: `⚠️ ระบบปฏิเสธ URL นี้: ตรวจพบคำต้องห้าม "${kw}"`,
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

export async function getStore(): Promise<GameDocument[]> {
  return await getCloudGames();
}

export async function addGame(game: GameDocument): Promise<GameDocument> {
  game.display_mode = 'EMBEDDED';
  await addCloudGame(game);
  return game;
}

export async function deleteGame(id: string): Promise<boolean> {
  await deleteCloudGame(id);
  return true;
}

export async function updateGameMetrics(id: string, viewInc = 0, likeInc = 0): Promise<GameDocument | null> {
  return await incrementCloudGameMetrics(id, viewInc, likeInc);
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
      signal: AbortSignal.timeout(8000)
    });

    // Limit response size manually if possible (Not fully possible with fetch text() out of the box, 
    // but we can check Content-Length)
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      throw new Error('Response is too large');
    }

    const html = await res.text();
    if (html.length > 10 * 1024 * 1024) {
      throw new Error('Response is too large');
    }

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
