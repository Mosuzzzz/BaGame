'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameDocument } from '@/types/game';
import { useLanguage } from '@/components/LanguageContext';
import {
  ShieldCheck,
  Maximize2,
  RotateCw,
  ExternalLink,
  Lock,
  Play,
  MonitorPlay,
} from 'lucide-react';

interface EmbedPlayerProps {
  game: GameDocument;
}

export function extractEmbedUrl(game: GameDocument): string {
  // 1. If embed_code contains <iframe src="...">, extract the src URL
  if (game.embed_code) {
    const srcMatch = game.embed_code.match(/src=["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      return srcMatch[1];
    }
    if (game.embed_code.startsWith('http://') || game.embed_code.startsWith('https://')) {
      return game.embed_code;
    }
  }

  // 2. Original URL fallback
  const orig = game.original_url || (game as any).url || '';
  return orig;
}

export const EmbedPlayer: React.FC<EmbedPlayerProps> = ({ game }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [forceEmbedded, setForceEmbedded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const targetUrl = extractEmbedUrl(game).trim();
  const externalLinkUrl = game.original_url || (game as any).url || targetUrl;
  const iframeUrl = targetUrl || externalLinkUrl;
  const isPopupMode = game.display_mode === 'POPUP' && !forceEmbedded;

  // Auto hide loading spinner after 2s timeout
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [iframeKey, forceEmbedded, game, targetUrl]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleOpenExternal = () => {
    if (externalLinkUrl) {
      window.open(externalLinkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!iframeUrl.trim()) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-50 dark:bg-zinc-900 text-gray-500 rounded-2xl border border-gray-200 dark:border-white/10">
        <MonitorPlay className="w-12 h-12 mb-2 opacity-50 block mx-auto" />
        <p className="mt-2 text-sm">ไม่พบ URL สำหรับเล่นเกมนี้ (No playable URL found)</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Minimal Toolbar */}
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={handleToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
          title={t('fullscreenMode')}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{t('fullscreen')}</span>
        </button>

        <button
          onClick={handleOpenExternal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
          title={t('openGameNewTab')}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t('openLink')}</span>
        </button>
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 transition-colors"
      >
        {isPopupMode ? (
          /* POPUP MODE UI fallback */
          <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
              ตรวจพบการตั้งค่าป้องกันการฝังเฟรมจากเว็บต้นทาง
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mt-2 leading-relaxed">
              เว็บต้นทางไม่อนุญาตให้ฝังตรงๆ คุณยังเปิดในแท็บใหม่หรือกดใช้โหมดฝังได้
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setForceEmbedded(true);
                  setIsLoading(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black font-medium text-sm transition-all duration-200 cursor-pointer border border-transparent"
              >
                <MonitorPlay className="w-5 h-5" />
                <span>Embed</span>
              </button>

              <button
                onClick={handleOpenExternal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 font-medium text-sm border border-gray-200 dark:border-white/10 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open tab</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* EMBEDDED MODE SANDBOXED IFRAME */
          <div className="ratio-16-9 bg-gray-100 dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {isLoading && iframeUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-black/90 backdrop-blur-sm transition-colors">
                <div className="w-10 h-10 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={iframeUrl}
              title={game.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-modals"
              allow="autoplay; gamepad; fullscreen"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>


    </div>
  );
};
