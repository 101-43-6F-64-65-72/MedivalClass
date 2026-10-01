'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Link2, 
  Layers, 
  Gamepad2, 
  Building2, 
  UserCheck 
} from 'lucide-react';
import { classifyGameUrl } from '@/lib/gameClassifier';
import { submitGameLink } from '@/lib/gameSubmissionsService';
import { playSuccessChime, playCloseSound, playChoiceClick } from '@/lib/soundEffects';

export default function GameSubmissionModal({
  isOpen,
  onClose,
  studentInfo = {},
  onSubmitted,
}) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const classification = classifyGameUrl(url);
  const isValidUrl = url.trim().length > 7 && (url.startsWith('http://') || url.startsWith('https://'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUrl) {
      setError('Masukkan tautan URL game yang valid (dimulai dengan https:// atau http://)!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await submitGameLink({
        gameUrl: url.trim(),
        studentName: studentInfo.fullName || studentInfo.username || 'Anonim',
        attendanceNo: studentInfo.attendanceNo || '',
        studentClass: studentInfo.studentClass || 'XI PPLG-B',
        roomCode: studentInfo.roomCode || '',
        roomName: studentInfo.roomName || 'Kelompok Belajar',
      });

      playSuccessChime();
      setSuccess(true);
      if (onSubmitted) {
        onSubmitted(result);
      }
      setTimeout(() => {
        setSuccess(false);
        setUrl('');
        onClose();
      }, 1500);
    } catch (err) {
      setError('Terjadi kendala saat menyimpan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    playCloseSound();
    setUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg pixel-panel-wood p-5 sm:p-6 relative text-amber-100 shadow-2xl border-2 border-amber-600/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Sam portrait */}
        <div className="flex items-center justify-between border-b border-[#5c3416] pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#1c0c04] border border-amber-600/60 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/assets/OwnAssets/Sam/potraitsam.png"
                alt="Sam"
                className="w-full h-full object-contain image-pixelated"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-200 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>Setor Link Hasil Karya Game</span>
              </h2>
              <p className="text-[10px] text-amber-400/80">
                Arsip Rak Buku Kelas XI terhubung dengan NPC Sam
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="pixel-btn-gold p-1 text-amber-950 font-bold"
            title="Tutup Form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-4 bg-emerald-950/90 border border-emerald-500 rounded text-center space-y-2 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-sm font-bold text-emerald-200">Karya Game Berhasil Disimpan!</h3>
            <p className="text-[11px] text-emerald-300/80">
              Karya timmu telah tertata rapi di Rak Buku {studentInfo.studentClass || 'XI PPLG-B'}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auto Instruction Callout */}
            <div className="pixel-box-inset p-2.5 bg-[#140802] border border-[#5c3416] text-[11px] text-amber-200/90 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Cukup masukkan link game kelompokmu (Vercel, Scratch, Itch.io, Roblox, GitHub, dsb). Sistem akan mengkategorikannya secara otomatis.
              </span>
            </div>

            {/* URL Input Only */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Link Hasil Game:</span>
                </span>
                <span className="text-[10px] text-amber-400/70 font-mono">
                  Wajib dimulai https://
                </span>
              </label>

              <div className="relative">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="https://proyek-game-kamu.vercel.app atau scratch/itch.io"
                  className="w-full bg-[#120702] border-2 border-[#5c3416] focus:border-amber-400 rounded p-2.5 text-xs font-mono text-amber-100 placeholder-amber-800 focus:outline-none"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-[11px] text-red-400 font-bold">{error}</p>
              )}
            </div>

            {/* Live Auto-Categorization & Identity Card */}
            <div className="pixel-box-inset p-3 bg-[#1a0c04] border border-[#5c3416] space-y-2.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400/80 flex items-center justify-between">
                <span>Deteksi Kategori &amp; Identitas Otomatis:</span>
                <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Otomatis</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Platform */}
                <div className="bg-[#120702] p-2 rounded border border-[#3d1e0a]">
                  <div className="text-[9px] text-amber-400/70">Platform Terdeteksi:</div>
                  <div className="font-bold text-amber-200 truncate mt-0.5">
                    {classification.platform}
                  </div>
                </div>

                {/* Category Badge */}
                <div className="bg-[#120702] p-2 rounded border border-[#3d1e0a]">
                  <div className="text-[9px] text-amber-400/70">Kategori Game:</div>
                  <div className="mt-0.5">
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${classification.badgeClass}`}>
                      {classification.category}
                    </span>
                  </div>
                </div>

                {/* Target Bookshelf */}
                <div className="bg-[#120702] p-2 rounded border border-[#3d1e0a]">
                  <div className="text-[9px] text-amber-400/70">Rak Buku Tujuan:</div>
                  <div className="font-bold text-amber-300 font-mono text-xs mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>Rak Buku {studentInfo.studentClass || 'XI PPLG-B'}</span>
                  </div>
                </div>

                {/* Submitter */}
                <div className="bg-[#120702] p-2 rounded border border-[#3d1e0a]">
                  <div className="text-[9px] text-amber-400/70">Pengirim:</div>
                  <div className="font-bold text-amber-200 text-xs truncate mt-0.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span>{studentInfo.fullName || studentInfo.username || 'Siswa'}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-amber-400/70 pt-1 border-t border-[#3d1e0a] flex items-center justify-between">
                <span>Kelompok: <strong>{studentInfo.roomName || 'Kelompok Belajar'}</strong></span>
                {studentInfo.attendanceNo && (
                  <span>Absen #{studentInfo.attendanceNo}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="pixel-btn-wood px-4 py-2 text-xs font-bold text-amber-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValidUrl}
                className="pixel-btn-gold px-5 py-2 text-xs font-black text-amber-950 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Rak Buku'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
