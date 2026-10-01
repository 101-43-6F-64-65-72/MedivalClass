'use client';

import React, { useState, useEffect } from 'react';
import { CLASSROOM_EMOTES } from './CircularEmoteMenu';

/**
 * Player Component
 * Renders 72x72 RPG Maker MZ sprite sheet ($Char_XXX.png: 216x288px)
 * Scaled to 48x48px with accurate walk cycle, 4-direction offsets,
 * realtime speech bubbles, emote reaction bubbles, and group nametags.
 */
export default function Player(props) {
  const player = props.player || {
    userId: props.id || props.userId,
    x: props.x || 0,
    y: props.y || 0,
    direction: props.direction || 'up',
    isMoving: !!props.isMoving,
    username: props.username || 'Siswa',
    fullName: props.fullName || '',
    attendanceNo: props.attendanceNo || '',
    characterIndex: props.characterIndex || 1,
    color: props.color,
    isAdmin: !!props.isAdmin,
    role: props.role || null,
    roomCode: props.roomCode || '',
  };

  const isLocalPlayer = typeof props.isLocalPlayer !== 'undefined' 
    ? props.isLocalPlayer 
    : (typeof props.isLocal !== 'undefined' ? props.isLocal : false);

  const roomCode = props.roomCode || player.roomCode || '';
  const localRoomCode = props.localRoomCode || '';
  const isSameRoom = Boolean(
    roomCode && localRoomCode && roomCode.trim().toUpperCase() === localRoomCode.trim().toUpperCase()
  );

  // Walk animation frame cycle: 0 -> 1 -> 2 -> 1
  const [walkStep, setWalkStep] = useState(1);

  // Active Emote Bubble State (auto-clears after 2.8s)
  const [activeEmote, setActiveEmote] = useState(null);

  // Active Overhead Chat Speech Bubble (auto-clears after 4.5s)
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const incoming = props.emote || player.emote;
    if (!incoming) return;

    const emoteId = typeof incoming === 'string' ? incoming : incoming.id;
    const found = CLASSROOM_EMOTES.find((e) => e.id === emoteId);
    if (found) {
      setActiveEmote(found);
      const timer = setTimeout(() => {
        setActiveEmote(null);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [props.emote, player.emote]);

  useEffect(() => {
    const incomingChat = props.chatBubble || player.chatBubble;
    if (!incomingChat || !incomingChat.text) return;

    setActiveChat(incomingChat.text);
    const timer = setTimeout(() => {
      setActiveChat(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [props.chatBubble, player.chatBubble]);

  useEffect(() => {
    if (!player.isMoving) {
      setWalkStep(1); // Idle pose (center frame)
      return;
    }
    const interval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 140);
    return () => clearInterval(interval);
  }, [player.isMoving]);

  // Screen/world position
  let posX = player.x;
  let posY = player.y;

  if (typeof props.cameraOffsetX === 'number' && typeof props.screenCenterX === 'number') {
    posX = props.screenCenterX + (player.x - props.cameraOffsetX);
    posY = (props.screenCenterY || 0) + (player.y - (props.cameraOffsetY || 0));

    const isInViewport = posX > -100 && posX < 1400 && posY > -100 && posY < 900;
    if (!isInViewport && !isLocalPlayer) {
      return null;
    }
  }

  // SPRITE URL - map character index (1-6)
  const charIdx = typeof player.characterIndex === 'number' 
    ? ((player.characterIndex - 1) % 6) + 1
    : ((typeof player.color === 'number' ? player.color % 6 : 0) + 1);
  const charNum = String(Math.max(1, Math.min(6, charIdx))).padStart(3, '0');
  const spriteUrl = `/assets/RPG Maker MZ (48x48)/characters/$Char_${charNum}.png`;

  // RPG Maker MZ Sprite Sheet: 216 x 288 px (3 cols x 4 rows of 72x72px)
  // Scaled to 48x48px on screen: backgroundSize is 144px x 192px (48/72 = 2/3 scale)
  const directionRowIndex = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  };
  const row = directionRowIndex[player.direction] !== undefined ? directionRowIndex[player.direction] : 0;
  const colSequence = [0, 1, 2, 1];
  const col = player.isMoving ? colSequence[walkStep] : 1; // 1 is center standing frame

  const bgX = -col * 48;
  const bgY = -row * 48;

  return (
    <div
      key={player.userId || player.id || `player-${player.username}`}
      className="absolute select-none pointer-events-none"
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        transform: 'translate(-50%, -100%)', // Anchor at player's feet
        zIndex: Math.floor(player.y) || 10,
        willChange: isLocalPlayer ? 'none' : 'transform',
        transition: isLocalPlayer ? 'none' : 'all 0.05s linear',
      }}
    >
      {/* ========================================================
          1. OVERHEAD REALTIME CHAT SPEECH BUBBLE
         ======================================================== */}
      {activeChat && (
        <div 
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[190px] min-w-[60px]"
          style={{
            animation: 'bubbleSpringPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
          }}
        >
          <div className="relative bg-[#fffdf2] text-[#2c1404] border-2 border-[#381c08] rounded-2xl px-3 py-1.5 shadow-xl text-center">
            <p className="text-[11px] font-bold leading-tight break-words select-none font-sans">
              {activeChat}
            </p>
            {/* Speech bubble pointer */}
            <div 
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#fffdf2] border-r-2 border-b-2 border-[#381c08]"
              style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          2. EMOTE REACTION BUBBLE
         ======================================================== */}
      {activeEmote && !activeChat && (
        <div 
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            animation: 'bubbleSpringPop 2.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          <div className="relative bg-[#fffdf2] border-2 border-[#2c1404] rounded-2xl px-2.5 py-1.5 shadow-xl flex items-center justify-center min-w-[38px] min-h-[36px]">
            <span className="text-xl sm:text-2xl leading-none select-none filter drop-shadow-sm font-emoji">
              {activeEmote.icon}
            </span>
            {/* Speech bubble pointy pointer tail */}
            <div 
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#fffdf2] border-r-2 border-b-2 border-[#2c1404]"
              style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          3. CHARACTER SPRITE CONTAINER (48x48)
         ======================================================== */}
      <div
        className="relative mx-auto"
        style={{
          width: '48px',
          height: '48px',
          imageRendering: 'pixelated',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundImage: `url('${spriteUrl}')`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            backgroundSize: '144px 192px',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Shadow at feet */}
      <div 
        className="w-8 h-2.5 bg-black/45 rounded-full blur-[1px] mx-auto -mt-2" 
        style={{ pointerEvents: 'none' }}
      />

      {/* ========================================================
          4. NAMETAG WITH ROOM / KELOMPOK DISTINCTION
         ======================================================== */}
      <div className="whitespace-nowrap mt-1 text-center pointer-events-none flex flex-col items-center gap-0.5">
        {/* Room / Kelompok Tag */}
        {roomCode && (
          <div
            className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold tracking-wide shadow-sm flex items-center gap-1 border ${
              isSameRoom
                ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/90 shadow-emerald-900/40'
                : 'bg-indigo-950/95 text-indigo-300 border-indigo-500/90 shadow-indigo-900/40'
            }`}
          >
            <span>{isSameRoom ? '⭐' : '🏷️'}</span>
            <span>{roomCode}</span>
            {isSameRoom && <span className="text-[8px] text-emerald-400 font-sans font-normal">(Kelompok)</span>}
          </div>
        )}

        {/* Main Name Badge */}
        <div 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold shadow-lg"
          style={{
            backgroundColor: isSameRoom ? '#062015' : '#0f172a',
            color: '#ffffff',
            border: player.isAdmin 
              ? '2px solid #fbbf24' 
              : isSameRoom 
                ? '1.5px solid #10b981' 
                : '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          {isLocalPlayer && <span className="text-emerald-400">👤</span>}
          {player.attendanceNo && (
            <span className="text-amber-400 font-mono">#{player.attendanceNo}</span>
          )}
          <span>{player.username}</span>
          {player.isAdmin && (
            <span title="Instruktur / Guru" className="text-amber-400">👑</span>
          )}
        </div>
      </div>

      {/* Inline Reaction & Bubble Spring Bounce Animation */}
      <style jsx>{`
        @keyframes bubbleSpringPop {
          0% { transform: translate(-50%, 12px) scale(0); opacity: 0; }
          22% { transform: translate(-50%, -6px) scale(1.2); opacity: 1; }
          38% { transform: translate(-50%, 0px) scale(0.96); opacity: 1; }
          50% { transform: translate(-50%, -1px) scale(1); opacity: 1; }
          82% { transform: translate(-50%, -1px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -16px) scale(0.85); opacity: 0; }
        }
        .font-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
        }
      `}</style>
    </div>
  );
}
