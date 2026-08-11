'use client';

import React, { useState } from 'react';
import { scrapeUrlPreview, submitGame } from '@/lib/api';
import { GameDocument, ScrapedMetadata } from '@/types/game';
import {
  X,
  Link as LinkIcon,
  Search,
  ShieldCheck,
  AlertTriangle,
  Tag,
  CheckCircle2,
  GraduationCap,
  User,
  Image as ImageIcon,
  Code,
} from 'lucide-react';

interface SubmitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LOCAL_STORAGE_GAMES_KEY = 'cs67_user_submitted_games';

export function parseUrlOrEmbed(input: string): { url: string; embedCode?: string } {
  const trimmed = input.trim();
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      return {
        url: srcMatch[1],
        embedCode: trimmed,
      };
    }
  }
  if (trimmed.startsWith('http') && trimmed.includes('embed-upload')) {
    return {
      url: trimmed,
      embedCode: `<iframe src="${trimmed}"></iframe>`,
    };
  }
  return { url: trimmed };
}

export const SubmitGameModal: React.FC<SubmitGameModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedMetadata | null>(null);
  const [detectedEmbedCode, setDetectedEmbedCode] = useState<string | undefined>(undefined);

  // Editable Form Fields
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleInspectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    try {
      setIsScraping(true);
      setError(null);

      const parsed = parseUrlOrEmbed(urlInput);
      setDetectedEmbedCode(parsed.embedCode);

      const res = await scrapeUrlPreview(parsed.url);
      setScrapedData(res);
      setCustomTitle(res.title);
      setCustomDescription(res.description);
      setCustomThumbnail(res.thumbnail_url);
      setTagsInput(['cs67', ...res.tags].join(', '));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลพรีวิวจาก URL นี้ได้';
      setError(msg);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async () => {
    if (!urlInput || !scrapedData) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const parsed = parseUrlOrEmbed(urlInput);
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const finalEmbedCode = parsed.embedCode || detectedEmbedCode;

      const res = await submitGame({
        url: parsed.url,
        embed_code: finalEmbedCode,
        custom_title: customTitle,
        custom_description: customDescription,
        custom_thumbnail_url: customThumbnail.trim() || scrapedData.thumbnail_url,
        custom_tags: parsedTags,
        creator_id: creatorName.trim() || 'นิสิต CS 67',
      });

      // Save into LocalStorage persistence
      try {
        const existing = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
        const localList: GameDocument[] = existing ? JSON.parse(existing) : [];
        const newGameToStore: GameDocument = {
          ...res.game,
          embed_code: finalEmbedCode || res.game.embed_code,
        };
        if (!localList.some((g) => g.id === newGameToStore.id)) {
          localList.unshift(newGameToStore);
          localStorage.setItem(LOCAL_STORAGE_GAMES_KEY, JSON.stringify(localList));
        }
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }

      onSuccess();
      onClose();
      // Reset Form
      setUrlInput('');
      setCreatorName('');
      setCustomThumbnail('');
      setScrapedData(null);
      setDetectedEmbedCode(undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกผลงานเกม';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-black/10 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-black/10 flex items-center justify-center text-slate-600">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-slate-900">ส่งผลงานเกม</h2>
              <p className="text-[11px] text-slate-500">วาง URL เกม หรือ HTML embed</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {error && (
            <div className="p-3 rounded-xl bg-slate-50 border border-black/10 text-slate-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleInspectUrl} className="space-y-3">
            
            {/* Input: Creator Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ชื่อผู้สร้างสรรค์ผลงาน / ผู้พัฒนา (Creator / Developer Name):
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นายวิทยา คอมพิวเตอร์ (CS67) หรือ ชื่อทีมผู้พัฒนา"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Input: Game URL or Embed Code */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-slate-500" />
                URL หรือ โค้ด HTML Embed (`&lt;iframe src="..."&gt;`):
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-sky-400" />
                  <textarea
                    rows={3}
                    required
                    placeholder="วางลิงก์ https://... หรือ วางโค้ด <iframe src=&quot;https://itch.io/embed-upload/...&quot;></iframe> จาก itch.io ที่นี่"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isScraping || !urlInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 border border-black/10"
                  >
                    {isScraping ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>ตรวจวิเคราะห์</span>
                  </button>
                </div>
              </div>
            </div>

          </form>

          {/* Scraped Metadata Preview Card */}
          {scrapedData && (
            <div className="space-y-4 pt-4 border-t border-black/10">
              
              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-black/10 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Embed status:</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-600 font-medium border border-black/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  READY_FOR_IN_WEBSITE_PLAY
                </span>
              </div>

              {detectedEmbedCode && (
                <div className="p-3 rounded-xl bg-slate-50 border border-black/10 text-slate-600 text-xs font-mono">
                  ตรวจพบ HTML embed
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    ชื่อผลงานเกม (Game Title):
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    คำอธิบายผลงาน:
                  </label>
                  <textarea
                    rows={3}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* Editable Thumbnail URL Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-slate-500" />
                    URL รูปปกเกม (Game Cover / Thumbnail Image URL):
                  </label>
                  <input
                    type="url"
                    placeholder="ใส่ URL รูปปกเกม (https://...)"
                    value={customThumbnail}
                    onChange={(e) => setCustomThumbnail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    แท็กหมวดหมู่ (คั่นด้วยจุลภาค):
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="cs67, webgl, arcade, puzzle"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* Thumbnail Live Preview */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    ตัวอย่างรูปปกเกมที่เลือก (Live Preview):
                  </label>
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 border border-black/10">
                    <img
                      src={customThumbnail || scrapedData.thumbnail_url}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/10 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs border border-black/10"
          >
            ยกเลิก
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!scrapedData || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-medium text-xs border border-black/10"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>เผยแพร่</span>
          </button>
        </div>

      </div>
    </div>
  );
};
