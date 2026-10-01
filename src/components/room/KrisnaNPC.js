'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Check, Tv, BookOpen, ArrowRight } from 'lucide-react';
import { 
  playTypewriterBlip, 
  playDialogueOpen, 
  playChoiceHover, 
  playChoiceClick, 
  playCloseSound,
  playSuccessChime 
} from '@/lib/soundEffects';

const CANVA_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view';

const DIALOGUE_TEXTS = {
  intro: 'Halo kawan! Aku Krisna. Sedang mencari slide materi pembelajaran hari ini? Aku pegang link presentasi Canva resmi untuk kelas kita lho!',
  open_slide: 'Ini slide pembelajarannya! Kamu bisa buka langsung di layar proyektor kelas atau buka di tab baru browser-mu agar bisa dibaca dengan nyaman.',
  topics: 'Materi hari ini membahas: Konsep Game Multiplayer Web, Arsitektur Next.js & Supabase Realtime, serta Prompting AI untuk Game Development!',
  later: 'Siap! Kapan pun kamu butuh menyimak materi atau slide presentasi, datang saja ke rak buku ini ya!',
};

export default function KrisnaNPC({
  x = 1715,
  y = 720,
  localPlayer,
  onOpenChange,
  onOpenPresentation,
}) {
  const [mounted, setMounted] = useState(false);
  // Dialogue state: null | 'intro' | 'open_slide' | 'topics' | 'later'
  const [dialogStage, setDialogStage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proximity check: Generous interaction radius (130px)
  const isNear = Boolean(
    localPlayer &&
    Math.hypot(localPlayer.x - x, localPlayer.y - y) <= 130
  );

  const isDialogOpen = Boolean(dialogStage);

  // Notify parent to disable player controls while talking
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isDialogOpen);
    }
  }, [isDialogOpen, onOpenChange]);

  // Visual Novel typewriter effect ticker
  useEffect(() => {
    if (!dialogStage) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const fullText = DIALOGUE_TEXTS[dialogStage] || '';
    if (!fullText) return;

    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      const currentSlice = fullText.slice(0, currentIndex);
      setDisplayedText(currentSlice);

      const char = fullText[currentIndex - 1];
      if (currentIndex % 2 === 0) {
        playTypewriterBlip(char);
      }

      if (currentIndex >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [dialogStage]);

  // Click or Space/Enter to instant complete typing
  const handleSkipTyping = () => {
    if (isTyping && dialogStage && DIALOGUE_TEXTS[dialogStage]) {
      setDisplayedText(DIALOGUE_TEXTS[dialogStage]);
      setIsTyping(false);
    }
  };

  // Keyboard shortcut listener:
  // - Press 'E' when near to interact
  // - Press 'Escape' to close dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isInput) return;

      if ((e.key === 'e' || e.key === 'E') && isNear && !dialogStage) {
        e.preventDefault();
        playDialogueOpen();
        setDialogStage('intro');
      } else if (e.key === 'Escape' && dialogStage) {
        e.preventDefault();
        handleCloseAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, dialogStage]);

  const handleInteract = () => {
    if (!dialogStage) {
      playDialogueOpen();
      setDialogStage('intro');
    }
  };

  const handleCloseAll = () => {
    playCloseSound();
    setDialogStage(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(CANVA_URL);
    playSuccessChime();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEmbedded = () => {
    playChoiceClick();
    handleCloseAll();
    if (onOpenPresentation) {
      onOpenPresentation();
    }
  };

  // Render dialogue text with highlight keywords
  const renderTypedContent = (text) => {
    const keywords = ['Krisna', 'Canva', 'slide', 'Game Multiplayer Web', 'Next.js', 'Supabase Realtime', 'Prompting AI'];
    let parts = [text];

    keywords.forEach((kw) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string' && part.includes(kw)) {
          const split = part.split(kw);
          split.forEach((s, idx) => {
            newParts.push(s);
            if (idx < split.length - 1) {
              newParts.push(
                <span key={`${kw}-${idx}`} className="text-[#8c2e1b] font-black underline decoration-[#c98d51]/50 underline-offset-2">
                  {kw}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  return (
    <>
      {/* ========================================================
          1. MAP ENTITY: KRISNA NPC (In Classroom at East Bookshelf)
         ======================================================== */}
      <div
        onClick={handleInteract}
        className="absolute cursor-pointer pointer-events-auto select-none group"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: Math.floor(y) || 500,
          width: '56px',
          height: '68px',
        }}
        title="Klik atau tekan E untuk bicara dengan Krisna"
      >
        {/* Floating NPC Indicator Arrow */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-bounce">
          <img 
            src="/assets/fantasy_pixelart_ui/arrows/gold_arrow_down_normal.png" 
            alt="NPC Pointer" 
            className="w-4 h-4 image-rendering-pixelated drop-shadow" 
          />
        </div>

        {/* Proximity Interaction Hint [E] */}
        {isNear && !dialogStage && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-bounce-short">
            <div className="pixel-panel-wood text-amber-100 px-2.5 py-1 flex items-center gap-1.5 shadow-2xl border border-amber-600/70">
              <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2 pointer-events-none">
                E
              </span>
              <span className="text-[11px] font-bold text-amber-200">Bicara dgn Krisna</span>
            </div>
          </div>
        )}

        {/* NPC Nametag */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#140802]/90 border border-amber-600/70 text-amber-300 shadow-md">
            <span>Krisna</span>
          </div>
        </div>

        {/* Krisna Character Avatar & Grounded Shadow (Facing Left towards aisle: Row 1 = -48px -48px) */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-end">
          <div
            className="w-12 h-12 image-pixelated transition-transform group-hover:scale-105 active:scale-95"
            style={{
              backgroundImage: "url('/assets/RPG Maker MZ (48x48)/characters/$Char_004.png')",
              backgroundPosition: '-48px -48px', // Row 1 Col 1 = Facing LEFT
              backgroundSize: '144px 192px',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Shadow directly at feet */}
          <div className="w-8 h-2.5 bg-black/60 rounded-full blur-[1px] -mt-1.5 pointer-events-none" />
        </div>
      </div>

      {/* ========================================================
          2. STARDEW VALLEY DIALOGUE BOX (Portaled to document.body)
         ======================================================== */}
      {mounted && createPortal(
        <>
          {dialogStage && (
            <div className="fixed inset-0 z-[999999] pointer-events-auto flex items-end justify-center pb-6 sm:pb-8 px-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150">
              <div 
                className="w-full max-w-[800px] select-none rounded shadow-2xl relative"
                style={{
                  backgroundColor: '#733814',
                  border: '4px solid #4a210b',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 2px 4px #a05322',
                  padding: '8px',
                }}
              >
                {/* Close Button top-right */}
                <button
                  onClick={handleCloseAll}
                  title="Tutup Dialog (Esc)"
                  className="absolute -top-3.5 -right-3.5 bg-[#54280b] hover:bg-[#733814] border-2 border-[#f7d59b] text-[#f7d59b] w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-110 active:scale-90 z-20"
                >
                  ✕
                </button>

                {/* Main Stardew Container: Left Parchment + Right Portrait */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                  {/* LEFT: Dialogue Parchment Box */}
                  <div 
                    className="flex-1 rounded p-4 sm:p-5 flex flex-col justify-between min-h-[170px] relative shadow-inner"
                    style={{
                      backgroundColor: '#f5cb85',
                      border: '3px solid #b87c42',
                      boxShadow: 'inset 0 0 12px rgba(139, 75, 26, 0.25)',
                    }}
                  >
                    {/* Dialogue Text Area (Clickable to skip typing) */}
                    <div 
                      onClick={handleSkipTyping}
                      className="text-[#3b1c06] font-medium leading-relaxed text-sm sm:text-base select-text cursor-pointer min-h-[56px]"
                      title={isTyping ? "Klik untuk mempercepat teks" : ""}
                    >
                      <p className="font-semibold text-sm sm:text-base">
                        "{renderTypedContent(displayedText)}"
                        {isTyping && (
                          <span className="inline-block w-2 h-4 ml-1 bg-[#8c3b28] animate-pulse align-middle" />
                        )}
                      </p>
                    </div>

                    {/* Canva Slide Preview Card (shown in open_slide and topics stages) */}
                    {(dialogStage === 'open_slide' || dialogStage === 'topics') && (
                      <div className="mt-2.5 p-2 bg-[#fae3ba] border-2 border-[#b87c42] rounded flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-5 h-5 text-[#733814] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#3d1e08] truncate">
                              Presentasi Pembelajaran Hari Ini
                            </div>
                            <div className="text-[10px] text-[#8c4a00] font-mono truncate">
                              canva.com/design/DAHWqHcG_Jw/...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={handleCopyLink}
                            title="Salin Link Canva"
                            className="px-2 py-1 bg-[#f0d099] hover:bg-[#ffe5bc] border border-[#a8743a] rounded text-[10px] font-bold text-[#3d1e08] flex items-center gap-1 shadow-xs"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-[#733814]" />}
                            <span>{copied ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <a
                            href={CANVA_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#008080] hover:bg-[#009688] border border-[#004d40] rounded text-[10px] font-bold text-white flex items-center gap-1 shadow transition-transform hover:scale-105 active:scale-95"
                          >
                            <span>Buka Tab Baru</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Dialogue Choice List */}
                    <div className={`mt-3 pt-2 border-t border-[#c98d51]/50 space-y-1.5 transition-opacity duration-200 ${
                      isTyping ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {dialogStage === 'intro' && (
                        <>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('open_slide');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Boleh lihat slide pembelajarannya?</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('topics');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Apa saja materi penting hari ini?</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('later');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#6d2716] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Nanti dulu ya</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'open_slide' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={handleOpenEmbedded}
                              className="px-3 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow transition-transform hover:scale-[1.02] active:scale-98"
                            >
                              <Tv className="w-3.5 h-3.5" />
                              <span>Buka Layar Kelas</span>
                            </button>

                            <a
                              href={CANVA_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              onMouseEnter={() => playChoiceHover()}
                              className="px-3 py-2 bg-[#008080] hover:bg-[#009688] border-2 border-[#004d40] rounded text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 shadow transition-transform hover:scale-[1.02] active:scale-98"
                            >
                              <span>Buka Tab Baru</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('topics');
                              }}
                              className="flex-1 text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08] flex items-center gap-1.5"
                            >
                              <span className="font-mono text-[#a0521e]">▶</span>
                              <span>Lihat topik materi</span>
                            </button>

                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('intro');
                              }}
                              className="px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08]"
                            >
                              ◀ Kembali
                            </button>
                          </div>
                        </>
                      )}

                      {dialogStage === 'topics' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={handleOpenEmbedded}
                              className="px-3 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow"
                            >
                              <Tv className="w-3.5 h-3.5" />
                              <span>Buka di Layar Kelas</span>
                            </button>

                            <a
                              href={CANVA_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              onMouseEnter={() => playChoiceHover()}
                              className="px-3 py-2 bg-[#008080] hover:bg-[#009688] border-2 border-[#004d40] rounded text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow"
                            >
                              <span>Buka di Tab Baru</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('intro');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08] flex items-center gap-2"
                          >
                            <span className="font-mono">◀</span>
                            <span>Kembali ke pilihan</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'later' && (
                        <button
                          onMouseEnter={() => playChoiceHover()}
                          onClick={handleCloseAll}
                          className="w-full text-center px-4 py-2 bg-[#8c3b28] hover:bg-[#a64732] active:bg-[#6e2e1f] border-2 border-[#4a1c12] rounded text-xs sm:text-sm font-bold text-amber-100 transition-all shadow"
                        >
                          Tutup
                        </button>
                      )}
                    </div>

                    {/* Stardew Indicator */}
                    <div className="absolute bottom-2 right-2.5 pointer-events-none select-none text-xs text-[#a0521e] animate-bounce font-mono">
                      ▼
                    </div>
                  </div>

                  {/* RIGHT: Stardew Character Portrait Box for Krisna */}
                  <div 
                    className="w-full sm:w-44 shrink-0 rounded p-2.5 flex flex-col items-center justify-between"
                    style={{
                      backgroundColor: '#874218',
                      border: '3px solid #54280b',
                    }}
                  >
                    {/* Portrait Inner Frame */}
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded flex items-center justify-center overflow-hidden relative shadow-inner"
                      style={{
                        backgroundColor: '#fadca2',
                        border: '4px solid #5a280b',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div
                        className="w-24 h-24 image-pixelated pointer-events-none select-none"
                        style={{
                          backgroundImage: "url('/assets/RPG Maker MZ (48x48)/characters/$Char_004.png')",
                          backgroundPosition: '-96px 0px', // Front portrait angle
                          backgroundSize: '288px 384px',
                          backgroundRepeat: 'no-repeat',
                          transform: 'scale(1.35) translateY(6px)',
                        }}
                      />
                    </div>

                    {/* Stardew Nameplate Banner */}
                    <div 
                      className="w-full mt-2.5 py-1 px-2 text-center rounded shadow-sm"
                      style={{
                        backgroundColor: '#fae4bb',
                        border: '2px solid #5a280b',
                      }}
                    >
                      <div className="font-serif font-black text-sm sm:text-base tracking-wider text-[#3d1e08]">
                        Krisna
                      </div>
                      <div className="text-[10px] text-[#733814] font-semibold">
                        Pustakawan Materi
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
        ,
        document.body
      )}
    </>
  );
}
