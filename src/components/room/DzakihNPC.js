'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Sparkles, Smile, X, Check, Footprints, Navigation } from 'lucide-react';
import { 
  playTypewriterBlip, 
  playDialogueOpen, 
  playChoiceHover, 
  playChoiceClick, 
  playCloseSound,
  playSuccessChime 
} from '@/lib/soundEffects';
import { CAT_BREEDS } from './PetCompanion';

const DIALOGUE_TEXTS = {
  intro: 'Eits! Mau adopsi atau ganti kucing peliharaan ya? Tepat sekali, selain tampan dan karismatik, aku ini juga master breeder kucing nomor satu di kelas ini! Hahaha!',
  who_are_you: 'Kenalin, Dzakih! Pria paling karismatik dan berwawasan luas di kelas ini. Selain keren, aku dipercaya mengurus semua kucing peliharaan di kelas ini biar kalian nggak kesepian!',
  why_cats: 'Soalnya kucing-kucing di sini cuma mau nurut sama aura cowok keren kayak aku. Kucing aja paham selera tinggi, masa kamu enggak? Hahaha!',
  joke: 'Kucing apa yang paling kuno? Kucing-galan zaman! Hahaha garing kan? Tapi tetep ketawa dong, hargai komedi berkelas ini!',
  pet_selected: 'Pilihan berkelas! Kucing itu bakal setia mengikutimu keliling kelas virtual. Rawat baik-baik ya, jangan sampai kalah ganteng sama kucingnya!',
  pet_removed: 'Oke, kucingmu sudah diistirahatkan di lounge santai Dzakih. Kapanpun kamu butuh teman jalan-jalan lagi, tinggal bilang ke aku ya!',
  bye: 'Yaelah, ya udah sana hus hus, aku mau lanjut menikmati ketenaranku dan main bareng kucing!',
};

