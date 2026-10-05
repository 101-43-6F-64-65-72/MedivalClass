'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X, Sparkles, Megaphone, Check } from 'lucide-react';
import { playSuccessChime, playDialogueOpen, playCloseSound } from '@/lib/soundEffects';

export default function AnnouncementOverlay({ announcement, onDismiss }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!announcement) return;

    try {
      playSuccessChime();
    } catch (e) {}

    // Auto-dismiss if duration specified
    if (announcement.duration && announcement.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, announcement.duration);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      if (onDismiss) onDismiss();
    }, 250);
  };

  if (!mounted || !announcement) return null;

  const isBanner = announcement.type === 'banner';

  return createPortal(
    <>
      {/* ========================================================
          1. TOP CRAWLING MARQUEE BANNER (Melayang dari kanan ke kiri perlahan)
         ======================================================== */}
      {isBanner && (
        <div 
          className={`fixed top-0 left-0 right-0 z-[999999] bg-[#241004] text-amber-100 border-b-2 border-amber-600/90 pixel-shadow overflow-hidden select-none transition-all duration-200 font-pixel ${
            isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0 animate-in slide-in-from-top duration-300'
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2 gap-3 relative">
            {/* Left badge */}
            <div className="flex items-center gap-2 shrink-0 z-20 bg-[#140802] px-2.5 py-1 rounded border border-amber-600/80 shadow">
              <Megaphone className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-mono">
                Pengumuman Admin
              </span>
            </div>

            {/* Middle Scrolling Marquee Track (Smooth, slow crawl right-to-left) */}
            <div className="flex-1 overflow-hidden relative h-7 flex items-center">
              <div className="marquee-track whitespace-nowrap flex items-center gap-8 font-bold text-xs sm:text-sm text-amber-100">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{announcement.text}</span>
                </span>
                <span className="text-amber-500/60">•</span>
                <span className="text-amber-300/80 text-[11px] font-mono">
                  Disiarkan oleh: {announcement.senderName || 'Admin'}
                </span>
              </div>
            </div>

            {/* Right dismiss button */}
            <button
              onClick={() => {
                playCloseSound();
                handleDismiss();
              }}
              title="Tutup Pengumuman"
              className="pixel-btn-wood p-1 shrink-0 z-20"
            >
              <X className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          <style jsx>{`
            .marquee-track {
              display: inline-block;
              animation: marqueeSlow 20s linear infinite;
              will-change: transform;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
            @keyframes marqueeSlow {
              0% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
          `}</style>
        </div>
      )}

      {/* ========================================================
          2. CENTER POP-UP BOUNCE MODAL (Bounce di tengah layar)
         ======================================================== */}
      {!isBanner && (
        <div 
          className={`fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-3 sm:p-4 select-none transition-all duration-200 font-pixel ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-in fade-in duration-200'
          }`}
        >
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden pixel-panel-wood text-amber-100 pixel-shadow-lg border-2 border-amber-600 relative animate-popup-bounce">
            {/* Modal Header */}
            <div className="px-4 py-2.5 bg-[#2d1506] border-b-2 border-[#5a3012] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <h3 className="font-black text-sm text-amber-200 tracking-wide uppercase">
                    Pengumuman Admin
                  </h3>
                  <span className="text-[9px] text-amber-400/70 font-mono">
                    Disiarkan oleh: {announcement.senderName || 'Admin'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playCloseSound();
                  handleDismiss();
                }}
                title="Tutup Pengumuman"
                className="pixel-btn-gold p-1 text-amber-950 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col items-center text-center space-y-4 pixel-box-inset bg-[#140802]/60 m-2.5 rounded">
              {/* Announcement Message Content */}
              <div className="text-sm sm:text-base font-semibold text-amber-100 leading-relaxed px-2">
                "{announcement.text}"
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-[#241004] border-t border-[#5a3012] flex items-center justify-end">
              <button
                onClick={() => {
                  playCloseSound();
                  handleDismiss();
                }}
                className="pixel-btn-gold px-5 py-1.5 text-xs font-bold text-amber-950 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Saya Paham</span>
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes popupBounce {
              0% {
                opacity: 0;
                transform: scale(0.4) translateY(60px);
              }
              60% {
                opacity: 1;
                transform: scale(1.06) translateY(-8px);
              }
              80% {
                transform: scale(0.97) translateY(4px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-popup-bounce {
              animation: popupBounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
          `}</style>
        </div>
      )}
    </>,
    document.body
  );
}
