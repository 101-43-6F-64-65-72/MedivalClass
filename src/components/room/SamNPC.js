'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Check, SendHorizontal, Award, Navigation } from 'lucide-react';
import { 
  playTypewriterBlip, 
  playDialogueOpen, 
  playChoiceHover, 
  playChoiceClick, 
  playCloseSound,
  playSuccessChime 
} from '@/lib/soundEffects';

// Default submission URL - can be updated to specific Google Form / LMS link
const SUBMISSION_URL = 'https://forms.gle/pengumpulan-tugas-game';

const DIALOGUE_TEXTS = {
  intro: 'Halo! Waktu terus berdetik di samping pendulum ini. Aku Sam, penjaga arsip karya game dan rak buku kelas XI. Kamu bisa menyetor link game kelompokmu ke rak buku kelas atau memeriksa karya teman-temanmu di sini.',
  devDone: 'Woah! Kamu telah melewati semua milestone Dev 1 hingga Dev 4! Ini momen istimewa. Sekarang saatnya mengabadikan hasil kerja kerasmu — setor link game kelompokmu ke Rak Buku kelas agar semua bisa memainkan dan mengapresiasinya!',
  submit: 'Cukup berikan link hasil game timmu. Sistem otomatis mengenali platform dan kategorinya, lalu menatanya di rak buku kelas.',
  tips: 'Ingat kawan: teknologi dan AI adalah alat bantu, namun logika dan kreativitasmu adalah nahkodanya. Pastikan game-mu dapat dimainkan dan diuji dengan baik.',
  later: 'Baiklah, silakan kembali berkarya bersama kelompokmu. Pendulum ini akan setia menanti game hebat kalian!',
};

