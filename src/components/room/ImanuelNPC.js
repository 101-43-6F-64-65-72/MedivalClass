'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Check, Gamepad2, Sparkles, X, ArrowRight, Navigation } from 'lucide-react';
import { 
  playTypewriterBlip, 
  playDialogueOpen, 
  playChoiceHover, 
  playChoiceClick, 
  playCloseSound,
  playSuccessChime,
  playScrollOpen
} from '@/lib/soundEffects';

const GAME_URL = 'https://pixel-arena-coin-grabber.vercel.app/';

const DIALOGUE_TEXTS = {
  intro: 'Halo kawan! Kamu sedang belajar membuat game multiplayer dengan AI ya? Aku punya contoh game seru yang 100% dibuat dengan bantuan AI lho!',
  what_game: 'Namanya Pixel Arena: Coin Grabber! Game 2D multiplayer berbasis web di mana para pemain saling berebut koin secara realtime, lengkap dengan skor live dan arena seru!',
  play_now: 'Keren! Ini link arenanya. Langsung buka dan gas coba mainkan bersama teman-teman sekelasmu sekarang juga!',
  learn: 'Banyak banget! Kamu bisa pelajari sinkronisasi Realtime posisi pemain, mekanik collision koin, leaderboard skor live, dan styling UI pixel art yang clean!',
  later: 'Oke siap! Kalau kamu butuh inspirasi referensi untuk tugas game-mu, datang ke aku lagi ya!',
};

