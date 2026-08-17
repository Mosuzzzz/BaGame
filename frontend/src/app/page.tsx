'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { GameCard } from '@/components/GameCard';
import { SubmitGameModal } from '@/components/SubmitGameModal';
import { AdminLoginModal, ADMIN_PASS_HASH } from '@/components/AdminLoginModal';
import { deleteGameApi, getGames } from '@/lib/api';
import { GameDocument } from '@/types/game';
import { Gamepad2, Flame, ShieldCheck, RefreshCw, GraduationCap, Laptop, Code } from 'lucide-react';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export default function HomePage() {
  const [games, setGames] = useState<GameDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await getGames(activeTag, searchQuery);
      let combinedGames = [...res.games];

      // Restore user-submitted games from browser LocalStorage
      try {
        const storedLocal = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
        if (storedLocal) {
          const localGames: GameDocument[] = JSON.parse(storedLocal);
          for (const lg of localGames) {
            if (!combinedGames.some((g) => g.id === lg.id)) {
              combinedGames.unshift(lg);
            }
          }
        }
      } catch (e) {
        console.error('LocalStorage read error:', e);
      }

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
    const storedAuth = sessionStorage.getItem('cs67_admin_auth');
    if (storedAuth === ADMIN_PASS_HASH || storedAuth === '67morethen66') {
      setIsAdmin(true);
      setAdminPass(storedAuth);
    }
  }, [activeTag, searchQuery]);

  const handleAdminSuccess = (hashOrPass: string) => {
    setIsAdmin(true);
    setAdminPass(hashOrPass);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('cs67_admin_auth');
    setIsAdmin(false);
    setAdminPass('');
  };

  const handleGameSubmitted = () => {
    fetchGames();
  };

  const handleDeleteGame = async (id: string, title: string) => {
    const confirmDelete = confirm(`คุณต้องการลบผลงานเกม "${title}" ออกจากระบบ BaGame หรือไม่?`);
    if (!confirmDelete) return;

    // Optimistically remove from UI
    setGames((prev) => prev.filter((g) => g.id !== id));

    // Remove from LocalStorage
    try {
      const storedLocal = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
      if (storedLocal) {
        const localGames: GameDocument[] = JSON.parse(storedLocal);
        const updatedLocal = localGames.filter((g) => g.id !== id);
        localStorage.setItem(LOCAL_STORAGE_GAMES_KEY, JSON.stringify(updatedLocal));
      }
    } catch (e) {}

    // Call Delete API
    try {
      const passToSend = adminPass || sessionStorage.getItem('cs67_admin_auth') || ADMIN_PASS_HASH;
      await deleteGameApi(id, passToSend);
      alert(`ลบผลงานเกม "${title}" ออกจากระบบเรียบร้อยแล้ว`);
      fetchGames();
    } catch (err: unknown) {
      console.warn('API delete warning (removed locally):', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f4] text-slate-900">
      {/* Navigation Header */}
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Hero Banner Section */}
        <div className="relative rounded-3xl overflow-hidden p-8 md:p-10 bg-white border border-black/10">

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-black/10 text-slate-600 text-xs font-medium uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-slate-500" />
              Computer Science CS 67
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight text-slate-900">
              BaGame
              <span className="block text-xl md:text-2xl text-slate-600 mt-2 font-normal">
                คลังผลงานเกมของชาว CS 67
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              รวมเกมที่ส่งโดยนิสิตและชุมชนไว้ในที่เดียว ดูตัวอย่าง เปิดรายละเอียด และส่งผลงานใหม่ได้จากที่นี่
            </p>

            {/* Feature badging */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#091129] border border-sky-500/30 shadow-md">
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>ผลงานนิสิต วิทยาการคอมพิวเตอร์ CS 67</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#091129] border border-sky-500/30 shadow-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>เล่นเกมในระบบ Sandboxed Frame 16:9</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#091129] border border-sky-500/30 shadow-md">
                <Code className="w-4 h-4 text-blue-400" />
                <span>รองรับ WebGL, Canvas & HTML5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-slate-500 fill-slate-500" />
            <h2 className="font-semibold text-xl text-slate-900 tracking-tight">
              {activeTag ? `หมวดหมู่: ${activeTag.toUpperCase()}` : 'ผลงานเกม'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-slate-600 font-medium border border-black/10">
              {games.length} {games.length === 1 ? 'เกม' : 'เกม'}
            </span>
          </div>

          <button
            onClick={fetchGames}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-black/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Game Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[16/12] rounded-2xl bg-slate-200 border border-black/5 animate-pulse"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-black/10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 border border-black/10 flex items-center justify-center text-slate-500">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">ไม่พบผลงานเกมที่ค้นหา</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              ยังไม่มีเกมในหมวดหมู่นี้ ร่วมเป็นคนแรกที่ส่งผลงานเกมเข้าสู่ระบบ BaGame!
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-medium"
            >
              ส่งผลงานเกม CS 67
            </button>
          </div>
        ) : (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isAdmin={isAdmin}
                onDeleteGame={handleDeleteGame}
              />
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-black/10 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BaGame. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>สาขาวิทยาการคอมพิวเตอร์ รุ่น 67</span>
            <span>•</span>
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Sandboxed Runtime</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubmitGameModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={handleGameSubmitted}
      />

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
