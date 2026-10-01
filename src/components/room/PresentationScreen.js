'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePresentation } from '@/hooks/usePresentation';
import { Maximize2, Minimize2, ExternalLink, Sparkles, MonitorPlay } from 'lucide-react';

const CANVA_EMBED_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed';
const CANVA_DIRECT_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view';

export default function PresentationScreen({ object, localPlayer, onFocusChange }) {
  const containerRef = useRef(null);
  const { currentSlide, changeSlide } = usePresentation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Proximity check: Is local player near the front of the presentation screen?
  // Screen is at x: 550, width: 700 (center ~900), y: 25, height: 350
  const isNear = Boolean(
    localPlayer &&
    localPlayer.x >= object.x - 70 &&
    localPlayer.x <= object.x + object.width + 70 &&
    localPlayer.y >= object.y + 100 &&
    localPlayer.y <= object.y + object.height + 170
  );

  // Handle Fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      } else if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        } else {
          // Fallback to focused overlay if Fullscreen API is unavailable
          setIsFocused(true);
        }
      }
    } catch (err) {
      console.warn('Browser Fullscreen API request fallback:', err);
      // Fallback to high z-index modal
      setIsFocused((prev) => !prev);
    }
  };

  // Sync fullscreen change event from browser (e.g. user pressed ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsFocused(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Notify parent component if presentation is in focus or fullscreen mode
  useEffect(() => {
    const active = isFullscreen || isFocused;
    if (onFocusChange) {
      onFocusChange(active);
    }
  }, [isFullscreen, isFocused, onFocusChange]);

  // Handle 'E' or 'e' key for interaction when player is near the presentation screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not capture if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if ((e.key === 'e' || e.key === 'E') && isNear && !isFullscreen && !isFocused) {
        e.preventDefault();
        toggleFullscreen();
      }

      // Allow ESC to close focused mode fallback
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, isFullscreen, isFocused]);

  if (!object.visible) return null;

  const zIndex = Math.floor(object.y + object.height);
  const isPresentingActive = isFullscreen || isFocused;

  return (
    <>
      {/* ========================================================
          1. IN-ROOM PHYSICAL SMART WHITEBOARD PRESENTATION BOARD
         ======================================================== */}
      <div
        ref={containerRef}
        style={{
          position: isPresentingActive ? 'fixed' : 'absolute',
          left: isPresentingActive ? 0 : object.x,
          top: isPresentingActive ? 0 : object.y,
          width: isPresentingActive ? '100vw' : object.width,
          height: isPresentingActive ? '100vh' : object.height,
          zIndex: isPresentingActive ? 99999 : zIndex,
          backgroundColor: '#0f172a',
          boxShadow: isPresentingActive
            ? 'none'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 6px #5c3416, 0 0 0 10px #381c08, 0 0 0 12px #78421b',
          borderRadius: isPresentingActive ? '0px' : '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {/* Presentation Header Bar */}
        <div
          className={`w-full flex items-center justify-between px-3.5 py-2 select-none border-b ${
            isPresentingActive
              ? 'bg-slate-900 border-slate-700 py-3 px-6'
              : 'bg-[#381c08] border-[#5c3416]'
          }`}
        >
          {/* Left Title & Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-amber-100 tracking-wide flex items-center gap-1.5 truncate">
                <MonitorPlay className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Layar Presentasi Kelas</span>
                <span className="text-[9px] bg-amber-950 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-800">
                  Canva Live
                </span>
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Fallback Direct Link Button */}
            <a
              href={CANVA_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Presentasi di Tab Baru (Fallback)"
              className="flex items-center gap-1 bg-[#5c3416] hover:bg-[#78421b] text-amber-100 hover:text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[#8c5324] transition shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Buka Canva</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isPresentingActive ? 'Keluar Fullscreen (ESC)' : 'Layar Penuh (Fullscreen)'}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 text-[11px] font-bold px-3 py-1 rounded-lg shadow-md border border-amber-800 transition-all active:scale-95"
            >
              {isPresentingActive ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Tutup Layar Penuh (ESC)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Presentation Iframe Container */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          {!iframeError ? (
            <iframe
              src={CANVA_EMBED_URL}
              title="Canva Presentation Virtual Classroom"
              loading="lazy"
              allow="fullscreen"
              allowFullScreen
              className="w-full h-full border-0 select-none"
              onError={() => setIframeError(true)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#18181b',
              }}
            />
          ) : (
            /* Fallback Card if iframe blocked */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white space-y-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/40">
                📊
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Presentasi Canva Siap Ditampilkan</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Jika preview iframe dibatasi oleh browser Anda, Anda dapat membuka presentasi langsung di tab baru:
                </p>
              </div>
              <a
                href={CANVA_DIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>Buka Presentasi Canva</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Transparent click catcher when in normal room view to enable clean click-to-focus */}
          {!isPresentingActive && (
            <div
              onClick={toggleFullscreen}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-slate-950/10 transition-colors"
              title="Klik untuk membuka layar penuh (Fullscreen)"
            />
          )}
        </div>

        {/* Bottom Whiteboard Tray (Only in normal room view) */}
        {!isPresentingActive && (
          <div className="h-3.5 bg-slate-800 border-t border-slate-700 flex items-center justify-center px-4">
            <div className="w-24 h-1.5 bg-slate-600 rounded-full flex items-center justify-center gap-1 opacity-70">
              <div className="w-3 h-1 bg-red-400 rounded-full"></div>
              <div className="w-3 h-1 bg-blue-400 rounded-full"></div>
              <div className="w-3 h-1 bg-emerald-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          2. PROXIMITY INTERACTION HINT ("PRESS E TO VIEW")
         ======================================================== */}
      {isNear && !isPresentingActive && (
        <div
          className="absolute pointer-events-none select-none animate-bounce"
          style={{
            left: object.x + object.width / 2,
            top: object.y + object.height + 18,
            transform: 'translateX(-50%)',
            zIndex: zIndex + 20,
          }}
        >
          <div className="flex items-center gap-2 bg-slate-900/95 text-white px-3.5 py-1.5 rounded-full border border-emerald-500/80 shadow-2xl backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-100">
              Tekan <kbd className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-mono font-extrabold text-[10px] shadow">E</kbd> atau Klik untuk Layar Penuh
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>
      )}
    </>
  );
}
