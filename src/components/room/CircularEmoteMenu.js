'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smile, X } from 'lucide-react';

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
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  // Global hotkeys 1-8
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      const match = CLASSROOM_EMOTES.find((item) => item.key === e.key);
      if (match) {
        e.preventDefault();
        onSendEmote(match.id);
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSendEmote, isOpen]);

  const handleSelect = (id) => {
    onSendEmote(id);
    setIsOpen(false);
  };

  const radius = 72; // Distance from center
  const total = CLASSROOM_EMOTES.length;

  return (
    <div ref={menuRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="relative flex items-center justify-center">
        {/* Radial Emote Items (Displayed when Open) */}
        {isOpen && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {CLASSROOM_EMOTES.map((item, index) => {
              // Calculate angle around circle, starting from top (-90 degrees)
              const angleDeg = (index * (360 / total)) - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const x = Math.round(Math.cos(angleRad) * radius);
              const y = Math.round(Math.sin(angleRad) * radius);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={`${item.label} (Tekan ${item.key})`}
                  className="absolute pointer-events-auto w-11 h-11 rounded-full bg-[#2b170c] border-2 border-amber-600 hover:border-amber-300 text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-125 active:scale-95 group"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animation: `radialPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 25}ms both`,
                  }}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform filter drop-shadow font-emoji">
                    {item.icon}
                  </span>
                  {/* Shortcut key badge */}
                  <span className="absolute -top-1 -right-1 bg-[#1a0a03] text-amber-300 font-mono text-[8px] font-bold px-1 rounded-full border border-amber-600">
                    {item.key}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Central Circular Trigger Button */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          title={isOpen ? 'Tutup Menu Emoticon' : 'Buka Menu Emoticon (Tekan 1-8)'}
          className={`w-12 h-12 rounded-full border-2 shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isOpen
              ? 'bg-[#452108] border-amber-400 text-amber-200 rotate-90 scale-95'
              : 'bg-[#2b170c]/95 hover:bg-[#3d2010] border-amber-600 hover:border-amber-400 text-amber-300 hover:scale-105'
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Smile className="w-6 h-6" />}
        </button>
      </div>

      {/* Radial Animation Keyframe */}
      <style jsx>{`
        @keyframes radialPopIn {
          0% {
            opacity: 0;
            transform: translate(0px, 0px) scale(0.2);
          }
          100% {
            opacity: 1;
          }
        }
        .font-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
        }
      `}</style>
    </div>
  );
}