function DzakihNPC({
  x = 1250,
  y = 955,
  localPlayer,
  onOpenChange,
  localPetBreed = null,
  onSelectPet,
  isTracked = false,
}) {
  const [mounted, setMounted] = useState(false);
  // Dialogue state: null | 'intro' | 'pet_select' | 'who_are_you' | 'why_cats' | 'joke' | 'pet_selected' | 'pet_removed' | 'bye'
  const [dialogStage, setDialogStage] = useState(null);

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Ambient cats idle animation ticker around Dzakih
  const [ambientCatFrame, setAmbientCatFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setAmbientCatFrame((prev) => (prev + 1) % 7);
    }, 150);
    return () => clearInterval(timer);
  }, []);

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

    if (dialogStage === 'pet_select') {
      setDisplayedText('Pilih kucing mana yang mau kamu bawa jalan-jalan keliling kelas:');
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

  // Keyboard shortcut listener
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

  const handleChoosePet = (breedId) => {
    playSuccessChime();
    if (onSelectPet) {
      onSelectPet(breedId);
    }
    setDialogStage('pet_selected');
  };

  const handleRemovePet = () => {
    playSuccessChime();
    if (onSelectPet) {
      onSelectPet(null);
    }
    setDialogStage('pet_removed');
  };

  // Render dialogue text with keyword highlights
  const renderTypedContent = (text) => {
    const keywords = ['Dzakih', 'kucing', 'adopsi', 'karismatik', 'breeder', 'Kucing-galan zaman', 'Wkwkwk', 'Hahaha'];
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
          1. MAP ENTITY: DZAKIH NPC (At student desk row 2)
         ======================================================== */}
      <div
        className="absolute cursor-default pointer-events-auto select-none group"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: Math.floor(y) || 955,
          width: '56px',
          height: '68px',
        }}
        title="Dekati dan tekan E untuk setting pet dengan Dzakih"
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
            <span>Dzakih</span>
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

        {/* ========================================================
            AMBIENT CATS SURROUNDING DZAKIH (PET MASTER ASSISTANTS)
           ======================================================== */}
        {/* Cat 1: Mochi (Tabby) - Sitting on Left */}
        <div 
          className="absolute -left-7 bottom-0 pointer-events-none flex flex-col items-center select-none z-10"
          title="Mochi si Kucing Tabby"
        >
          <span className="text-[7.5px] font-bold bg-[#140802]/90 text-amber-200 px-1 py-0.2 rounded border border-amber-700/60 shadow -mb-1 z-10">
            Mochi
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundImage: "url('/assets/AllCatsDemo/AllCatsDemo/Classical/IdleCat.png')",
              backgroundPosition: `-${ambientCatFrame * 32}px 0px`,
              backgroundSize: '224px 32px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
          <div className="w-5 h-1.5 bg-black/45 rounded-full blur-[1px] -mt-1.5" />
        </div>

        {/* Cat 2: Snowy (White Cat) - Sitting on Right */}
        <div 
          className="absolute -right-7 bottom-1 pointer-events-none flex flex-col items-center select-none z-10"
          title="Snowy si Kucing Putih"
        >
          <span className="text-[7.5px] font-bold bg-[#140802]/90 text-amber-200 px-1 py-0.2 rounded border border-amber-700/60 shadow -mb-1 z-10">
            Snowy
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundImage: "url('/assets/AllCatsDemo/AllCatsDemo/White/IdleCatttt.png')",
              backgroundPosition: `-${((ambientCatFrame + 3) % 7) * 32}px 0px`,
              backgroundSize: '224px 32px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              transform: 'scaleX(-1)',
            }}
          />
          <div className="w-5 h-1.5 bg-black/45 rounded-full blur-[1px] -mt-1.5" />
        </div>

        {/* Cat 3: Kuro (Black Cat) - Resting in Front */}
        <div 
          className="absolute left-6 -bottom-3 pointer-events-none flex flex-col items-center select-none z-20"
          title="Kuro si Kucing Hitam"
        >
          <span className="text-[7.5px] font-bold bg-[#140802]/90 text-amber-200 px-1 py-0.2 rounded border border-amber-700/60 shadow -mb-1 z-10">
            Kuro
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundImage: "url('/assets/AllCatsDemo/AllCatsDemo/BlackCat/IdleCatb.png')",
              backgroundPosition: `-${((ambientCatFrame + 5) % 7) * 32}px 0px`,
              backgroundSize: '224px 32px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
          <div className="w-5 h-1.5 bg-black/45 rounded-full blur-[1px] -mt-1.5" />
        </div>

        {/* Cat Milk / Water Dish */}
        <div 
          className="absolute -left-2 -bottom-2 pointer-events-none z-20"
          title="Mangkuk Kucing"
        >
          <div 
            className="w-3.5 h-2 rounded-full border border-amber-600/80"
            style={{
              background: 'radial-gradient(circle, #fef08a 0%, #b45309 85%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}
          />
        </div>

        {/* Dzakih Character Avatar (Using authentic OwnAssets/dzakih/dzakih.png) */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-end z-10">
          <img
            src="/assets/OwnAssets/dzakih/dzakih.png"
            alt="Dzakih"
            className="w-12 h-12 image-pixelated object-contain transition-transform group-hover:scale-105 active:scale-95"
          />
          {/* Shadow directly at feet */}
          <div className="w-8 h-2.5 bg-black/60 rounded-full blur-[1px] -mt-1.5 pointer-events-none" />
        </div>

        {/* Golden Target Pulse Ring at Feet (Zero Glow, Pure Pixel Art) */}
        {isTracked && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-12 h-3.5 border-2 border-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute w-10 h-3 border-2 border-amber-300 rounded-full pixel-shadow-sm animate-pulse" />
          </div>
        )}
      </div>

      {/* ========================================================
          2. STARDEW VALLEY DIALOGUE BOX (Portaled to document.body)
         ======================================================== */}
      {mounted && createPortal(
        <>
          {dialogStage && (
            <div className="fixed inset-0 z-[999999] pointer-events-auto flex items-end justify-center pb-4 sm:pb-8 px-3 sm:px-4 bg-black/60 animate-in fade-in duration-150 font-pixel">
              <div 
                className="w-full max-w-[820px] select-none rounded relative max-h-[92vh] overflow-y-auto"
                style={{
                  backgroundColor: '#733814',
                  border: '4px solid #4a210b',
                  boxShadow: '4px 4px 0px #000000, inset 0 2px 0px #a05322',
                  padding: '8px',
                }}
              >
                {/* Close Button top-right */}
                <button
                  onClick={handleCloseAll}
                  title="Tutup Dialog (Esc)"
                  className="absolute -top-3.5 -right-3.5 bg-[#54280b] hover:bg-[#733814] border-2 border-[#f7d59b] text-[#f7d59b] w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs pixel-shadow transition-transform hover:scale-110 active:scale-90 z-20 font-pixel"
                >
                  ✕
                </button>

                {/* Main Stardew Container: Left Parchment + Right Portrait */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                  {/* LEFT: Dialogue Parchment Box */}
                  <div 
                    className="flex-1 rounded p-4 sm:p-5 flex flex-col justify-between min-h-[220px] relative shadow-inner"
                    style={{
                      backgroundColor: '#f5cb85',
                      border: '3px solid #b87c42',
                      boxShadow: 'inset 0 0 12px rgba(139, 75, 26, 0.25)',
                    }}
                  >
                    {/* Top Dialogue Text Area */}
                    <div 
                      onClick={handleSkipTyping}
                      className="text-[#3b1c06] font-medium leading-relaxed text-sm sm:text-base select-text cursor-pointer min-h-[48px]"
                      title={isTyping ? "Klik untuk mempercepat teks" : ""}
                    >
                      <p className="font-semibold text-sm sm:text-base">
                        "{renderTypedContent(displayedText)}"
                        {isTyping && (
                          <span className="inline-block w-2 h-4 ml-1 bg-[#8c3b28] animate-pulse align-middle" />
                        )}
                      </p>
                    </div>

                    {/* PET SELECTION GRID (Shown in 'pet_select' stage) */}
                    {dialogStage === 'pet_select' && (
                      <div className="mt-3 space-y-2.5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto p-1">
                          {CAT_BREEDS.map((cat) => {
                            const isSelected = localPetBreed === cat.id;
                            return (
                              <div
                                key={cat.id}
                                className={`p-2 rounded border flex flex-col items-center text-center gap-1 transition-all ${
                                  isSelected
                                    ? 'bg-[#ffe9c2] border-[#733814] ring-2 ring-[#733814]'
                                    : 'bg-[#fae2b8] border-[#c48d56] hover:border-[#733814]'
                                }`}
                              >
                                {/* Animated Cat Preview */}
                                <div className="w-9 h-9 flex items-center justify-center bg-[#ebd1a0] rounded-full border border-[#b87c42]">
                                  <div
                                    className="w-8 h-8 image-pixelated"
                                    style={{
                                      backgroundImage: `url('${cat.idle}')`,
                                      backgroundPosition: '0px 0px',
                                      backgroundSize: `${cat.idleFrames * 32}px 32px`,
                                      backgroundRepeat: 'no-repeat',
                                    }}
                                  />
                                </div>
                                <div className="text-[11px] font-bold text-[#3d1e08] truncate w-full">
                                  {cat.name}
                                </div>
                                <button
                                  onClick={() => handleChoosePet(cat.id)}
                                  className={`w-full py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                                    isSelected
                                      ? 'bg-[#3d7a28] text-white'
                                      : 'bg-[#f0d099] hover:bg-[#ffebd0] text-[#3d1e08] border border-[#a8743a]'
                                  }`}
                                >
                                  {isSelected ? '✓ Dipakai' : 'Pilih'}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Action Bar inside Pet Select */}
                        <div className="pt-2 border-t border-[#c98d51]/50 flex items-center justify-between gap-2">
                          {localPetBreed ? (
                            <button
                              onClick={handleRemovePet}
                              className="px-2.5 py-1 bg-[#8c3b28] hover:bg-[#a64732] text-white text-[10px] font-bold rounded border border-[#521d12]"
                            >
                              Lepas Kucing (Tanpa Pet)
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#733814] italic">Belum ada kucing aktif</span>
                          )}

                          <button
                            onClick={() => setDialogStage('intro')}
                            className="px-3 py-1 bg-[#fde5bc] hover:bg-[#fff3db] border border-[#b87c42] rounded text-[10px] font-bold text-[#3d1e08]"
                          >
                            ◀ Kembali
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dialogue Choice List (when NOT in pet_select) */}
                    {dialogStage !== 'pet_select' && (
                      <div className={`mt-3 pt-2 border-t border-[#c98d51]/50 space-y-1.5 transition-opacity duration-200 ${
                        isTyping ? 'opacity-40' : 'opacity-100'
                      }`}>
                        {dialogStage === 'intro' && (
                          <>
                            {/* Primary Button: Open Pet Setting */}
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('pet_select');
                              }}
                              className="w-full text-left px-3 py-2 bg-[#ffe8bd] hover:bg-[#fff5dc] active:bg-[#ebd09d] border-2 border-[#8c4315] hover:border-[#733814] rounded text-xs sm:text-sm font-black text-[#3d1e08] flex items-center justify-between group transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                                <span>Pilih / Ganti Kucing Peliharaan</span>
                              </div>
                              <span className="text-[10px] text-[#733814] font-semibold bg-[#f5cb85] px-2 py-0.5 rounded border border-[#b87c42]">
                                {localPetBreed ? 'Ganti Pet' : 'Pilih Pet'}
                              </span>
                            </button>

                            {/* Secondary Button: Why cats */}
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('why_cats');
                              }}
                              className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                            >
                              <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                              <span>Kenapa kamu yang ngurus kucing di kelas?</span>
                            </button>

                            {/* Joke Button */}
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('joke');
                              }}
                              className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                            >
                              <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                              <span>Coba tebak-tebakan komedi dong</span>
                            </button>

                            {/* Bye */}
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('bye');
                              }}
                              className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#6d2716] flex items-center gap-2 group transition-all shadow-sm"
                            >
                              <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                              <span>Nggak jadi, pamit dulu</span>
                            </button>
                          </>
                        )}

                        {(dialogStage === 'who_are_you' || dialogStage === 'why_cats' || dialogStage === 'joke' || dialogStage === 'pet_selected' || dialogStage === 'pet_removed') && (
                          <div className="flex gap-2">
                            <button
                              onMouseEnter={() => playChoiceHover()}
                              onClick={() => {
                                playChoiceClick();
                                setDialogStage('pet_select');
                              }}
                              className="flex-1 text-left px-3 py-1.5 bg-[#ffe8bd] hover:bg-[#fff3db] border-2 border-[#8c4315] rounded text-xs font-bold text-[#3d1e08] flex items-center gap-1.5 shadow-sm"
                            >
                              <span className="font-mono text-[#a0521e]">▶</span>
                              <span>Atur Pet Kucing Lainnya</span>
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
                        )}

                        {dialogStage === 'bye' && (
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={handleCloseAll}
                            className="w-full text-center px-4 py-2 bg-[#8c3b28] hover:bg-[#a64732] active:bg-[#6e2e1f] border-2 border-[#4a1c12] rounded text-xs sm:text-sm font-bold text-amber-100 transition-all shadow"
                          >
                            Tinggalkan Dzakih
                          </button>
                        )}
                      </div>
                    )}

                    {/* Stardew Indicator */}
                    <div className="absolute bottom-2 right-2.5 pointer-events-none select-none text-xs text-[#a0521e] animate-bounce font-mono">
                      ▼
                    </div>
                  </div>

                  {/* RIGHT: Stardew Character Portrait Box for Dzakih */}
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
                        src="/assets/OwnAssets/dzakih/normal.png"
                        alt="Dzakih"
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
                      <div className="font-pixel font-black text-sm sm:text-base tracking-wider text-[#3d1e08]">
                        Dzakih
                      </div>
                      <div className="text-[10px] text-[#733814] font-bold font-pixel">
                        Master Pet Kucing
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

export default React.memo(DzakihNPC, (prev, next) => {
  const wasNear = prev.localPlayer && Math.hypot(prev.localPlayer.x - prev.x, prev.localPlayer.y - prev.y) <= 130;
  const isNear = next.localPlayer && Math.hypot(next.localPlayer.x - next.x, next.localPlayer.y - next.y) <= 130;
  if (wasNear !== isNear) return false;
  if (prev.isTracked !== next.isTracked) return false;
  if (prev.localPetBreed !== next.localPetBreed) return false;
  if (prev.x !== next.x || prev.y !== next.y) return false;
  if (prev.onOpenChange !== next.onOpenChange) return false;
  if (prev.onSelectPet !== next.onSelectPet) return false;
  return true;
});
