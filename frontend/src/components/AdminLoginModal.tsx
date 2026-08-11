'use client';

import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertTriangle, Key } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hashOrPass: string) => void;
}

// SHA-256 Hash of "67morethen66"
export const ADMIN_PASS_HASH = 'b9982e40e58fffb52a1df3c6da5dc2f5c7c260c3881bd68f667a8e301c92a821';

export async function computeSha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const inputHash = await computeSha256(passwordInput.trim());

      if (inputHash === ADMIN_PASS_HASH) {
        sessionStorage.setItem('cs67_admin_auth', inputHash);
        onSuccess(inputHash);
        setPasswordInput('');
        onClose();
      } else {
        setError('รหัสผ่านแอดมินไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-black/10 shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-black/10 flex items-center justify-center text-slate-600">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-slate-900">เข้าสู่ระบบแอดมิน</h2>
              <p className="text-[11px] text-slate-500">กรอกรหัสผ่านเพื่อยืนยันสิทธิ์</p>
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
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-slate-50 border border-black/10 text-slate-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              รหัสผ่านแอดมิน (Admin Password):
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                autoFocus
                placeholder="กรอกรหัสผ่านแอดมิน..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              รหัสผ่านจะถูกเข้ารหัสด้วย SHA-256
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs border border-black/10"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs border border-black/10 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              <span>ยืนยันรหัสผ่าน (SHA-256)</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
