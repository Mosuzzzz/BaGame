'use client';

import React from 'react';
import Link from 'next/link';
import { GameDocument } from '@/types/game';
import { Play, Eye, ThumbsUp, Star, ExternalLink, ShieldCheck, User, Trash2 } from 'lucide-react';

interface GameCardProps {
  game: GameDocument;
  isAdmin?: boolean;
  onDeleteGame?: (id: string, title: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isAdmin, onDeleteGame }) => {
  const isPopup = game.display_mode === 'POPUP';

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteGame) {
      onDeleteGame(game.id, game.title);
    }
  };

  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative flex flex-col rounded-2xl bg-white border border-black/10 overflow-hidden hover:border-black/20 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={game.thumbnail_url}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-80 transition-opacity" />

        {/* Display Mode Badge & Admin Delete Button */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
          <div className="flex items-center gap-1">
            {isPopup ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-medium text-slate-700 border border-black/10">
                <ExternalLink className="w-3 h-3" />
                External
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-medium text-slate-700 border border-black/10">
                <ShieldCheck className="w-3 h-3" />
                Embedded
              </span>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-black text-white font-medium text-[10px] border border-black/10 transition-all hover:scale-105 active:scale-95"
              title="ลบผลงานเกมนี้ออกจากระบบ"
            >
              <Trash2 className="w-3 h-3" />
              <span>ลบเกม</span>
            </button>
          )}
        </div>

        {/* Play Icon Overlay */}
        {/* Rating pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-medium text-slate-700 border border-black/10">
          <Star className="w-3 h-3 fill-current text-slate-500" />
          <span>{game.metrics.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Content Info */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-base text-slate-900 group-hover:text-slate-700 line-clamp-1 transition-colors">
          {game.title}
        </h3>
        
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex-1 leading-relaxed">
          {game.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {game.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-black/10"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/10 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 hover:text-slate-700 transition-colors">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {game.metrics.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 hover:text-slate-700 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
              {game.metrics.likes.toLocaleString()}
            </span>
          </div>

          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium tracking-wide truncate max-w-[120px]">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{game.creator_id}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};
