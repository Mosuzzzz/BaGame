'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { EmbedPlayer } from '@/components/EmbedPlayer';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/components/AuthContext';
import { deleteGameApi, getGameById, getGames, incrementGameLike, incrementGameView } from '@/lib/api';
import { GameDocument } from '@/types/game';
import {
  ArrowLeft,
  ThumbsUp,
  Eye,
  Star,
  Share2,
  ExternalLink,
  Tag,
  Gamepad2,
  GraduationCap,
  Trash2,
} from 'lucide-react';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, token } = useAuth();

  const [game, setGame] = useState<GameDocument | null>(null);
  const [relatedGames, setRelatedGames] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const loadGameDetails = async () => {
      try {
        setLoading(true);

        const likedInStorage = localStorage.getItem(`liked_${gameId}`);
        if (likedInStorage === 'true') {
          setHasLiked(true);
        }

        let foundGame: GameDocument | null = null;
        const updatedView = await incrementGameView(gameId).catch(() => null);
        if (updatedView && updatedView.game) {
          foundGame = updatedView.game;
        } else {
          const res = await getGameById(gameId).catch(() => null);
          if (res && res.game) {
            foundGame = res.game;
          }
        }


        setGame(foundGame);

        const all = await getGames().catch(() => ({ count: 0, games: [] }));
        if (all && Array.isArray(all.games)) {
          setRelatedGames(all.games.filter((g) => g.id !== gameId).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load game details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGameDetails();
  }, [gameId]);

  const handleDeleteGame = async (id: string, title: string) => {
    const confirmDelete = confirm(`คุณต้องการลบผลงานเกม "${title}" ออกจากระบบ BaGame หรือไม่?`);
    if (!confirmDelete) return;

    try {
      await deleteGameApi(id, token || '');


      alert(`ลบผลงานเกม "${title}" เรียบร้อยแล้ว`);
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถลบเกมได้';
      alert(msg);
    }
  };

  const handleLike = async () => {
    if (!game || hasLiked) return;
    setHasLiked(true);
    localStorage.setItem(`liked_${game.id}`, 'true');

    // Optimistically update likes in local UI state
    setGame((prev) =>
      prev
        ? {
            ...prev,
            metrics: {
              ...prev.metrics,
              likes: (prev.metrics?.likes || 0) + 1,
            },
          }
        : null
    );


    // Async server call
    await incrementGameLike(game.id).catch(() => null);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: game?.title || 'Play Game',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('คัดลอกลิงก์ผลงานเกมเรียบร้อยแล้ว!');
    }
  };

  const viewsCount = game?.metrics?.views ?? 0;
  const likesCount = game?.metrics?.likes ?? 0;
  const ratingVal = game?.metrics?.rating ?? 5.0;
  const targetUrl = game?.original_url || (game as any)?.url || '';

  return (
    <div className="flex-1 flex flex-col bg-[#050505] text-[#f3f4f6]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4ff33] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-2/3 bg-white/5 rounded-lg" />
            <div className="aspect-video w-full bg-white/5 rounded-2xl" />
          </div>
        ) : !game ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 space-y-4 border border-white/10 backdrop-blur-md">
            <Gamepad2 className="w-12 h-12 text-zinc-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">ไม่พบผลงานเกมที่ระบุ</h2>
            <p className="text-sm text-zinc-400">ไม่พบ ID ผลงานเกมนี้ในระบบ BaGame หรือเกมถูกลบออกไปแล้ว</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 rounded-full border border-[#d4ff33] text-[#d4ff33] text-xs font-bold transition-all duration-300"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Title & Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-pixel tracking-wider text-white">
                  {game.title}
                </h1>
                <p className="text-xs text-zinc-400 mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 font-semibold text-[#d4ff33]">
                    <GraduationCap className="w-3.5 h-3.5" />
                    สร้างสรรค์โดย {game.creator_id || 'นิสิต CS 67'}
                  </span>
                  <span>•</span>
                  <span>{new Date(game.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {user && (
                  <button
                    onClick={() => handleDeleteGame(game.id, game.title)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-950/80 hover:bg-red-900 text-red-300 font-semibold text-xs border border-red-500/25 transition-all hover:scale-105 active:scale-95"
                    title="ลบเกมนี้ออกจากระบบ"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบเกมนี้</span>
                  </button>
                )}

                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    hasLiked
                      ? 'bg-[#d4ff33]/10 text-[#d4ff33] border border-[#d4ff33]/30 cursor-default shadow-inner'
                      : 'border border-[#d4ff33] text-[#d4ff33] hover:bg-[#d4ff33] hover:text-black shadow-[0_0_15px_rgba(212,255,51,0.1)] hover:shadow-[0_0_20px_rgba(212,255,51,0.3)] active:scale-95'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current text-[#d4ff33]' : ''}`} />
                  <span>{hasLiked ? `กดชื่นชอบแล้ว (${likesCount})` : `ชื่นชอบ (${likesCount})`}</span>
                </button>

                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
                  <Eye className="w-4 h-4 text-zinc-500" />
                  <span>{viewsCount.toLocaleString()} ผู้เข้าชม</span>
                </div>

                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{ratingVal.toFixed(1)}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                  title="แชร์ผลงานเกม"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Player Component */}
            <EmbedPlayer game={game} />

            {/* Game Description & Metadata Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Description & Tags */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 shadow-xl">
                <h3 className="font-pixel text-sm tracking-wide text-white">รายละเอียดผลงาน / Description</h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {game.description}
                </p>

                {game.tags && game.tags.length > 0 && (
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#d4ff33]" />
                      หมวดหมู่ & แท็ก
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-[#d4ff33]/5 text-xs font-semibold text-[#d4ff33] border border-[#d4ff33]/15"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Information Specs */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 shadow-xl">
                <h3 className="font-pixel text-sm tracking-wide text-white">ข้อมูลเชิงเทคนิค (Specs)</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">ผู้สร้างสรรค์</span>
                    <span className="font-bold text-[#d4ff33]">{game.creator_id || 'นิสิต CS 67'}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">โครงการ</span>
                    <span className="font-bold text-[#d4ff33]">วิทยาการคอมพิวเตอร์ CS 67</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">การแสดงผล</span>
                    <span className="font-bold text-blue-400 uppercase">{game.display_mode || 'EMBEDDED'}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-zinc-400">อัตราส่วนเฟรม</span>
                    <span className="font-bold text-zinc-200">16:9 Standard</span>
                  </div>

                  {targetUrl && (
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">ลิงก์เว็บต้นทาง</span>
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#d4ff33] hover:underline flex items-center gap-1"
                      >
                        <span>เยี่ยมชมเว็บไซต์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Related Games */}
            {relatedGames.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="font-pixel text-base tracking-wide text-white">ผลงานเกมอื่นๆ ที่น่าสนใจ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedGames.map((rg) => (
                    <GameCard
                      key={rg.id}
                      game={rg}
                      isAdmin={!!user}
                      onDeleteGame={handleDeleteGame}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
