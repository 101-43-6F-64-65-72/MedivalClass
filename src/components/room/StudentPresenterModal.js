'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { MonitorPlay, ExternalLink, ScreenShare, Check, Sparkles, X, Gamepad2, Award } from 'lucide-react';
import { playChoiceClick, playCloseSound, playSuccessChime } from '@/lib/soundEffects';

export default function StudentPresenterModal({
  isOpen,
  onClose,
  designatedPresenter,
  onConfirmShowGame,
  onStartShareScreen,
  onRevokePresenter,
}) {
  if (!isOpen || !designatedPresenter) return null;

  const submission = designatedPresenter.submission;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl pixel-panel-wood text-amber-100 overflow-hidden shadow-2xl border-2 border-amber-500 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-[#2d1506] border-b-2 border-[#5a3012] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="font-black text-sm text-amber-200 uppercase tracking-wider">
                Akses Presentasi Kelas
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                Ditunjuk Resmi oleh Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            title="Tutup (Esc)"
            className="pixel-btn-gold p-1 text-amber-950 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="bg-[#1b0d05] border border-amber-600/70 rounded p-3 text-xs space-y-2">
            <p className="text-amber-200 leading-relaxed">
              Halo <strong>{designatedPresenter.studentName}</strong>! Admin telah menunjuk Anda untuk mempresentasikan hasil karya game kelompok di depan kelas.
            </p>
            <div className="text-[11px] text-amber-400/80">
              Syarat presentasi terpenuhi: Link tugas Anda telah terdaftar dan tervalidasi di Rak Buku Kelas.
            </div>
          </div>

          {/* Verified Submission Card */}
          {submission ? (
            <div className="pixel-box-inset p-3 rounded bg-[#160a03] border border-amber-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-amber-200">
                    Karya Terdaftar: {submission.room_name || 'Game Kelompok'}
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800 uppercase">
                  {submission.platform || 'Web Game'} • {submission.category || 'Game'}
                </span>
              </div>

              <div className="text-[11px] font-mono text-emerald-300 break-all bg-black/60 p-2 rounded border border-emerald-900/60 flex items-center justify-between gap-2">
                <span className="truncate">{submission.game_url}</span>
                <a
                  href={submission.game_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 hover:text-white shrink-0"
                  title="Uji coba buka link di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-950/80 border border-red-600/60 rounded text-red-200 text-xs">
              Peringatan: Belum ditemukan link game kelompok di rak buku.
            </div>
          )}

          {/* Action Options */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-amber-300">
              Pilih Opsi Tampilan di Papan Tulis Kelas:
            </div>

            {/* Option 1: Confirm and Show Game in Whiteboard */}
            <button
              onClick={() => {
                playChoiceClick();
                if (onConfirmShowGame && submission) {
                  onConfirmShowGame(submission);
                }
              }}
              disabled={!submission}
              className="w-full pixel-btn-gold p-3 flex items-center justify-between gap-3 text-amber-950 text-left disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <MonitorPlay className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-black text-xs uppercase">
                    1. Tampilkan Game Ini di Papan Tulis
                  </div>
                  <div className="text-[10px] opacity-80 font-medium">
                    Siswa lain akan langsung melihat tampilan interaktif game ini di layar depan.
                  </div>
                </div>
              </div>
              <Check className="w-4 h-4 shrink-0" />
            </button>

            {/* Option 2: Share Screen + Pin Game Link */}
            <button
              onClick={() => {
                playChoiceClick();
                if (onStartShareScreen) {
                  onStartShareScreen(submission);
                }
              }}
              className="w-full pixel-btn-wood p-3 flex items-center justify-between gap-3 text-amber-200 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform border border-amber-600/60"
            >
              <div className="flex items-center gap-3">
                <ScreenShare className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-black text-xs uppercase text-amber-200">
                    2. Bagikan Layar (Share Screen) &amp; Sematkan Link Game
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-medium">
                    Bagikan tampilan layarmu ke papan tulis, sambil tetap memajang banner link game agar siswa lain bisa ikut klik.
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#241004] border-t border-[#5a3012] flex items-center justify-between">
          <button
            onClick={() => {
              playCloseSound();
              if (onRevokePresenter) onRevokePresenter();
              onClose();
            }}
            className="text-[10px] text-red-400 hover:text-red-300 font-mono underline"
          >
            Lepas Hak Presenter
          </button>
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="pixel-btn-wood px-4 py-1.5 text-xs font-bold"
          >
            Tutup Nanti
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
