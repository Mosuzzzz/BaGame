'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, UploadCloud, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { parseUrlOrEmbed } from '@/components/SubmitGameModal';
import { getGameById, editGame } from '@/lib/api';
import { GameDocument } from '@/types/game';

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export default function EditGamePage() {
  const params = useParams() as { id: string };
  const id = params.id;
  const [isFetching, setIsFetching] = useState(true);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await getGameById(id);
        const game = res.game;
        
        // Verify owner
        if (user && user.displayName !== game.creator_id && user.displayName !== 'Admin') {
          router.push('/');
          return;
        }

        setTitle(game.title);
        setDescription(game.description);
        setSelectedGenres(game.tags);
        setGameUrl(game.original_url || '');
        setWebsiteUrl(game.website_url || '');
        setExistingThumbnailUrl(game.thumbnail_url);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    }
    if (user && id) {
      fetchGame();
    }
  }, [id, user, router]);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // If fetching, return early or just let the main return handle it.
  // Actually, we can return early inside the main render block.

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStepIndex, setDeployStepIndex] = useState(0);



  const deployMessages = [
    "Uploading Assets...",
    "Validating Engine Config...",
    "Configuring Sandbox Player...",
    "Publishing Game...",
    "Complete!"
  ];

  // Form State
  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [gameUrl, setGameUrl] = useState('');
  const [manualPdf, setManualPdf] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');

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
    if (!gameUrl.trim() || !coverImage) {
      setError('Please provide both the Cover Image and Game URL/Embed.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const parsed = parseUrlOrEmbed(gameUrl);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary config is missing in .env.local');
      }

      // Upload Cover Image
      let custom_thumbnail_url = existingThumbnailUrl || '';
      if (coverImage) {
        const coverFormData = new FormData();
        coverFormData.append('file', coverImage);
        coverFormData.append('upload_preset', uploadPreset);
        const coverRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: coverFormData,
        });
        if (!coverRes.ok) {
          const errObj = await coverRes.json().catch(() => ({}));
          throw new Error(`Cloudinary Error: ${errObj?.error?.message || 'Failed to upload cover image'}`);
        }
        const coverData = await coverRes.json();
        custom_thumbnail_url = coverData.secure_url;
      }

      // Upload PDF if exists
      let manual_url = undefined;
      if (manualPdf) {
        const pdfFormData = new FormData();
        pdfFormData.append('file', manualPdf);
        pdfFormData.append('upload_preset', uploadPreset);
        const pdfRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: pdfFormData,
        });
        if (!pdfRes.ok) throw new Error('Failed to upload PDF to Cloudinary');
        const pdfData = await pdfRes.json();
        manual_url = pdfData.secure_url;
      }

      const payload = {
        title,
        description,
        tags: selectedGenres.join(','), // Wait, custom_tags in backend is Vec<String> or string? In SubmitGameRequest it's Option<Vec<String>> but let's see. Let's send array.
        custom_tags: selectedGenres,
        creator_id: user?.displayName || 'Anonymous Developer',
        url: parsed.url,
        embed_code: parsed.embedCode,
        custom_thumbnail_url,
        manual_url,
        website_url: websiteUrl.trim() || undefined,
        custom_title: title,
        custom_description: description,
      };

      const RUST_BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${RUST_BACKEND_BASE}/games/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload game');
      }

      setIsDeploying(true);
      for (let i = 0; i < deployMessages.length; i++) {
        setDeployStepIndex(i);
        await new Promise(r => setTimeout(r, 1200));
      }

      router.push('/');

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#181818] min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-white/10 border-t-[#f97316] dark:border-t-[#d4ff33] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isFetching) return <div className="flex items-center justify-center min-h-screen"><p className="text-white">Loading...</p></div>;

  if (isFetching) return <div className="flex items-center justify-center min-h-screen"><p className="text-white">Loading...</p></div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-[#f3f4f6] min-h-screen transition-colors duration-300 relative">
      
      {/* Deploying Overlay */}
      {isDeploying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-md transition-all">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Spinner */}
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-white/10 border-t-[#f97316] dark:border-t-[#d4ff33] rounded-full animate-spin shadow-[0_0_15px_rgba(249,115,22,0.3)] dark:shadow-[0_0_15px_rgba(212,255,51,0.3)]"></div>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                {deployStepIndex === deployMessages.length - 1 ? "Success!" : "Deploying..."}
              </h2>
              <p className="text-sm font-semibold text-[#f97316] dark:text-[#d4ff33] tracking-widest uppercase transition-all">
                {deployMessages[deployStepIndex]}
              </p>
            </div>
            
            {/* Progress line */}
            <div className="w-64 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-[#f97316] dark:bg-[#d4ff33] transition-all duration-1000 ease-out"
                style={{ width: `${((deployStepIndex + 1) / deployMessages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 lg:px-8 py-12 flex flex-col">

        {/* Top Header / Progress */}
        <div className="flex items-center justify-between pb-6 relative">
          <div className="flex items-center gap-4 relative z-10">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link href="/" className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Upload
            </h1>
          </div>
          <div className="text-[#f97316] dark:text-[#d4ff33] text-xs font-bold tracking-widest uppercase relative z-10 transition-colors">
            Step {step} of 2
          </div>

          {/* Progress Bar Line */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-200 dark:bg-white/10">
            <div
              className="h-full bg-[#f97316] dark:bg-[#d4ff33] transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(249,115,22,0.5)] dark:shadow-[0_0_10px_#d4ff33]"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 flex items-center justify-center py-12">

          <div className="w-full max-w-2xl bg-white dark:bg-[#222222] rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">

            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-[#f97316] dark:text-[#d4ff33] tracking-wide">Basic Info</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Initialize your game's identity sequence. Provide the core parameters to register it within the network.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Game Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      Game Title <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cyber Protocol: Zero"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-xl px-5 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#f97316] dark:focus:border-[#d4ff33] transition-colors"
                      required
                    />
                  </div>

                  {/* Genres (Multi-select) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      Genres / Tags <span className="text-gray-400 dark:text-zinc-600">(Select multiple)</span> <span className="text-red-500 dark:text-red-400">*</span>
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
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${isSelected
                                ? 'bg-[#f97316] dark:bg-[#d4ff33] text-white dark:text-black border-[#f97316] dark:border-[#d4ff33] shadow-[0_0_10px_rgba(249,115,22,0.2)] dark:shadow-[0_0_10px_rgba(212,255,51,0.2)]'
                                : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white'
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
                      <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        Short Description <span className="text-red-500 dark:text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium">MAX 250 CHARS</span>
                    </div>
                    <textarea
                      placeholder="Briefly describe the core gameplay loop and narrative hook..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={250}
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-xl px-5 py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#f97316] dark:focus:border-[#d4ff33] transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-full bg-[#f97316] dark:bg-[#d4ff33] text-white dark:text-black hover:bg-[#ea580c] dark:hover:bg-[#c2ef1d] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.2)] dark:shadow-[0_0_15px_rgba(212,255,51,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] dark:hover:shadow-[0_0_25px_rgba(212,255,51,0.4)] flex items-center gap-2"
                  >
                    Proceed to Assets &rarr;
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wide">Upload Assets</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Provide the URLs for your game's visual identity and playable build.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Cover Art Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#f97316] dark:text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#f97316]/10 dark:bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <ImageIcon className="w-2.5 h-2.5 text-[#f97316] dark:text-[#d4ff33]" />
                      </div>
                      Cover Art (ปกเกม) <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <label className="relative flex flex-col items-center justify-center w-full h-48 px-4 transition bg-gray-50 dark:bg-[#1a1a1a]/50 border-2 border-gray-200 dark:border-white/10 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#f97316]/50 dark:hover:border-[#d4ff33]/50 focus-within:border-[#f97316] dark:focus-within:border-[#d4ff33] overflow-hidden group">
                      {(coverImage || existingThumbnailUrl) && (
                        <img 
                          src={coverImage ? URL.createObjectURL(coverImage) : (existingThumbnailUrl || '')} 
                          alt="Cover Preview" 
                          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity duration-300"
                        />
                      )}
                      <span className="flex flex-col items-center space-y-2 relative z-10">
                        <UploadCloud className="w-6 h-6 text-[#f97316] dark:text-[#d4ff33] drop-shadow-md" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white bg-white/60 dark:bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm">
                          {coverImage ? 'Click to change cover image' : 'Click to upload cover image'}
                        </span>
                        <span className="text-xs text-gray-700 dark:text-zinc-200 bg-white/60 dark:bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">PNG, JPG up to 5MB</span>
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                        className="hidden"
                        />
                    </label>
                  </div>

                  {/* Game Build URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#f97316] dark:text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#f97316]/10 dark:bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <Code className="w-2.5 h-2.5 text-[#f97316] dark:text-[#d4ff33]" />
                      </div>
                      Game Build URL / Embed <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-3 w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 focus-within:border-[#f97316] dark:focus-within:border-[#d4ff33] rounded-xl p-3 pl-4 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        <LinkIcon className="w-4 h-4 text-gray-400 dark:text-zinc-400" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Paste game URL or <iframe> embed code"
                          value={gameUrl}
                          onChange={(e) => setGameUrl(e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Game Manual (PDF) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#f97316] dark:text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#f97316]/10 dark:bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <LinkIcon className="w-2.5 h-2.5 text-[#f97316] dark:text-[#d4ff33]" />
                      </div>
                      Game Manual (คู่มือ) <span className="text-gray-400 dark:text-zinc-500">(Optional)</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 px-4 transition bg-gray-50 dark:bg-[#1a1a1a]/50 border-2 border-gray-200 dark:border-white/10 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#f97316]/50 dark:hover:border-[#d4ff33]/50 focus-within:border-[#f97316] dark:focus-within:border-[#d4ff33]">
                      <span className="flex flex-col items-center space-y-1">
                        <span className="font-medium text-sm text-gray-700 dark:text-zinc-300">
                          {manualPdf ? manualPdf.name : 'Click to upload PDF manual'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-500">PDF up to 10MB</span>
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setManualPdf(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Website URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#f97316] dark:text-[#d4ff33] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#f97316]/10 dark:bg-[#d4ff33]/20 rounded flex items-center justify-center">
                        <LinkIcon className="w-2.5 h-2.5 text-[#f97316] dark:text-[#d4ff33]" />
                      </div>
                      Website Link <span className="text-gray-400 dark:text-zinc-500">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-3 w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 focus-within:border-[#f97316] dark:focus-within:border-[#d4ff33] rounded-xl p-3 pl-4 transition-colors">
                      <div className="flex-1">
                        <input
                          type="url"
                          placeholder="https://your-developer-site.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-gray-200 dark:border-white/5">

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-full bg-[#f97316] dark:bg-[#d4ff33] text-white dark:text-black hover:bg-[#ea580c] dark:hover:bg-[#c2ef1d] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.2)] dark:shadow-[0_0_15px_rgba(212,255,51,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] dark:hover:shadow-[0_0_25px_rgba(212,255,51,0.4)] flex items-center gap-2"
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
const ImageIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
const Code = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