function ImanuelNPC({
  x = 95,
  y = 800,
  localPlayer,
  onOpenChange,
  isTracked = false,
}) {
  const [mounted, setMounted] = useState(false);
  // Dialogue state: null | 'intro' | 'what_game' | 'play_now' | 'learn' | 'later'
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

  useEffect(() => {
    const handleKeySkip = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if ((e.key === ' ' || e.key === 'Enter') && isTyping) {
        e.preventDefault();
        handleSkipTyping();
      }
    };

    window.addEventListener('keydown', handleKeySkip);
    return () => window.removeEventListener('keydown', handleKeySkip);
  }, [isTyping, dialogStage]);

  const handleOpenIntro = () => {
    playDialogueOpen();
    setDialogStage('intro');
  };

  // Keyboard 'E' to interact when nearby
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if ((e.key === 'e' || e.key === 'E') && isNear && !dialogStage) {
        e.preventDefault();
        handleOpenIntro();
      } else if (e.key === 'Escape' && dialogStage) {
        e.preventDefault();
        handleCloseAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, dialogStage]);

  const handleCloseAll = () => {
    playCloseSound();
    setDialogStage(null);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(GAME_URL);
    playSuccessChime();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format keyword highlights in the typewriter text
  const renderTypedContent = (text) => {
    if (!text) return null;

    const keywords = [
      { word: 'Imanuel', className: 'text-[#7d3204] font-black underline decoration-[#a0521e]' },
      { word: 'Pixel Arena: Coin Grabber', className: 'text-[#873906] font-black underline decoration-[#b87c42]' },
      { word: '100% dibuat dengan bantuan AI', className: 'text-[#1e6126] font-black' },
      { word: 'berebut koin', className: 'text-[#8c4a00] font-black' },
      { word: 'realtime', className: 'text-[#094770] font-black' },
      { word: 'skor live', className: 'text-[#1e6126] font-black' },
      { word: 'Realtime', className: 'text-[#094770] font-black' },
      { word: 'leaderboard', className: 'text-[#8c4a00] font-black' },
    ];

    const regex = new RegExp(`(${keywords.map(k => k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const match = keywords.find(k => k.word.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <span key={idx} className={match.className}>
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <>
      {/* ========================================================
          1. IN-ROOM PHYSICAL NPC: IMANUEL (Faces Right)
             Coordinates: West wall open aisle (x: 95, y: 800)
             Row 2 Col 1 in RPG Maker MZ sheet faces RIGHT
         ======================================================== */}
      <div
        className="absolute cursor-default pointer-events-auto select-none group"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: Math.floor(y) || 500,
          width: '56px',
          height: '68px',
        }}
        title="Dekati dan tekan E untuk bicara dengan Imanuel"
      >
        {/* Floating NPC Indicator Arrow (Only when not tracked) */}
        {!isTracked && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-bounce">
            <img 
              src="/assets/fantasy_pixelart_ui/arrows/gold_arrow_down_normal.png" 
              alt="NPC Pointer" 
              className="w-4 h-4 image-rendering-pixelated drop-shadow"
            />
          </div>
        )}

        {/* Proximity Interaction Hint [E] */}
        {isNear && !dialogStage && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-bounce-short">
            <div className="pixel-panel-wood text-amber-100 px-2.5 py-1 flex items-center gap-1.5 shadow-2xl border border-amber-600/70">
              <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2 pointer-events-none">
                E
              </span>
              <span className="text-[11px] font-bold text-amber-200">Tekan E untuk Bicara</span>
            </div>
          </div>
        )}

        {/* NPC Nametag */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#140802]/90 border border-amber-600/70 text-amber-300 shadow-md">
            <span>Imanuel</span>
          </div>
        </div>

        {/* Active Waypoint Beacon Marker (100% centered and fitted on NPC) */}
        {isTracked && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center animate-bounce">
            <div className="pixel-panel-gold px-2 py-0.5 text-[9px] font-black text-amber-950 uppercase tracking-widest shadow-2xl border-2 border-amber-900 flex items-center gap-1 whitespace-nowrap">
              <Navigation className="w-2.5 h-2.5 text-amber-900 fill-amber-900" />
              <span>TARGET</span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-400 drop-shadow-md" />
          </div>
        )}

        {/* Imanuel Character Avatar (Using authentic OwnAssets/imanuel/imanuel.png, flipped horizontally to face right) */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-end">
          <img
            src="/assets/OwnAssets/imanuel/imanuel.png"
            alt="Imanuel"
            className="w-12 h-12 image-pixelated object-contain transition-transform group-hover:scale-105 active:scale-95"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Shadow directly at feet */}
          <div className="w-8 h-2.5 bg-black/60 rounded-full blur-[1px] -mt-1.5 pointer-events-none" />
        </div>

        {/* Golden Target Pulse Ring at Feet */}
        {isTracked && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-12 h-3.5 border-2 border-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute w-10 h-3 border-2 border-amber-300 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
          </div>
        )}
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

                    {/* Example Game Card Preview (shown in what_game and play_now stages) */}
                    {(dialogStage === 'what_game' || dialogStage === 'play_now' || dialogStage === 'learn') && (
                      <div className="mt-2.5 p-2 bg-[#fae3ba] border-2 border-[#b87c42] rounded flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Gamepad2 className="w-5 h-5 text-[#733814] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#3d1e08] truncate">
                              Pixel Arena: Coin Grabber
                            </div>
                            <div className="text-[10px] text-[#8c4a00] font-mono truncate">
                              pixel-arena-coin-grabber.vercel.app
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={handleCopyLink}
                            title="Salin Link Game"
                            className="px-2 py-1 bg-[#f0d099] hover:bg-[#ffe5bc] border border-[#a8743a] rounded text-[10px] font-bold text-[#3d1e08] flex items-center gap-1 shadow-xs"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-[#733814]" />}
                            <span>{copied ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <a
                            href={GAME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#3d7a28] hover:bg-[#4b9631] border border-[#275319] rounded text-[10px] font-bold text-white flex items-center gap-1 shadow transition-transform hover:scale-105 active:scale-95"
                          >
                            <span>Mainkan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Stardew Dialogue Choice List */}
                    <div className={`mt-3 pt-2 border-t border-[#c98d51]/50 space-y-1.5 transition-opacity duration-200 ${
                      isTyping ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {dialogStage === 'intro' && (
                        <>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('what_game');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Game apa itu?</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('play_now');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Mau coba mainkan</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('learn');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Apa yang bisa dipelajari dari game itu?</span>
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
                            <span>Nanti dulu</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'what_game' && (
                        <>
                          <a
                            href={GAME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => playChoiceHover()}
                            className="w-full text-center px-4 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-98"
                          >
                            <span>Buka Pixel Arena: Coin Grabber (Tab Baru)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex gap-2">
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('learn');
                              }}
                              className="flex-1 text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08] flex items-center gap-1.5"
                            >
                              <span className="font-mono text-[#a0521e]">▶</span>
                              <span>Apa yg bisa dipelajari?</span>
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

                      {dialogStage === 'play_now' && (
                        <>
                          <a
                            href={GAME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => playChoiceHover()}
                            className="w-full text-center px-4 py-2.5 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-98 animate-pulse"
                          >
                            <span>Buka Pixel Arena Sekarang</span>
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>

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

                      {dialogStage === 'learn' && (
                        <>
                          <a
                            href={GAME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => playChoiceHover()}
                            className="w-full text-center px-4 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-98"
                          >
                            <span>Buka Contoh Game (Pixel Arena)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

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

                  {/* RIGHT: Stardew Character Portrait Box for Imanuel */}
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
                      <img
                        src="/assets/OwnAssets/imanuel/normal.png"
                        alt="Imanuel"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain image-pixelated pointer-events-none select-none drop-shadow"
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
                        Imanuel
                      </div>
                      <div className="text-[9px] text-[#8c4a00] font-mono">
                        AI Game Showcase
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}

export default React.memo(ImanuelNPC, (prev, next) => {
  const wasNear = prev.localPlayer && Math.hypot(prev.localPlayer.x - prev.x, prev.localPlayer.y - prev.y) <= 130;
  const isNear = next.localPlayer && Math.hypot(next.localPlayer.x - next.x, next.localPlayer.y - next.y) <= 130;
  if (wasNear !== isNear) return false;
  if (prev.isTracked !== next.isTracked) return false;
  if (prev.x !== next.x || prev.y !== next.y) return false;
  if (prev.onOpenChange !== next.onOpenChange) return false;
  return true;
});
