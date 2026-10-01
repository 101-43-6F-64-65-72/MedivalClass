'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';

export const CLASSROOM_EMOTES = [
  { id: 'heart', label: 'Suka / Cinta', icon: '❤️', key: '1' },
  { id: 'thumbsup', label: 'Setuju / Siap', icon: '👍', key: '2' },
  { id: 'wave', label: 'Halo / Sapa', icon: '👋', key: '3' },
  { id: 'clap', label: 'Tepuk Tangan', icon: '👏', key: '4' },
  { id: 'bulb', label: 'Punya Ide', icon: '💡', key: '5' },
  { id: 'question', label: 'Tanya / Bingung', icon: '❓', key: '6' },
  { id: 'exclamation', label: 'Penting / Kaget', icon: '❗', key: '7' },
  { id: 'fire', label: 'Semangat', icon: '🔥', key: '8' },
];

export default function CircularEmoteMenu({ onSendEmote }) {
  const [isOpen, setIsOpen] = useState(false);
  const [centerPos, setCenterPos] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const mousePosRef = useRef({ x: 0, y: 0 });
  const centerPosRef = useRef({ x: 0, y: 0 });
  const hoveredIndexRef = useRef(null);
  const isOpenRef = useRef(false);

  // Keep refs in sync for event listeners
  useEffect(() => {
    centerPosRef.current = centerPos;
  }, [centerPos]);

  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex;
  }, [hoveredIndex]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Track global mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      // If wheel is currently open, calculate hovered slice by angle from center
      if (isOpenRef.current) {
        const dx = e.clientX - centerPosRef.current.x;
        const dy = e.clientY - centerPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Deadzone in the center (20px)
        if (distance > 20) {
          const angleRad = Math.atan2(dy, dx);
          let deg = (angleRad * 180) / Math.PI + 90;
          if (deg < 0) deg += 360;

          const total = CLASSROOM_EMOTES.length;
          const sliceAngle = 360 / total;
          const index = Math.floor(((deg + sliceAngle / 2) % 360) / sliceAngle);
          setHoveredIndex(index);
        } else {
          setHoveredIndex(null);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [cooldown, setCooldown] = useState(0);

  // Anti-spam cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleTriggerEmote = (id) => {
    if (cooldown > 0) return;
    onSendEmote(id);
    setCooldown(2); // 2 second anti-spam cooldown
  };

  // Listen to Q keydown (open wheel at mouse) and Q keyup (send hovered emote)
  useEffect(() => {
    const isTyping = () => {
      const active = document.activeElement;
      if (!active) return false;
      return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable;
    };

    const handleKeyDown = (e) => {
      if (isTyping()) return;

      // Numbers 1-8 as instant hotkeys
      const numMatch = CLASSROOM_EMOTES.find((item) => item.key === e.key);
      if (numMatch) {
        e.preventDefault();
        handleTriggerEmote(numMatch.id);
        setIsOpen(false);
        return;
      }

      // HOLD Q TO OPEN RADIAL WHEEL AT MOUSE
      if ((e.key === 'q' || e.key === 'Q') && !isOpenRef.current) {
        e.preventDefault();
        const mouseX = mousePosRef.current.x || window.innerWidth / 2;
        const mouseY = mousePosRef.current.y || window.innerHeight / 2;

        // Clamp to stay safely within viewport
        const clampedX = Math.max(90, Math.min(window.innerWidth - 90, mouseX));
        const clampedY = Math.max(90, Math.min(window.innerHeight - 90, mouseY));

        setCenterPos({ x: clampedX, y: clampedY });
        setHoveredIndex(null);
        setIsOpen(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (isOpenRef.current) {
          e.preventDefault();
          // If hovering over an emote when releasing Q, trigger it!
          if (hoveredIndexRef.current !== null) {
            const emote = CLASSROOM_EMOTES[hoveredIndexRef.current];
            if (emote) {
              handleTriggerEmote(emote.id);
            }
          }
          setIsOpen(false);
          setHoveredIndex(null);
        }
      }
    };

    const handleWindowBlur = () => {
      setIsOpen(false);
      setHoveredIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [onSendEmote]);

  // Radius of the emote wheel
  const radius = 74;
  const total = CLASSROOM_EMOTES.length;

  return (
    <>
      {/* ========================================================
          1. RADIAL WHEEL OVERLAY (Spawns at Mouse Cursor on Hold Q)
         ======================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none select-none">
          {/* Subtle dimming backdrop */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-100" />

          {/* Radial Wheel Container Centered at Mouse Position */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{
              left: `${centerPos.x}px`,
              top: `${centerPos.y}px`,
              width: '180px',
              height: '180px',
            }}
          >
            {/* Center Info Core */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 pixel-panel-gold flex flex-col items-center justify-center p-1 text-center transition-all duration-150 shadow-2xl">
                {hoveredIndex !== null ? (
                  <>
                    <span className="text-xl leading-none font-emoji animate-bounce">
                      {CLASSROOM_EMOTES[hoveredIndex].icon}
                    </span>
                    <span className="text-[8px] font-bold text-amber-950 truncate max-w-[48px] mt-0.5">
                      {CLASSROOM_EMOTES[hoveredIndex].label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-mono font-bold text-amber-950">Q</span>
                    <span className="text-[7px] text-amber-900 font-bold leading-tight">
                      Arahkan
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Circular Slices (8 Emotes) */}
            {CLASSROOM_EMOTES.map((item, index) => {
              const angleDeg = index * (360 / total) - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const x = Math.round(Math.cos(angleRad) * radius);
              const y = Math.round(Math.sin(angleRad) * radius);
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={item.id}
                  onPointerEnter={() => setHoveredIndex(index)}
                  onClick={() => {
                    handleTriggerEmote(item.id);
                    setIsOpen(false);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl cursor-pointer flex items-center justify-center shadow-2xl transition-all duration-150 ${
                    isHovered
                      ? 'scale-125 pixel-btn-gold z-20'
                      : 'scale-100 pixel-btn-wood z-10'
                  }`}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    animation: `radialSlicePop 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 15}ms both`,
                  }}
                >
                  <span className="text-xl select-none font-emoji filter drop-shadow">
                    {item.icon}
                  </span>
                  {/* Number key indicator */}
                  <span className="absolute -top-1.5 -right-1.5 bg-[#140802] text-amber-300 font-mono text-[8px] font-bold px-1 rounded border border-amber-700 pointer-events-none">
                    {item.key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          2. MINIMAL BOTTOM DOCK TRIGGER BUTTON [Q 😊]
         ======================================================== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
        <button
          onClick={() => {
            const mouseX = mousePosRef.current.x || window.innerWidth / 2;
            const mouseY = mousePosRef.current.y || window.innerHeight / 2;
            setCenterPos({
              x: Math.max(90, Math.min(window.innerWidth - 90, mouseX)),
              y: Math.max(90, Math.min(window.innerHeight - 90, mouseY)),
            });
            setHoveredIndex(null);
            setIsOpen((prev) => !prev);
          }}
          title="Tahan tombol Q atau klik untuk membuka menu emoticon"
          className="pixel-btn-wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shadow-xl"
        >
          <span className="pixel-btn-gold text-amber-950 font-mono text-[9px] px-1 py-0.2 pointer-events-none">
            Q
          </span>
          <img 
            src="/assets/fantasy_pixelart_ui/icons/gold_happy_face.png" 
            alt="Emote" 
            className="w-4 h-4 image-rendering-pixelated" 
          />
          <span className="text-[11px]">Reaksi</span>
        </button>
      </div>

      {/* Animation & Font Styling */}
      <style jsx>{`
        @keyframes radialSlicePop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          100% {
            opacity: 1;
          }
        }
        .font-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
        }
      `}</style>
    </>
  );
}
