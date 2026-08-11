'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, PlusCircle, Search, Sparkles, GraduationCap, ShieldCheck, LogOut, Lock } from 'lucide-react';

interface HeaderProps {
  onOpenSubmitModal: () => void;
  onOpenAdminModal: () => void;
  isAdmin: boolean;
  onAdminLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTag: string;
  setActiveTag: (tag: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSubmitModal,
  onOpenAdminModal,
  isAdmin,
  onAdminLogout,
  searchQuery,
  setSearchQuery,
  activeTag,
  setActiveTag,
}) => {
  const categories = [
    { id: '', label: 'ทั้งหมด' },
    { id: 'cs67', label: 'CS67' },
    { id: 'webgl', label: 'WebGL' },
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'arcade', label: 'Arcade' },
    { id: 'action', label: 'Action' },
    { id: 'itch-io', label: 'Itch.io' },
    { id: 'html5', label: 'HTML5' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-4 lg:px-8 py-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo: BaGame with pixel/techno styling */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:border-[#d4ff33]/40 transition-all duration-300">
              <Gamepad2 className="w-6 h-6 text-[#d4ff33] drop-shadow-[0_0_8px_rgba(212,255,51,0.5)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xl tracking-wider text-white group-hover:text-zinc-200 transition-colors">
                  BA<span className="text-[#d4ff33] drop-shadow-[0_0_10px_rgba(212,255,51,0.4)]">GAME</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#d4ff33]/10 text-[#d4ff33] font-medium border border-[#d4ff33]/20 uppercase tracking-wider">
                  <GraduationCap className="w-3 h-3 text-[#d4ff33]" />
                  CS 67
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-0.5 font-medium tracking-wide">
                คลังผลงานเกม วิทยาการคอมพิวเตอร์ รุ่น 67
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            {isAdmin ? (
              <button
                onClick={onAdminLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 text-red-400 font-medium text-xs border border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-xs border border-white/10"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenSubmitModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#d4ff33] text-[#d4ff33] font-medium text-xs active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ส่งเกม</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="ค้นหาผลงานเกม CS67, ชื่อโปรเจกต์ หรือหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4ff33] focus:ring-1 focus:ring-[#d4ff33]/30 transition-all duration-300"
          />
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#d4ff33]/5 border border-[#d4ff33]/20 text-[#d4ff33] text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-[#d4ff33]" />
              <span>Admin Mode</span>
              <button
                onClick={onAdminLogout}
                className="ml-1 p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                title="ออกจากระบบแอดมิน"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-xs border border-white/10 transition-all duration-300"
              title="เข้าสู่ระบบแอดมิน"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>แอดมิน</span>
            </button>
          )}

          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d4ff33] text-[#d4ff33] hover:bg-[#d4ff33] hover:text-black font-semibold text-xs transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(212,255,51,0.1)] hover:shadow-[0_0_20px_rgba(212,255,51,0.35)]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ส่งผลงานเกม</span>
          </button>
        </div>

      </div>

      {/* Category Pills Bar */}
      <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTag(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
              activeTag === cat.id
                ? 'bg-[#d4ff33] text-black border-[#d4ff33] shadow-[0_0_10px_rgba(212,255,51,0.25)]'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </header>
  );
};
