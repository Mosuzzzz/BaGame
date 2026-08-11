'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameDocument } from '@/types/game';
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

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs">
        <div className="flex items-center gap-2">
          {isPopupMode ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium border border-black/10">
              <Lock className="w-3.5 h-3.5" />
              External mode
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium border border-black/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              Embedded
            </span>
          )}
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 hidden sm:inline font-mono text-[11px] truncate max-w-xs">
            {targetUrl}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPopupMode && (
            <button
              onClick={() => {
                setForceEmbedded(true);
                setIsLoading(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-medium transition-all border border-black/10"
              title="สลับเป็นโหมดเล่นในเว็บ"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Embed</span>
            </button>
          )}

          {!isPopupMode && (
            <>
              <button
                onClick={handleReload}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-black/10"
                title="Reload Game Frame"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-all border border-black/10"
                title="Fullscreen Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </>
          )}

          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg white hover:bg-slate-50 text-slate-700 transition-colors border border-black/10 font-medium"
            title="Open Game in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open link</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-white border border-black/10"
      >
        {isPopupMode ? (
          /* POPUP MODE UI fallback */
          <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-800">
            <div className="w-16 h-16 rounded-full bg-white border border-black/10 flex items-center justify-center text-slate-500 mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-semibold tracking-tight">
              ตรวจพบการตั้งค่าป้องกันการฝังเฟรมจากเว็บต้นทาง
            </h3>
            <p className="text-sm text-slate-500 max-w-lg mt-2 leading-relaxed">
              เว็บต้นทางไม่อนุญาตให้ฝังตรงๆ คุณยังเปิดในแท็บใหม่หรือกดใช้โหมดฝังได้
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setForceEmbedded(true);
                  setIsLoading(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-sm transition-all duration-200 cursor-pointer border border-black/10"
              >
                <MonitorPlay className="w-5 h-5" />
                <span>Embed</span>
              </button>

              <button
                onClick={handleOpenExternal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-black/10"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open tab</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* EMBEDDED MODE SANDBOXED IFRAME */
          <div className="ratio-16-9">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
                <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-slate-500">Loading...</p>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={iframeUrl}
              title={game.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-modals"
              allow="autoplay; gamepad; fullscreen"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>

      {/* Security sandbox declaration notice */}
      {!isPopupMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-2">
          <span>
            Sandbox: <code className="text-slate-700">allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock</code>
          </span>
          <span>
            Feature policy: <code className="text-slate-700">allow="autoplay; gamepad; fullscreen"</code>
          </span>
        </div>
      )}
    </div>
  );
};