function SamNPC({
  x = 135,
  y = 520,
  localPlayer,
  onOpenChange,
  isTracked = false,
  onOpenSubmission,
  onOpenBookshelf,
  allDevDone = false,
}) {
  const [mounted, setMounted] = useState(false);
  // Dialogue state: null | 'intro' | 'submit' | 'tips' | 'later'
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
      // If all dev tasks are done, show special congratulatory dialogue first
      setDialogStage(allDevDone ? 'devDone' : 'intro');
    }
  };

  const handleCloseAll = () => {
    playCloseSound();
    setDialogStage(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(submissionUrl);
    playSuccessChime();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render dialogue text with keyword highlights
  const renderTypedContent = (text) => {
    const keywords = ['Sam', 'tugas', 'GitHub', 'Vercel', 'submit', 'game loop', 'See ya', 'Yo'];
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
          1. MAP ENTITY: SAM NPC (West Wall near Pendulum Clock)
         ======================================================== */}
      {/* ========================================================
          1. MAP ENTITY: SAM NPC (Next to West Clock)
         ======================================================== */}
      <div
        className="absolute cursor-default pointer-events-auto select-none group"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: Math.floor(y) || 520,
          width: '56px',
          height: '68px',
        }}
        title="Dekati dan tekan E untuk bicara dengan Sam"
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
            <span>Sam</span>
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

        {/* Sam Character Avatar (Using authentic OwnAssets/Sam/Sam.png) */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-end">
          <img
            src="/assets/OwnAssets/Sam/Sam.png"
            alt="Sam"
            className="w-12 h-12 image-pixelated object-contain transition-transform group-hover:scale-105 active:scale-95"
          />
          {/* Glow ring when all dev tasks are done */}
          {allDevDone && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-pulse opacity-80 pointer-events-none" />
          )}
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

                    {/* Submission Preview Card (shown in submit stage) */}
                    {(dialogStage === 'submit' || dialogStage === 'tips') && (
                      <div className="mt-2.5 p-2 bg-[#fae3ba] border-2 border-[#b87c42] rounded flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <SendHorizontal className="w-5 h-5 text-[#733814] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#3d1e08] truncate">
                              Form Pengumpulan Tugas Game
                            </div>
                            <div className="text-[10px] text-[#8c4a00] font-mono truncate">
                              {submissionUrl}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={handleCopyLink}
                            title="Salin Link Pengumpulan"
                            className="px-2 py-1 bg-[#f0d099] hover:bg-[#ffe5bc] border border-[#a8743a] rounded text-[10px] font-bold text-[#3d1e08] flex items-center gap-1 shadow-xs"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-[#733814]" />}
                            <span>{copied ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <a
                            href={submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#3d7a28] hover:bg-[#4b9631] border border-[#275319] rounded text-[10px] font-bold text-white flex items-center gap-1 shadow transition-transform hover:scale-105 active:scale-95"
                          >
                            <span>Buka Form</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Dialogue Choice List */}
                    <div className={`mt-3 pt-2 border-t border-[#c98d51]/50 space-y-1.5 transition-opacity duration-200 ${
                      isTyping ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {/* DEV DONE special stage */}
                      {dialogStage === 'devDone' && (
                        <>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleCloseAll();
                              if (onOpenSubmission) onOpenSubmission();
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#2d7a28] hover:bg-[#3d9631] border-2 border-[#1a4f19] rounded text-xs sm:text-sm font-bold text-white flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-emerald-300 group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Setor Link Hasil Karya Game Sekarang!</span>
                          </button>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('intro');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08] flex items-center gap-2"
                          >
                            <span className="font-mono">◀</span>
                            <span>Lihat menu Sam lainnya</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'intro' && (
                        <>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleCloseAll();
                              if (onOpenSubmission) onOpenSubmission();
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Setor Link Hasil Karya Game Kelompok</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleCloseAll();
                              if (onOpenBookshelf) onOpenBookshelf('XI PPLG-B');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Buka Rak Buku Game XI PPLG-B</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleCloseAll();
                              if (onOpenBookshelf) onOpenBookshelf('XI PPLG-A');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Buka Rak Buku Game XI PPLG-A</span>
                          </button>

                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('tips');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Dengarkan petuah puitis Sam</span>
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
                            <span>Aku masih merajut bait kodenya, nanti kembali</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'submit' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              handleCloseAll();
                              if (onOpenSubmission) onOpenSubmission();
                            }}
                            className="w-full text-center px-4 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg"
                          >
                            <span>Buka Form Setor Link Game</span>
                          </button>
                          <button
                            onClick={() => setDialogStage('intro')}
                            className="w-full px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] border-2 border-[#b87c42] rounded text-xs font-bold text-[#3d1e08]"
                          >
                            ◀ Kembali
                          </button>
                        </div>
                      )}

                      {dialogStage === 'tips' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              handleCloseAll();
                              if (onOpenSubmission) onOpenSubmission();
                            }}
                            className="w-full text-center px-4 py-2 bg-[#3d7a28] hover:bg-[#4b9631] border-2 border-[#275319] rounded text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow"
                          >
                            <span>Setor Link Game Sekarang</span>
                          </button>

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
                        </div>
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

                  {/* RIGHT: Stardew Character Portrait Box for Sam */}
                  <div 
                    className="w-full sm:w-44 shrink-0 rounded p-2.5 flex flex-col items-center justify-between"
                    style={{
                      backgroundColor: '#874218',
                      border: '3px solid #54280b',
                    }}
                  >
                    {/* Portrait Inner Frame */}
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded flex items-center justify-center overflow-hidden relative shadow-inner p-1"
                      style={{
                        backgroundColor: '#fadca2',
                        border: '4px solid #5a280b',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <img
                        src="/assets/OwnAssets/Sam/potraitsam.png"
                        alt="Sam"
                        className="w-full h-full object-contain image-pixelated pointer-events-none select-none"
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
                        Sam
                      </div>
                      <div className="text-[10px] text-[#733814] font-semibold">
                        Penjaga Arsip Karya Game
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

export default React.memo(SamNPC, (prev, next) => {
  const wasNear = prev.localPlayer && Math.hypot(prev.localPlayer.x - prev.x, prev.localPlayer.y - prev.y) <= 130;
  const isNear = next.localPlayer && Math.hypot(next.localPlayer.x - next.x, next.localPlayer.y - next.y) <= 130;
  if (wasNear !== isNear) return false;
  if (prev.isTracked !== next.isTracked) return false;
  if (prev.x !== next.x || prev.y !== next.y) return false;
  if (prev.onOpenChange !== next.onOpenChange) return false;
  if (prev.onOpenSubmission !== next.onOpenSubmission) return false;
  if (prev.onOpenBookshelf !== next.onOpenBookshelf) return false;
  if (prev.allDevDone !== next.allDevDone) return false;
  return true;
});
