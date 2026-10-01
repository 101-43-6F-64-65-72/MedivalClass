'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePresentation } from '@/hooks/usePresentation';
import { Maximize2, Minimize2, ExternalLink, Sparkles, MonitorPlay, X, RotateCw, ZoomIn } from 'lucide-react';

const CANVA_EMBED_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed';
const CANVA_DIRECT_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view';

export default function PresentationScreen({ 
  object, 
  localPlayer, 
  onFocusChange,
  isFocused: externalIsFocused,
  setIsFocused: externalSetIsFocused,
}) {
  const containerRef = useRef(null);
  const { currentSlide, changeSlide } = usePresentation();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalIsFocused, setInternalIsFocused] = useState(false);
  
  const isFocused = externalIsFocused !== undefined ? externalIsFocused : internalIsFocused;
  const setIsFocused = externalSetIsFocused || setInternalIsFocused;

  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proximity check: Is local player near the front of the presentation screen?
  // Screen is at x: 550, width: 700 (center ~900), y: 25, height: 350
  const isNear = Boolean(
    localPlayer &&
    localPlayer.x >= object.x - 70 &&
    localPlayer.x <= object.x + object.width + 70 &&
    localPlayer.y >= object.y + 100 &&
    localPlayer.y <= object.y + object.height + 170
  );

  // Notify parent if focus or fullscreen is active to pause background movement
  useEffect(() => {
    const active = isFullscreen || isFocused;
    if (onFocusChange) {
      onFocusChange(active);
    }
  }, [isFullscreen, isFocused, onFocusChange]);

  // Handle OS Fullscreen API
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
        } else {
          setIsFocused(true);
        }
      }
    } catch (err) {
      console.warn('Browser Fullscreen API fallback to Focus Mode:', err);
      setIsFocused(true);
    }
  };

  // Sync fullscreen change event from browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Keyboard interaction: Only 'Escape' to close focus mode (no E key conflict)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if (e.key === 'Escape' && isFocused) {
        e.preventDefault();
        setIsFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, setIsFocused]);

  if (!object.visible) return null;

  const zIndex = Math.floor(object.y + object.height);

  return (
    <>
      {/* ========================================================
          1. IN-ROOM PHYSICAL WHITEBOARD SCREEN (Always rendered in 2D Classroom)
         ======================================================== */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: object.x,
          top: object.y,
          width: object.width,
          height: object.height,
          zIndex: zIndex,
          backgroundColor: '#0f172a',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 6px #5c3416, 0 0 0 10px #381c08, 0 0 0 12px #78421b',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Presentation Header Bar */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 select-none bg-[#381c08] border-b border-[#5c3416]">
          {/* Left Title & Status */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <MonitorPlay className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-amber-100 truncate">
                Layar Kelas
              </span>
              <span className="text-[8px] bg-amber-950 text-amber-300 font-mono px-1 py-0.2 rounded border border-amber-800">
                Canva Live
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Easy Focus / Theater Mode Button */}
            <button
              onClick={() => setIsFocused(true)}
              title="Perbesar Layar / Mode Fokus (Kontrol Mudah)"
              className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold"
            >
              <ZoomIn className="w-3 h-3 mr-1" />
              <span>Mode Fokus</span>
            </button>

            {/* Direct Link External Button */}
            <a
              href={CANVA_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Presentasi di Tab Baru"
              className="pixel-btn-wood p-1"
            >
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>

            {/* Native OS Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Layar Penuh"
              className="pixel-btn-wood p-1"
            >
              <Maximize2 className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </div>

        {/* Live Canva Iframe inside Classroom */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          {!iframeError ? (
            <iframe
              key={`in-room-${iframeKey}`}
              src={CANVA_EMBED_URL}
              title="Canva Presentation In-Room"
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
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white space-y-2">
              <MonitorPlay className="w-6 h-6 text-amber-300" />
              <p className="text-xs text-slate-300">Presentasi Canva Siap Ditampilkan</p>
              <a
                href={CANVA_DIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn-gold py-1.5 px-3 font-bold text-[10px] flex items-center gap-1.5"
              >
                <span>Buka Tab Baru</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Bottom Whiteboard Marker Tray with Interactive Click Button */}
        <div className="h-7 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-3 select-none">
          <div className="w-20 h-1 bg-slate-600 rounded-full flex items-center justify-center gap-1 opacity-70">
            <div className="w-2.5 h-1 bg-red-400 rounded-full"></div>
            <div className="w-2.5 h-1 bg-blue-400 rounded-full"></div>
            <div className="w-2.5 h-1 bg-emerald-400 rounded-full"></div>
          </div>
          <button
            onClick={() => setIsFocused(true)}
            className="pixel-btn-gold text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-transform"
            title="Klik untuk membuka layar presentasi (Mode Fokus)"
          >
            <ZoomIn className="w-3 h-3" />
            <span>Buka Presentasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          3. THEATER / FOCUS MODE PORTAL (Directly on document.body)
             Allows super easy slide control without forced OS fullscreen!
         ======================================================== */}
      {mounted && isFocused && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150 select-none">
          {/* Modal Container */}
          <div className="w-full max-w-6xl h-[90vh] pixel-panel-wood flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-2 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <MonitorPlay className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-amber-200">Layar Presentasi Canva (Mode Fokus)</span>
                <span className="text-[10px] font-mono pixel-btn-gold text-amber-950 px-2 py-0.5 pointer-events-none">
                  Kontrol Penuh Aktif
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Reload iframe */}
                <button
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  title="Muat Ulang Presentasi"
                  className="pixel-btn-wood p-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                </button>

                {/* Open in new tab */}
                <a
                  href={CANVA_DIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka di Tab Baru"
                  className="pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1"
                >
                  <span>Buka Canva</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  title="Layar Penuh Monitor"
                  className="pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3 text-amber-300" />
                  <span>Layar Penuh</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsFocused(false)}
                  title="Tutup Mode Fokus (Esc)"
                  className="pixel-btn-gold text-xs px-3 py-1 font-bold flex items-center gap-1 ml-1"
                >
                  <img 
                    src="/assets/fantasy_pixelart_ui/icons/gold_cross.png" 
                    alt="Close" 
                    className="w-3.5 h-3.5 image-rendering-pixelated" 
                  />
                  <span>Tutup (Esc)</span>
                </button>
              </div>
            </div>

            {/* Canva Interactive Iframe Body */}
            <div className="relative flex-1 w-full bg-slate-950 overflow-hidden pixel-box-inset">
              <iframe
                key={`theater-${iframeKey}`}
                src={CANVA_EMBED_URL}
                title="Canva Presentation Interactive Theater"
                loading="eager"
                allow="fullscreen; autoplay"
                allowFullScreen
                className="w-full h-full border-0"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#0f172a',
                }}
              />
            </div>

            {/* Modal Footer Controls Hint */}
            <div className="px-4 py-1.5 bg-[#1a0a03] border-t border-[#5c3416] flex items-center justify-between text-xs text-amber-300/70">
              <span>Petunjuk: Klik langsung pada slide atau gunakan tombol navigasi di dalam Canva untuk berpindah halaman.</span>
              <span className="font-mono text-[10px] text-amber-400/60">Tekan Esc atau klik Tutup untuk kembali ke kelas</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
