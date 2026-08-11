'use client';

import React, { useEffect, useState } from 'react';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/components/AuthContext';
import { deleteGameApi, getGames } from '@/lib/api';
import { GameDocument } from '@/types/game';
import { Gamepad2, Flame, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';
const LOCAL_STORAGE_FAVS_KEY = 'cs67_fav_games';

export default function GamesCatalogPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [games, setGames] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [favGameIds, setFavGameIds] = useState<string[]>([]);

  // 3D canvas effect removed to match minimal design

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

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavs = favGameIds.includes(id) 
      ? favGameIds.filter(f => f !== id) 
      : [...favGameIds, id];
    setFavGameIds(newFavs);
    localStorage.setItem(LOCAL_STORAGE_FAVS_KEY, JSON.stringify(newFavs));
  };

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

      setGames(combinedGames);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [activeTag, searchQuery]);

  const handleDeleteGame = async (id: string, title: string) => {
    const confirmDelete = confirm(`คุณต้องการลบผลงานเกม "${title}" ออกจากระบบ BaGame หรือไม่?`);
    if (!confirmDelete) return;

    setGames((prev) => prev.filter((g) => g.id !== id));

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
    <div className="flex-1 flex flex-col bg-[#181818] text-[#f3f4f6]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-16 space-y-12">
        
        {/* Centralized Search Bar */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center bg-[#222222] border border-white/5 rounded-full pl-6 pr-2 py-2 transition-all duration-300">
            <Search className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-zinc-500 focus:outline-none flex-1 text-sm w-full"
            />
            <button
              onClick={fetchGames}
              className="px-8 py-2.5 rounded-full bg-[#1a1a1a] border border-white/10 hover:bg-[#2a2a2a] text-zinc-300 text-xs font-semibold transition-all duration-300"
            >
              Search
            </button>
          </div>
        </div>

        {/* Gallery Container */}
        <div className="space-y-8">
          
          {/* Categories row */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTag(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTag === cat.id
                    ? 'bg-[#d4ff33] text-black'
                    : 'bg-[#222222] text-zinc-400 border border-transparent hover:bg-[#2a2a2a] hover:text-zinc-200'
                }`}
              >
                {cat.label === 'ทั้งหมด' ? 'ALL' : cat.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[16/11] rounded-xl bg-[#222222] animate-pulse"
                />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#222222] text-center space-y-4">
              <h3 className="font-semibold text-lg text-white">No games found</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
                {t('latestGamesDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
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
          )}

        </div>
      </main>
    </div>
  );
}
