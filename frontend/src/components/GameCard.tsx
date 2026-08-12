'use client';

import React from 'react';
import Link from 'next/link';
import { GameDocument } from '@/types/game';
import { Trash2, Star, ArrowRight, Heart } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface GameCardProps {
  game: GameDocument;
  isAdmin?: boolean;
  onDeleteGame?: (id: string, title: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isAdmin, onDeleteGame, isFavorite, onToggleFavorite }) => {
  const { t } = useLanguage();
  const isPopup = game.display_mode === 'POPUP';

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteGame) {
      onDeleteGame(game.id, game.title);
    }
  };

  // Convert tags array to uppercase slash-separated string (e.g. CORE / ESSENTIAL)
  const tagsString = game.tags && game.tags.length > 0 
    ? game.tags.slice(0, 2).join(' / ').toUpperCase() 
    : 'GAME';

  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative flex flex-col rounded-[20px] bg-white/80 dark:bg-[#181818]/60 border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#f97316]/40 dark:hover:border-[#d4ff33]/40 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md shadow-lg dark:shadow-none"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-zinc-950">
        <img
          src={game.thumbnail_url}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        
        {/* Soft shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rating Badge - top-right pill */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-white border border-white/10">
          <Star className="w-3 h-3 fill-current text-yellow-400" />
          <span>{game.metrics.rating.toFixed(1)}</span>
        </div>

        {/* Favorite Button - top-left pill */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(game.id, e)}
            className={`absolute top-3.5 left-3.5 flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-300 z-20 ${
              isFavorite
                ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30 hover:scale-110'
                : 'bg-black/60 border-white/10 text-white/50 hover:bg-black/80 hover:text-white hover:border-white/30 hover:scale-110'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

      </div>

      {/* Content Info */}
      <div className="flex flex-col flex-1 p-6">
        
        {/* Title */}
        <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-[#f97316] dark:group-hover:text-[#d4ff33] line-clamp-1 transition-colors mb-2">
          {game.title}
        </h3>
        
        {/* Muted Description */}
        <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-6 flex-1">
          {game.description}
        </p>

        {/* Card Footer (Tag / Button row) */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 gap-4">
          
          {/* Categorization tag on the left */}
          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">
            {tagsString}
          </span>

          {/* Deploy/Play button on the right */}
          <span
            className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-[#f97316] dark:bg-[#d4ff33] text-white dark:text-black font-extrabold text-xs hover:bg-[#ea580c] dark:hover:bg-[#b5e620] transition-colors shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:shadow-[0_0_15px_rgba(212,255,51,0.15)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] dark:group-hover:shadow-[0_0_20px_rgba(212,255,51,0.3)] shrink-0"
          >
            <span>{t('play')}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
          </span>

        </div>

      </div>
    </Link>
  );
};
