'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, UploadCloud, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { parseUrlOrEmbed } from '@/components/SubmitGameModal';
import { scrapeUrlPreview, submitGame } from '@/lib/api';
import { GameDocument } from '@/types/game';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export default function SubmitWizardPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState('');

  const genres = [
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedGenres.length === 0 || !description.trim()) {
      setError('Please fill out all fields and select at least one genre in Basic Info.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameUrl.trim() || !coverArtUrl.trim()) {
      setError('Please provide both the Cover Art URL and Game Embed URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const parsed = parseUrlOrEmbed(gameUrl);
      
      const payload = {
        url: parsed.url,
        embed_code: parsed.embedCode,
        custom_title: title,
        custom_description: description,
        custom_thumbnail_url: coverArtUrl,
        custom_tags: selectedGenres,
        creator_id: user?.displayName || 'Anonymous Developer',
      };

      await submitGame(payload);

      router.push('/');
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#181818] text-[#f3f4f6] min-h-screen">
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 lg:px-8 py-12 flex flex-col">
        
        {/* Top Header / Progress */}
        <div className="flex items-center justify-between pb-6 relative">
          <div className="flex items-center gap-4 relative z-10">
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">
              Upload
            </h1>
          </div>
          <div className="text-[#d4ff33] text-xs font-bold tracking-widest uppercase relative z-10">
            Step {step} of 2
          </div>

          {/* Progress Bar Line */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10">
            <div 
              className="h-full bg-[#d4ff33] transition-all duration-500 ease-in-out shadow-[0_0_10px_#d4ff33]"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 flex items-center justify-center py-12">
          
          <div className="w-full max-w-2xl bg-[#222222] rounded-2xl p-8 md:p-12 shadow-2xl border border-white/5 relative overflow-hidden">
            
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-[#d4ff33] tracking-wide">Basic Info</h2>
                  <p className="text-sm text-zinc-400">
                    Initialize your game's identity sequence. Provide the core parameters to register it within the network.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Game Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      Game Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cyber Protocol: Zero"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4ff33] transition-colors"
                      required
                    />
                  </div>

                  {/* Genres (Multi-select) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      Genres / Tags <span className="text-zinc-600">(Select multiple)</span> <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(g => {
                        const isSelected = selectedGenres.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGenres(prev => prev.filter(id => id !== g.id));
                              } else {
                                setSelectedGenres(prev => [...prev, g.id]);
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                              isSelected
                                ? 'bg-[#d4ff33] text-black border-[#d4ff33] shadow-[0_0_10px_rgba(212,255,51,0.2)]'
                                : 'bg-[#1a1a1a] text-zinc-400 border-white/5 hover:bg-[#2a2a2a] hover:text-white'
                            }`}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        Short Description <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-600 font-medium">MAX 250 CHARS</span>
                    </div>
                    <textarea
                      placeholder="Briefly describe the core gameplay loop and narrative hook..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={250}
                      rows={4}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-5 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4ff33] transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-full bg-[#d4ff33] text-black hover:bg-[#c2ef1d] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(212,255,51,0.2)] hover:shadow-[0_0_25px_rgba(212,255,51,0.4)] flex items-center gap-2"
                  >
                    Proceed to Assets &rarr;
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-wide">Upload Assets</h2>
                  <p className="text-sm text-zinc-400">
                    Provide the URLs for your game's visual identity and playable build.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Cover Art URL (Styled like a dropzone) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <ImageIcon className="w-2.5 h-2.5 text-[#d4ff33]" />
                      </div>
                      Cover Art URL <span className="text-red-400">*</span>
                    </label>
                    <div className="w-full border-2 border-dashed border-white/10 hover:border-[#d4ff33]/50 rounded-2xl p-8 transition-colors flex flex-col items-center justify-center text-center gap-4 bg-[#1a1a1a]/50 focus-within:border-[#d4ff33]">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-[#d4ff33]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Paste your cover art URL here</p>
                        <p className="text-xs text-zinc-500">Supports HTTPS links (JPG, PNG, WEBP)</p>
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={coverArtUrl}
                        onChange={(e) => setCoverArtUrl(e.target.value)}
                        className="w-full max-w-sm bg-[#222222] border border-white/10 rounded-full px-5 py-2.5 text-xs text-center text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4ff33] transition-colors mt-2"
                        required
                      />
                    </div>
                  </div>

                  {/* Game Build URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <Code className="w-2.5 h-2.5 text-[#d4ff33]" />
                      </div>
                      Game Build URL / Embed <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-3 w-full bg-[#1a1a1a] border border-white/10 focus-within:border-[#d4ff33] rounded-xl p-3 pl-4 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <LinkIcon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Paste game URL or <iframe> embed code"
                          value={gameUrl}
                          onChange={(e) => setGameUrl(e.target.value)}
                          className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 rounded-full text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-full bg-[#d4ff33] text-black hover:bg-[#c2ef1d] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(212,255,51,0.2)] hover:shadow-[0_0_25px_rgba(212,255,51,0.4)] flex items-center gap-2"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Game \u2192'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}

// Temporary icon imports to avoid missing components
const ImageIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const Code = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
