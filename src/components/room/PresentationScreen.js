'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePresentation, formatWhiteboardUrl, DEFAULT_WHITEBOARD_URL } from '@/hooks/usePresentation';
import { 
  Maximize2, 
  ExternalLink, 
  MonitorPlay, 
  RotateCw, 
  ZoomIn, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Radio, 
  Copy, 
  Check, 
  Share2, 
  Layers, 
  Sparkles,
  Edit2,
  Lock,
  Unlock,
  X
} from 'lucide-react';

const WHITEBOARD_PRESETS = [
  {
    name: 'Canva Pembelajaran',
    url: 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed',
    desc: 'Slide materi pembelajaran interaktif',
  },
  {
    name: 'Excalidraw Whiteboard',
    url: 'https://excalidraw.com',
    desc: 'Papan tulis virtual corat-coret & diagram',
  },
  {
    name: 'Witeboard Online',
    url: 'https://witeboard.com',
    desc: 'Papan tulis kolaboratif instan',
  },
];

function getDirectCanvaUrl(embedUrl) {
  if (!embedUrl) return 'https://www.canva.com';
  return embedUrl.replace(/\?embed.*$/, '').replace(/&embed.*$/, '');
}

function PresentationScreen({ 
  object, 
  onFocusChange,
  isFocused: externalIsFocused,
  setIsFocused: externalSetIsFocused,
  isAdmin = false,
  presenterName = 'Guru',
  presentation: externalPresentation,
}) {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalIsFocused, setInternalIsFocused] = useState(false);
  
  const isFocused = externalIsFocused !== undefined ? externalIsFocused : internalIsFocused;
  const setIsFocused = externalSetIsFocused || setInternalIsFocused;

  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Settings modal state for Admin
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editLiveCodeInput, setEditLiveCodeInput] = useState('');
  const [copiedLiveCode, setCopiedLiveCode] = useState(false);

  const inRoomVideoRef = useRef(null);
  const theaterVideoRef = useRef(null);

  // Supabase Realtime Presentation & Screen Share hook
  const fallbackPresentation = usePresentation({ 
    isAdmin, 
    presenterName, 
    enabled: !externalPresentation 
  });
  const presentation = externalPresentation || fallbackPresentation;

  const {
    currentSlide,
    totalSlides,
    presentationUrl,
    canvaLiveCode,
    syncedBy,
    lastNotification,
    clearNotification,
    changeSlide,
    nextSlide,
    prevSlide,
    changePresentationUrl,
    changeCanvaLiveCode,
    // WebRTC Screen Share
    isScreenSharing,
    screenStream,
    screenPresenterName,
    screenShareError,
    startScreenShare,
    stopScreenShare,
    // Forced Fullscreen
    isForcedFullscreen,
    toggleForceFullscreen,
    // Designated Student Presenter & Pinned Game Submission
    designatedPresenter,
    activeGameSubmission,
    setGameSubmission,
  } = presentation;

  // Auto-focus whiteboard screen if teacher activates forced fullscreen
  useEffect(() => {
    if (isForcedFullscreen) {
      setIsFocused(true);
    }
  }, [isForcedFullscreen, setIsFocused]);

  // Attach screen stream to active video element only (avoids dual GPU decoding)
  useEffect(() => {
    if (!screenStream) {
      if (inRoomVideoRef.current) inRoomVideoRef.current.srcObject = null;
      if (theaterVideoRef.current) theaterVideoRef.current.srcObject = null;
      return;
    }

    if (isFocused) {
      // Free GPU decoding resources by detaching hidden in-room canvas video
      if (inRoomVideoRef.current) inRoomVideoRef.current.srcObject = null;
      if (theaterVideoRef.current) {
        theaterVideoRef.current.srcObject = screenStream;
      }
    } else {
      if (theaterVideoRef.current) theaterVideoRef.current.srcObject = null;
      if (inRoomVideoRef.current) {
        inRoomVideoRef.current.srcObject = screenStream;
      }
    }
  }, [screenStream, isFocused]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When settings modal opens, preload current values
  useEffect(() => {
    if (isSettingsOpen) {
      setEditUrlInput(presentationUrl);
      setEditLiveCodeInput(canvaLiveCode || '');
    }
  }, [isSettingsOpen, presentationUrl, canvaLiveCode]);

  // Auto-clear notification after 4 seconds
  useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, clearNotification]);

  // Notify parent if focus or fullscreen is active to pause player movement
  useEffect(() => {
    const active = isFullscreen || isFocused || isSettingsOpen;
    if (onFocusChange) {
      onFocusChange(active);
    }
  }, [isFullscreen, isFocused, isSettingsOpen, onFocusChange]);

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

  // Keyboard navigation when in focus mode: ArrowLeft/ArrowRight for slides, Escape for close
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          e.preventDefault();
        } else if (isFocused) {
          if (isForcedFullscreen && !isAdmin) {
            e.preventDefault();
            return;
          }
          setIsFocused(false);
          e.preventDefault();
        }
      } else if (isAdmin && isFocused) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          nextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          prevSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isSettingsOpen, isAdmin, isForcedFullscreen, nextSlide, prevSlide, setIsFocused]);

  const handleCopyCode = useCallback(() => {
    if (!canvaLiveCode) return;
    navigator.clipboard.writeText(canvaLiveCode).then(() => {
      setCopiedLiveCode(true);
      setTimeout(() => setCopiedLiveCode(false), 2000);
    });
  }, [canvaLiveCode]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (editUrlInput.trim()) {
      changePresentationUrl(formatWhiteboardUrl(editUrlInput.trim()));
    }
    changeCanvaLiveCode(editLiveCodeInput.trim());
    setIsSettingsOpen(false);
  };

  if (!object.visible) return null;

  const zIndex = Math.floor(object.y + object.height);
  const activeEmbedUrl = formatWhiteboardUrl(presentationUrl);
  const directCanvaUrl = getDirectCanvaUrl(activeEmbedUrl);

  return (
    <>
      {/* ========================================================
          1. IN-ROOM PHYSICAL WHITEBOARD SCREEN (2D Classroom World)
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
                Slide {currentSlide}
              </span>
              {canvaLiveCode && (
                <span className="text-[8px] bg-emerald-950 text-emerald-300 font-mono px-1 py-0.2 rounded border border-emerald-700 animate-pulse">
                  Live: {canvaLiveCode}
                </span>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Admin Whiteboard Settings & Quick Slide Controls */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                {/* Admin Force Fullscreen Toggle */}
                <button
                  onClick={() => toggleForceFullscreen(!isForcedFullscreen)}
                  className={isForcedFullscreen 
                    ? "pixel-btn-silver text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-red-400 border border-red-500 animate-pulse" 
                    : "pixel-btn-wood text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-amber-200"
                  }
                  title={isForcedFullscreen ? "Lepas Kunci Layar Penuh Siswa" : "Kunci Layar Penuh untuk Seluruh Siswa"}
                >
                  {isForcedFullscreen ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-amber-300" />}
                  <span>{isForcedFullscreen ? 'Kunci: ON' : 'Paksa Layar'}</span>
                </button>

                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={isScreenSharing 
                    ? "pixel-btn-silver text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-red-400 animate-pulse" 
                    : "pixel-btn-gold text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-amber-950 shadow-sm"
                  }
                  title={isScreenSharing ? "Hentikan Bagikan Layar" : "Bagikan Layar Anda ke Papan Tulis"}
                >
                  <MonitorPlay className="w-3 h-3" />
                  <span>{isScreenSharing ? 'Stop Share' : 'Share Layar'}</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Atur Link Tampilan Papan Tulis (Canva, Google Slides, Whiteboard, Video)"
                  className="pixel-btn-gold text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-amber-950 shadow-sm"
                >
                  <Settings className="w-3 h-3" />
                  <span>Atur Papan Tulis</span>
                </button>
                <div className="flex items-center gap-0.5 bg-[#241105] p-0.5 rounded border border-[#5c3416]">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide <= 1}
                    title="Slide Sebelumnya"
                    className="p-1 text-amber-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[9px] font-mono text-amber-200 px-1 font-bold">
                    {currentSlide}
                  </span>
                  <button
                    onClick={nextSlide}
                    title="Slide Berikutnya"
                    className="p-1 text-amber-300 hover:text-white"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Focus / Theater Mode Button */}
            <button
              onClick={() => setIsFocused(true)}
              title="Perbesar Layar / Mode Fokus"
              className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold"
            >
              <ZoomIn className="w-3 h-3 mr-1" />
              <span>Mode Fokus</span>
            </button>

            {/* Direct Link External Button */}
            <a
              href={directCanvaUrl}
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

        {/* Live Presentation / Screen Share Body inside Classroom */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          {screenStream ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={inRoomVideoRef}
                autoPlay
                playsInline
                muted={isScreenSharing}
                className="w-full h-full object-contain pointer-events-none"
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  contain: 'strict',
                }}
              />
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur px-2 py-0.5 rounded text-[9px] text-amber-200 border border-amber-600/40 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-bold">Layar Langsung: {screenPresenterName || 'Pengajar'}</span>
              </div>
            </div>
          ) : !iframeError ? (
            <iframe
              key={`in-room-${iframeKey}-${activeEmbedUrl}`}
              src={activeEmbedUrl}
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
                href={directCanvaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn-gold py-1.5 px-3 font-bold text-[10px] flex items-center gap-1.5"
              >
                <span>Buka Tab Baru</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Floating In-Room Live Sync Toast Banner */}
          {lastNotification && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/80 backdrop-blur border border-amber-500/50 rounded text-[10px] text-amber-200 shadow-lg pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="font-semibold">{lastNotification}</span>
            </div>
          )}
        </div>

        {/* Bottom Whiteboard Marker Tray */}
        <div className="h-7 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-3 select-none">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-slate-600 rounded-full flex items-center justify-center gap-1 opacity-70">
              <div className="w-2 h-1 bg-red-400 rounded-full"></div>
              <div className="w-2 h-1 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-1 bg-emerald-400 rounded-full"></div>
            </div>
            {syncedBy && (
              <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                Disinkronkan oleh: {syncedBy}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`pixel-btn-wood text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer ${
                    isScreenSharing ? 'text-red-400' : 'text-amber-300'
                  } hover:text-white shadow-sm`}
                  title={isScreenSharing ? "Hentikan Bagikan Layar" : "Bagikan Layar Anda ke Papan Tulis"}
                >
                  <MonitorPlay className="w-2.5 h-2.5 text-amber-400" />
                  <span>{isScreenSharing ? 'Stop Share' : 'Bagikan Layar'}</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="pixel-btn-wood text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer text-amber-300 hover:text-white shadow-sm"
                  title="Isi link yang akan ditampilkan di papan tulis"
                >
                  <Edit2 className="w-2.5 h-2.5 text-amber-400" />
                  <span>Atur Link Papan Tulis</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsFocused(true)}
              className="pixel-btn-gold text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-transform"
              title="Klik untuk membuka layar presentasi (Mode Fokus)"
            >
              <ZoomIn className="w-3 h-3" />
              <span>Buka Layar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. THEATER / FOCUS MODE PORTAL (Directly on document.body)
         ======================================================== */}
      {mounted && isFocused && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-150">
          {/* Modal Container */}
          <div className="w-full max-w-6xl h-[92vh] pixel-panel-wood flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-2 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between text-white flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <MonitorPlay className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-amber-200">Layar Presentasi Canva</span>
                
                {/* Real-time Slide Status Badge */}
                <div className="flex items-center gap-1 bg-[#1a0c04] px-2 py-0.5 rounded border border-[#5c3416]">
                  <span className="text-[10px] text-amber-400/80 font-mono">Slide:</span>
                  <span className="text-xs font-bold font-mono text-amber-200">{currentSlide}</span>
                  {syncedBy && (
                    <span className="text-[9px] text-amber-400/60 ml-1 border-l border-amber-900/60 pl-1.5">
                      Presenter: {syncedBy}
                    </span>
                  )}
                </div>

                {/* Canva Live Code Badge if active */}
                {canvaLiveCode && (
                  <button
                    onClick={handleCopyCode}
                    title="Klik untuk menyalin kode Canva Live"
                    className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/70 hover:bg-emerald-900 px-2 py-0.5 rounded text-emerald-300 text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Live: <strong>{canvaLiveCode}</strong></span>
                    {copiedLiveCode ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-emerald-400/70" />
                    )}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Admin Screen Share Button */}
                {isAdmin && (
                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={isScreenSharing 
                      ? "pixel-btn-silver text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold text-red-400 animate-pulse" 
                      : "pixel-btn-gold text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold text-amber-950 shadow-sm"
                    }
                    title={isScreenSharing ? "Hentikan Bagikan Layar" : "Bagikan Layar Anda ke Papan Tulis"}
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    <span>{isScreenSharing ? 'Stop Share' : 'Bagikan Layar'}</span>
                  </button>
                )}

                {/* Admin Settings Button */}
                {isAdmin && (
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title="Pengaturan Link Canva & Canva Live"
                    className="pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-300" />
                    <span>Atur Papan Tulis</span>
                  </button>
                )}

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
                  href={directCanvaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka di Tab Baru"
                  className="pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1"
                >
                  <span>Buka Tab</span>
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

                {/* Admin Force Fullscreen Toggle */}
                {isAdmin && (
                  <button
                    onClick={() => toggleForceFullscreen(!isForcedFullscreen)}
                    className={isForcedFullscreen 
                      ? "pixel-btn-silver text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold text-red-400 border border-red-500 animate-pulse" 
                      : "pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold text-amber-200"
                    }
                    title={isForcedFullscreen ? "Lepas Kunci Layar Penuh Siswa" : "Kunci Layar Penuh untuk Seluruh Siswa"}
                  >
                    {isForcedFullscreen ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{isForcedFullscreen ? 'Kunci Layar: ON' : 'Paksa Layar Siswa'}</span>
                  </button>
                )}

                {/* Close Button / Forced Lock Status */}
                {isForcedFullscreen && !isAdmin ? (
                  <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-700/80 px-2.5 py-1 rounded text-red-300 text-xs font-bold pointer-events-none select-none">
                    <Lock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span>Layar Penuh Dikunci oleh Pengajar</span>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            {/* Pinned Game Submission Banner (Always visible during Presentation and Screen Share) */}
            {activeGameSubmission && (
              <div className="w-full bg-[#241004] border-b-2 border-amber-600/70 px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs select-text shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="pixel-btn-gold text-[9px] px-2 py-0.5 font-mono font-bold uppercase tracking-wider text-amber-950 shrink-0">
                    {activeGameSubmission.platform || 'Game'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-100 truncate text-sm">
                        {activeGameSubmission.title || activeGameSubmission.game_url || 'Karya Game Siswa'}
                      </span>
                      {activeGameSubmission.student_name && (
                        <span className="text-[10px] text-amber-300/80 font-mono">
                          Presenter: <strong>{activeGameSubmission.student_name}</strong>
                          {activeGameSubmission.attendance_no ? ` (#${activeGameSubmission.attendance_no})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-mono truncate max-w-lg">
                      {activeGameSubmission.game_url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={activeGameSubmission.game_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-btn-gold text-xs px-3 py-1 font-bold flex items-center gap-1.5 text-amber-950 shadow hover:scale-105 transition-transform"
                    title="Buka Game Ini di Tab Baru"
                  >
                    <span>Buka Link Game</span>
                    <ExternalLink className="w-3 h-3 text-amber-950" />
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => setGameSubmission(null)}
                      className="pixel-btn-wood text-[10px] px-2 py-1 text-amber-400 hover:text-white"
                      title="Lepas Sematan Link Game Ini"
                    >
                      Lepas Link
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Realtime Notification Banner */}
            {lastNotification && (
              <div className="bg-amber-950/90 border-b border-amber-600/50 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{lastNotification}</span>
                </div>
                <button 
                  onClick={clearNotification}
                  className="text-amber-400/70 hover:text-amber-200 text-[10px] font-mono"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Presentation / Screen Share Interactive Body */}
            <div className="relative flex-1 w-full bg-slate-950 overflow-hidden pixel-box-inset">
              {screenStream ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={theaterVideoRef}
                    autoPlay
                    playsInline
                    muted={isScreenSharing}
                    className="w-full h-full object-contain"
                    style={{
                      transform: 'translateZ(0)',
                      willChange: 'transform',
                      contain: 'strict',
                    }}
                  />
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/85 backdrop-blur px-3 py-1 rounded-md text-xs text-amber-200 border border-amber-600/50 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-bold">Siaran Layar Langsung: {screenPresenterName || 'Pengajar'}</span>
                  </div>
                </div>
              ) : (
                <iframe
                  key={`theater-${iframeKey}-${activeEmbedUrl}`}
                  src={activeEmbedUrl}
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
              )}

              {/* Floating Presenter Slide Navigator Overlay (For Admin) */}
              {isAdmin && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#2d1607]/95 border-2 border-[#5c3416] p-1.5 rounded-lg shadow-2xl backdrop-blur-sm select-none">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide <= 1}
                    className="pixel-btn-wood px-2.5 py-1 text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Slide Sebelumnya (ArrowLeft)"
                  >
                    <ChevronLeft className="w-4 h-4 text-amber-300" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1 px-3 py-1 bg-[#1a0c04] rounded border border-[#4a2608]">
                    <span className="text-xs text-amber-400 font-mono font-bold">Slide</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={currentSlide}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          changeSlide(val);
                        }
                      }}
                      className="w-12 bg-slate-900 border border-amber-900/80 rounded px-1.5 py-0.5 text-center text-xs font-mono text-amber-200 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={nextSlide}
                    className="pixel-btn-wood px-2.5 py-1 text-xs font-bold flex items-center gap-1"
                    title="Slide Berikutnya (ArrowRight)"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
                  </button>

                  <div className="w-[1px] h-5 bg-[#5c3416] mx-1"></div>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="pixel-btn-gold px-2.5 py-1 text-xs font-bold flex items-center gap-1"
                    title="Ubah URL Canva atau Atur Kode Live"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Atur Canva</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Controls Hint */}
            <div className="px-4 py-1.5 bg-[#1a0a03] border-t border-[#5c3416] flex items-center justify-between text-xs text-amber-300/70 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>Petunjuk: Klik langsung pada slide atau gunakan navigasi Canva untuk berpindah halaman.</span>
                {isAdmin && (
                  <span className="text-amber-400 font-semibold">[Admin: Gunakan tombol Prev / Next untuk sinkronisasi seluruh siswa]</span>
                )}
              </div>
              <span className="font-mono text-[10px] text-amber-400/60">Tekan Esc atau klik Tutup untuk kembali ke kelas</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          3. ADMIN WHITEBOARD & PRESENTATION SETTINGS MODAL
         ======================================================== */}
      {mounted && isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg pixel-panel-wood overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-amber-200 text-sm">Pengaturan Papan Tulis &amp; Presentasi Kelas</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-amber-400/70 hover:text-amber-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveSettings} className="p-4 space-y-4 text-amber-100 text-xs">
              {/* Presets Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-amber-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilihan Cepat / Preset Papan Tulis:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {WHITEBOARD_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditUrlInput(preset.url)}
                      className={`pixel-box-inset p-2 text-left hover:border-amber-400 transition-colors ${
                        editUrlInput === preset.url ? 'border-amber-400 bg-amber-950/80 ring-1 ring-amber-400' : ''
                      }`}
                    >
                      <div className="font-bold text-[11px] text-amber-100">{preset.name}</div>
                      <div className="text-[9px] text-amber-400/70">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Whiteboard / Presentation Embed URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-amber-200 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tautan Tampilan Papan Tulis (Canva / Slides / Whiteboard / Video):</span>
                </label>
                <input
                  type="url"
                  required
                  value={editUrlInput}
                  onChange={(e) => setEditUrlInput(e.target.value)}
                  placeholder="https://www.canva.com/... atau https://excalidraw.com atau https://docs.google.com/presentation/..."
                  className="w-full bg-[#1c0e05] border border-[#5c3416] rounded px-3 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400 placeholder:text-amber-900/60"
                />
                <p className="text-[10px] text-amber-400/70">
                  Dapat diisi tautan presentasi Canva, Google Slides, Whiteboard online (Excalidraw/Witeboard), video YouTube, atau tautan web interaktif lainnya. Sistem otomatis menyesuaikan format sematan (embed).
                </p>
              </div>

              {/* Canva Live Code (Optional) */}
              <div className="space-y-1.5">
                <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kode Canva Live (Opsional - Jika Menggunakan Canva):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={editLiveCodeInput}
                    onChange={(e) => setEditLiveCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: 123456"
                    className="flex-1 bg-[#1c0e05] border border-[#5c3416] rounded px-3 py-2 text-xs font-mono font-bold tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-400 placeholder:text-emerald-950/60"
                  />
                  {editLiveCodeInput && (
                    <button
                      type="button"
                      onClick={() => setEditLiveCodeInput('')}
                      className="pixel-btn-wood px-2 py-1 text-[10px]"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-amber-400/70">
                  Jika Anda menggunakan Canva Live di canva.com, masukkan kode 6 digit di sini agar seluruh siswa di kelas dapat langsung bergabung.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#5c3416]">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="pixel-btn-wood px-3 py-1.5 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="pixel-btn-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Tampilkan ke Semua Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default React.memo(PresentationScreen);
