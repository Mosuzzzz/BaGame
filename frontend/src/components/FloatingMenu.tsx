'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';
import { User, Star, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function FloatingMenu() {
  const { user, isMenuOpen, showOnlyFavs, setShowOnlyFavs, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user || !isMenuOpen) return null;

  const handleFavToggle = () => {
    if (pathname !== '/') {
      setShowOnlyFavs(true);
      router.push('/');
    } else {
      setShowOnlyFavs(!showOnlyFavs);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-50 w-72 rounded-[24px] bg-white/90 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in transition-colors duration-300">
      {/* My account Row */}
      <div className="w-full flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/5 text-[#f97316] dark:text-[#d4ff33] transition-colors duration-300">
        <User className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold text-[13px] uppercase tracking-wider">
          My account
        </span>
      </div>

      {/* Favourites Row */}
      <button
        onClick={handleFavToggle}
        className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left border-b border-gray-100 dark:border-white/5 ${
          showOnlyFavs && pathname === '/' ? 'bg-gray-50 dark:bg-white/5 text-[#f97316] dark:text-[#d4ff33]' : 'text-gray-600 dark:text-zinc-200'
        }`}
      >
        <Star className={`w-5 h-5 flex-shrink-0 ${showOnlyFavs && pathname === '/' ? 'fill-current text-[#f97316] dark:text-[#d4ff33]' : ''}`} />
        <span className="font-semibold text-[13px] uppercase tracking-wider">Favourites</span>
      </button>

      {/* Disconnect Row */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center gap-4 px-6 py-5 bg-red-50 hover:bg-red-100 dark:bg-[#5f663f]/30 dark:hover:bg-[#5f663f]/50 transition-colors text-left text-red-600 dark:text-zinc-200"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold text-[13px] uppercase tracking-wider">
          Logout
        </span>
      </button>
    </div>
  );
}
