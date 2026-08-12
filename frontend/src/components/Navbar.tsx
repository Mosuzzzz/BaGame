'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import { Gamepad2, LogOut, PlusCircle, User as UserIcon, Globe, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const { user, isMenuOpen, setIsMenuOpen, signInWithGoogle, signOut } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/75 dark:bg-[#050505]/75 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 lg:px-8 py-5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-logo text-3xl tracking-widest text-black dark:text-white font-bold transition-colors">
            BA<span className="text-[#f97316] dark:text-[#d4ff33] drop-shadow-md">GAME</span>
          </span>
        </Link>

        {/* User Account / Navigation Button on the right */}
        <div className="flex items-center gap-4">
          
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-full border border-gray-300 dark:border-white/10 hover:border-[#f97316]/50 dark:hover:border-[#d4ff33]/50 hover:bg-[#f97316]/10 dark:hover:bg-[#d4ff33]/10 text-gray-500 dark:text-zinc-300 hover:text-[#f97316] dark:hover:text-[#d4ff33] transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-white/10 hover:border-[#f97316]/50 dark:hover:border-[#d4ff33]/50 hover:bg-[#f97316]/10 dark:hover:bg-[#d4ff33]/10 text-gray-500 dark:text-zinc-300 hover:text-[#f97316] dark:hover:text-[#d4ff33] text-xs font-bold uppercase transition-all"
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
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full border border-[#f97316] dark:border-[#d4ff33] text-[#f97316] dark:text-[#d4ff33] hover:bg-[#f97316] dark:hover:bg-[#d4ff33] hover:text-white dark:hover:text-black font-semibold text-xs transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.1)] dark:shadow-[0_0_15px_rgba(212,255,51,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] dark:hover:shadow-[0_0_20px_rgba(212,255,51,0.3)]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('submit')}</span>
              </Link>

              {/* User Avatar Circle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 rounded-full overflow-hidden border transition-all duration-300 flex items-center justify-center bg-gray-100 dark:bg-white/5 ${
                  isMenuOpen ? 'border-[#f97316] dark:border-[#d4ff33]' : 'border-gray-200 dark:border-white/20 hover:border-[#f97316] dark:hover:border-[#d4ff33]'
                }`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                )}
              </button>

            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#252525] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold text-xs transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#f97316] dark:text-[#d4ff33]" />
              <span>{t('login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
