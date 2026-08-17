'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { EmbedPlayer } from '@/components/EmbedPlayer';
import { GameCard } from '@/components/GameCard';
import { SubmitGameModal } from '@/components/SubmitGameModal';
import { AdminLoginModal, ADMIN_PASS_HASH } from '@/components/AdminLoginModal';
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

  const [game, setGame] = useState<GameDocument | null>(null);
  const [relatedGames, setRelatedGames] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    if (!gameId) return;

    const storedAuth = sessionStorage.getItem('cs67_admin_auth');
    if (storedAuth === ADMIN_PASS_HASH || storedAuth === '67morethen66') {
      setIsAdmin(true);
      setAdminPass(storedAuth);
    }

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

        // Fallback to LocalStorage if game not found in memory/cloud
        if (!foundGame) {
          try {
            const storedLocal = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
            if (storedLocal) {
              const localGames: GameDocument[] = JSON.parse(storedLocal);
              foundGame = localGames.find((g) => g.id === gameId) || null;
            }
          } catch (e) {}
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

  const handleAdminSuccess = (hashOrPass: string) => {
    setIsAdmin(true);
    setAdminPass(hashOrPass);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('cs67_admin_auth');
    setIsAdmin(false);
    setAdminPass('');
  };

  const handleDeleteGame = async (id: string, title: string) => {
    const confirmDelete = confirm(`คุณต้องการลบผลงานเกม "${title}" ออกจากระบบ BaGame หรือไม่?`);
    if (!confirmDelete) return;

    try {
      const passToSend = adminPass || sessionStorage.getItem('cs67_admin_auth') || ADMIN_PASS_HASH;
      await deleteGameApi(id, passToSend).catch(() => null);

      // Clean LocalStorage
      try {
        const storedLocal = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
        if (storedLocal) {
          const localGames: GameDocument[] = JSON.parse(storedLocal);
          const updatedLocal = localGames.filter((g) => g.id !== id);
          localStorage.setItem(LOCAL_STORAGE_GAMES_KEY, JSON.stringify(updatedLocal));
        }
      } catch (e) {}

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

    // Also update LocalStorage
    try {
      const storedLocal = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
      if (storedLocal) {
        const localGames: GameDocument[] = JSON.parse(storedLocal);
        const updatedLocal = localGames.map((g) =>
          g.id === game.id
            ? { ...g, metrics: { ...g.metrics, likes: g.metrics.likes + 1 } }
            : g
        );
        localStorage.setItem(LOCAL_STORAGE_GAMES_KEY, JSON.stringify(updatedLocal));
      }
    } catch (e) {}

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
    <div className="min-h-screen flex flex-col bg-[#050814] text-white">
      <Header
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTag={activeTag}
        setActiveTag={setActiveTag}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่คลังผลงาน CS 67 (Back to Showcase)</span>
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-2/3 bg-[#0e152e] rounded-lg" />
            <div className="aspect-video w-full bg-[#0e152e] rounded-2xl" />
          </div>
        ) : !game ? (
          <div className="p-12 text-center rounded-2xl bg-[#0e152e] space-y-4 border border-sky-500/20">
            <Gamepad2 className="w-12 h-12 text-slate-500 mx-auto" />
            <h2 className="text-xl font-bold">ไม่พบผลงานเกมที่ระบุ</h2>
            <p className="text-sm text-slate-400">ไม่พบ ID ผลงานเกมนี้ในระบบ BaGame หรือเกมถูกลบออกไปแล้ว</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white shadow-lg"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Title & Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {game.title}
                </h1>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 font-semibold text-sky-300">
                    <GraduationCap className="w-3.5 h-3.5" />
                    สร้างสรรค์โดย {game.creator_id || 'นิสิต CS 67'}
                  </span>
                  <span>•</span>
                  <span>{new Date(game.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteGame(game.id, game.title)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 border border-white/20 transition-all hover:scale-105 active:scale-95"
                    title="ลบเกมนี้ออกจากระบบ"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบเกมนี้</span>
                  </button>
                )}

                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    hasLiked
                      ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40 cursor-default shadow-inner'
                      : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-blue-600/30 active:scale-95 border border-white/20'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current text-sky-300' : ''}`} />
                  <span>{hasLiked ? `กดชื่นชอบแล้ว (${likesCount})` : `ชื่นชอบ (${likesCount})`}</span>
                </button>

                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e152e] border border-sky-500/30 text-xs font-semibold text-slate-200">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>{viewsCount.toLocaleString()} ผู้เข้าชมจริง</span>
                </div>

                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0e152e] border border-sky-500/30 text-xs font-bold text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{ratingVal.toFixed(1)}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-[#0e152e] hover:bg-[#162248] border border-sky-500/30 text-slate-200 hover:text-white transition-colors"
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e152e] border border-sky-500/20 space-y-4 shadow-xl">
                <h3 className="font-extrabold text-base text-white">รายละเอียดผลงาน</h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {game.description}
                </p>

                {game.tags && game.tags.length > 0 && (
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-sky-400" />
                      หมวดหมู่ & แท็ก
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-[#162248] text-xs font-semibold text-sky-300 border border-sky-500/30"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Information Specs */}
              <div className="p-6 rounded-2xl bg-[#0e152e] border border-sky-500/20 space-y-4 shadow-xl">
                <h3 className="font-extrabold text-base text-white">ข้อมูลเชิงเทคนิค (Specs)</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-400">ผู้สร้างสรรค์</span>
                    <span className="font-bold text-sky-300">{game.creator_id || 'นิสิต CS 67'}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-400">สังกัดโครงการ</span>
                    <span className="font-bold text-sky-300">วิทยาการคอมพิวเตอร์ CS 67</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-400">โหมดการแสดงผล</span>
                    <span className="font-bold text-blue-400">{game.display_mode || 'EMBEDDED'}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-slate-400">อัตราส่วนเฟรม</span>
                    <span className="font-bold text-white">16:9 Standard Ratio</span>
                  </div>

                  {targetUrl && (
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">ลิงก์เว็บต้นทาง</span>
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-sky-300 hover:underline flex items-center gap-1"
                      >
                        <span>เยี่ยมชมเว็บไซต์</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Related Games */}
            {relatedGames.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-extrabold text-lg text-white">ผลงานเกมอื่นๆ ของ CS 67 ที่น่าสนใจ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedGames.map((rg) => (
                    <GameCard
                      key={rg.id}
                      game={rg}
                      isAdmin={isAdmin}
                      onDeleteGame={handleDeleteGame}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      <SubmitGameModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {}}
      />

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
