'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { EmbedPlayer } from '@/components/EmbedPlayer';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
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
  Edit2,
  Link as LinkIcon,
} from 'lucide-react';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, token, isAdmin } = useAuth();
  const { t } = useLanguage();

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: game?.title || 'Play Game',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('linkCopied'));
    }
  };

  const viewsCount = game?.metrics?.views ?? 0;
  const likesCount = game?.metrics?.likes ?? 0;
  const ratingVal = game?.metrics?.rating ?? 5.0;
  const targetUrl = game?.original_url || (game as any)?.url || '';

  return (
    <div className="flex-1 flex flex-col relative z-10">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#f97316] dark:text-[#d4ff33] hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-2/3 bg-gray-200 dark:bg-white/5 rounded-lg" />
            <div className="aspect-video w-full bg-gray-200 dark:bg-white/5 rounded-2xl" />
          </div>
        ) : !game ? (
          <div className="p-12 text-center rounded-2xl bg-gray-50 dark:bg-white/5 space-y-4 border border-gray-200 dark:border-white/10 backdrop-blur-md">
            <Gamepad2 className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('gameNotFoundTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('gameNotFoundDesc')}</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 rounded-full border border-gray-200 dark:border-[#d4ff33] text-[#f97316] dark:text-[#d4ff33] text-xs font-bold transition-all duration-300"
            >
              {t('backBtn')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Embedded Player Component */}
            <EmbedPlayer game={game} />
            
            {/* Title & Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-xl transition-colors duration-300">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {game.title}
                </h1>
                <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-1.5 font-medium transition-colors duration-300">
                  <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                  <span className="text-gray-700 dark:text-zinc-200 font-bold">{ratingVal.toFixed(1)}</span>
                  <span className="mx-0.5">•</span>
                  <span>{viewsCount.toLocaleString()} {t('playTimes')}</span>
                  <span className="mx-0.5">•</span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-zinc-300">
                    <GraduationCap className="w-3.5 h-3.5 text-[#f97316] dark:text-[#d4ff33]" />
                    {t('createdBy')} {game.creator_id || t('studentCS67')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    hasLiked
                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-zinc-300'
                  }`}
                  title={t('likeBtn')}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current text-blue-600 dark:text-blue-400' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-zinc-300 transition-colors flex items-center justify-center"
                  title={t('shareBtn')}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                
                {/* Website Button */}
                {game.website_url && (
                  <a
                    href={game.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-zinc-300 transition-colors flex items-center justify-center"
                    title={t('websiteBtn')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                
                {/* Manual Button */}
                {game.manual_url && (
                  <a
                    href={game.manual_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-zinc-300 transition-colors flex items-center justify-center"
                    title={t('manualBtn')}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </a>
                )}

                {/* Edit Button (Only for owner/admin) */}
                {user && (user.displayName === game.creator_id || user.displayName === 'Admin') && (
                  <Link
                    href={`/edit/${game.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-sm ml-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                )}

                {/* Delete Button */}
                {user && (isAdmin || user.displayName === game.creator_id) && (
                  <button
                    onClick={() => handleDeleteGame(game.id, game.title)}
                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center ml-2"
                    title={t('deleteBtn')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Game Description & Metadata Details */}
            <div className="w-full">
              <div className="p-6 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md space-y-4 shadow-xl transition-colors duration-300">
                <h3 className="font-pixel text-sm tracking-wide text-gray-900 dark:text-white">{t('descTitle')}</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {game.description}
                </p>

                {game.tags && game.tags.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-white/5 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#f97316] dark:text-[#d4ff33]" />
                      {t('tagsTitle')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tItem, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-orange-100 dark:bg-[#d4ff33]/5 text-xs font-semibold text-[#f97316] dark:text-[#d4ff33] border border-orange-200 dark:border-[#d4ff33]/15"
                        >
                          #{tItem}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Games */}
            {relatedGames.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="font-pixel text-base tracking-wide text-gray-900 dark:text-white">ผลงานเกมอื่นๆ ที่น่าสนใจ</h3>
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
