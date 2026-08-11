'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { Gamepad2, LogOut, PlusCircle, User as UserIcon, Globe } from 'lucide-react';

export function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/75 backdrop-blur-md border-b border-white/5 px-6 lg:px-8 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-logo text-3xl tracking-widest text-white font-bold">
            BA<span className="text-[#d4ff33]">GAME</span>
          </span>
        </Link>

        {/* User Account / Navigation Button on the right */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#d4ff33]/50 hover:bg-[#d4ff33]/10 text-zinc-300 hover:text-[#d4ff33] text-xs font-bold uppercase transition-all"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>

          {user ? (
            <div className="relative flex items-center gap-3">
              {/* Submit Game button */}
              <Link
                href="/submit"
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4ff33] text-[#d4ff33] hover:bg-[#d4ff33] hover:text-black font-semibold text-xs transition-all duration-300 shadow-[0_0_15px_rgba(212,255,51,0.1)] hover:shadow-[0_0_20px_rgba(212,255,51,0.3)]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('submit')}</span>
              </Link>

              {/* User Avatar Circle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 rounded-full overflow-hidden border transition-all duration-300 flex items-center justify-center bg-white/5 ${
                  isMenuOpen ? 'border-[#d4ff33]' : 'border-white/20 hover:border-[#d4ff33]'
                }`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                )}
              </button>

              {isMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-[#181818] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-50">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs text-white font-semibold truncate">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#181818] hover:bg-[#252525] border border-white/10 text-white font-semibold text-xs transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#d4ff33]" />
              <span>{t('login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
