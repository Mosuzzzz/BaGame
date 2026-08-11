'use client';

import React, { useEffect, useState } from 'react';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/components/AuthContext';
import { deleteGameApi, getGames } from '@/lib/api';
import { GameDocument } from '@/types/game';
import { Gamepad2, Flame, RefreshCw, Search, User, Star, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';
const LOCAL_STORAGE_FAVS_KEY = 'cs67_fav_games';

export default function HomePage() {
  const { user, token, signOut, isMenuOpen } = useAuth();
  const { t } = useLanguage();
  const [games, setGames] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const [favGameIds, setFavGameIds] = useState<string[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);



  // Load favorites from local storage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(LOCAL_STORAGE_FAVS_KEY);
      if (savedFavs) {
        setFavGameIds(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await getGames(activeTag, searchQuery);
      let combinedGames = [...res.games];



      // Filter by activeTag if selected
      if (activeTag) {
        const tagLower = activeTag.toLowerCase();
        combinedGames = combinedGames.filter((g) =>
          g.tags.some((t) => t.toLowerCase() === tagLower)
        );
      }

      // Filter by search query if typed
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        combinedGames = combinedGames.filter(
          (g) =>
            g.title.toLowerCase().includes(queryLower) ||
            g.description.toLowerCase().includes(queryLower) ||
            g.creator_id.toLowerCase().includes(queryLower)
        );
      }

      // Filter by favorites if toggled
      if (showOnlyFavs) {
        combinedGames = combinedGames.filter((g) => favGameIds.includes(g.id));
      }

      setGames(combinedGames);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [activeTag, searchQuery, showOnlyFavs, favGameIds]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (favGameIds.includes(id)) {
      updated = favGameIds.filter((favId) => favId !== id);
    } else {
      updated = [...favGameIds, id];
    }
    setFavGameIds(updated);
    localStorage.setItem(LOCAL_STORAGE_FAVS_KEY, JSON.stringify(updated));
  };

  const handleDeleteGame = async (id: string, title: string) => {
    const confirmDelete = confirm(`คุณต้องการลบผลงานเกม "${title}" ออกจากระบบ BaGame หรือไม่?`);
    if (!confirmDelete) return;

    // Optimistically remove from UI
    setGames((prev) => prev.filter((g) => g.id !== id));

    // Call Delete API with JWT token
    try {
      await deleteGameApi(id, token || '');
      alert(`ลบผลงานเกม "${title}" ออกจากระบบเรียบร้อยแล้ว`);
      fetchGames();
    } catch (err: unknown) {
      console.warn('API delete warning (removed locally):', err);
    }
  };

  const categories = [
    { id: '', label: 'ทั้งหมด' },
    { id: 'cs67', label: 'CS67' },
    { id: 'webgl', label: 'WebGL' },
    { id: 'html5', label: 'HTML5' },
    { id: 'itch-io', label: 'Itch.io' },
    { id: 'action', label: 'Action' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'arcade', label: 'Arcade' },
    { id: 'platformer', label: 'Platformer' },
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'rpg', label: 'RPG' },
    { id: 'shooter', label: 'Shooter' },
    { id: 'simulation', label: 'Simulation' },
    { id: 'sports', label: 'Sports' },
    { id: 'strategy', label: 'Strategy' },
  ];

  return (
    <div className="flex-1 flex flex-col relative z-10">
      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-16 space-y-16 relative z-10">

        {/* Central Hero landing info */}
        <div className="text-center space-y-8 max-w-3xl mx-auto pt-8">
          <h1 className="font-logo text-5xl md:text-7xl font-extrabold tracking-wider leading-none text-white drop-shadow-[0_0_20px_rgba(212,255,51,0.3)]">
            BA<span className="text-[#d4ff33]">GAME</span>
          </h1>

          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {t('heroDesc')}
          </p>

          {/* Centralized Search Bar */}
          <div className="max-w-xl w-full mx-auto pt-4">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full pl-5 pr-2 py-2 focus-within:border-[#d4ff33] focus-within:ring-1 focus-within:ring-[#d4ff33]/30 transition-all duration-300">
              <Search className="w-4 h-4 text-zinc-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white placeholder-zinc-500 focus:outline-none flex-1 text-xs w-full"
              />
              <button
                onClick={fetchGames}
                className="px-6 py-2 rounded-full bg-white/10 hover:bg-[#d4ff33] text-white hover:text-black text-xs font-bold transition-all duration-300"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* ALL GAMES GALLERY CONTAINER SECTION */}
        <div className="bg-[#121212]/40 border border-white/5 rounded-[28px] p-8 md:p-10 backdrop-blur-md shadow-2xl space-y-8">

          {/* Section Heading & Category Filter Pills */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
               
                <h2 className="font-semibold text-sm text-white tracking-wider uppercase">
                  {showOnlyFavs ? t('favToggleOn') : activeTag ? `Category: ${activeTag}` : t('allCategories')}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 font-bold border border-white/5">
                  {games.length}
                </span>
              </div>

              <button
                onClick={fetchGames}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-zinc-300 border border-white/5 transition-all duration-300"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTag(cat.id)}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${activeTag === cat.id
                      ? 'bg-[#d4ff33] text-black border-[#d4ff33] shadow-[0_0_15px_rgba(212,255,51,0.25)]'
                      : 'bg-[#181818]/60 text-zinc-400 border-white/5 hover:bg-[#1f1f1f]/80 hover:text-white'
                    }`}
                >
                  {cat.label === 'ทั้งหมด' ? 'ALL' : cat.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Game Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[16/11] rounded-2xl bg-white/5 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/5 border border-white/5 text-center space-y-4 backdrop-blur-md">
              <h3 className="font-semibold text-lg text-white">{t('noGamesFound')}</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {t('noGamesDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.slice(0, 6).map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isAdmin={!!user}
                    onDeleteGame={handleDeleteGame}
                    isFavorite={favGameIds.includes(game.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>

              {/* View All Games Button */}
              <div className="text-center pt-4">
                <Link
                  href="/games"
                  className="inline-block px-8 py-3 rounded-full border border-[#d4ff33] text-[#d4ff33] hover:bg-[#d4ff33] hover:text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(212,255,51,0.05)] hover:shadow-[0_0_20px_rgba(212,255,51,0.2)] active:scale-95"
                >
                  {t('exploreGames')} &rarr;
                </Link>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-zinc-950/40 py-10 px-4 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-4">
          <p>© 2026 BaGame - {t('footerDesc')}. {t('footerRights')}.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>{t('footerDesc')}</span>
            <span className="text-zinc-600">•</span>
            <span>NextAuth rmuti.ac.th SSO</span>
            <span className="text-zinc-600">•</span>
            <span>Sandboxed Runtime</span>
          </div>
        </div>
      </footer>

      {/* FLOATING CARD OVERLAY (Visible only when logged in & menu is open) */}
      {user && isMenuOpen && (
        <div className="fixed bottom-12 right-12 z-50 w-72 rounded-[24px] bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in">

          {/* My account Row (Lime green highlight text) */}
          <div className="w-full flex items-center gap-4 px-6 py-5 border-b border-white/5 text-[#d4ff33]">
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-[13px] uppercase tracking-wider">
              My account
            </span>
          </div>

          {/* Favourites Row */}
          <button
            onClick={() => setShowOnlyFavs(!showOnlyFavs)}
            className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-white/5 text-zinc-200 transition-all text-left border-b border-white/5 ${showOnlyFavs ? 'bg-white/5 text-[#d4ff33]' : ''
              }`}
          >
            <Star className={`w-5 h-5 flex-shrink-0 ${showOnlyFavs ? 'fill-current text-[#d4ff33]' : ''}`} />
            <span className="font-semibold text-[13px] uppercase tracking-wider">Favourites</span>
          </button>

          {/* Disconnect Row */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-4 px-6 py-5 bg-[#5f663f]/30 hover:bg-[#5f663f]/50 transition-colors text-left text-zinc-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-[13px] uppercase tracking-wider">
              Disconnect
            </span>
          </button>

        </div>
      )}
    </div>
  );
}
