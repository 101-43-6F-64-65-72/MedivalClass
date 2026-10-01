'use client';

import React, { useState, useEffect } from 'react';

/**
 * Player Component
 * Renders 72x72 RPG Maker MZ sprite sheet ($Char_XXX.png: 216x288px)
 * Properly scaled to 48x48px with accurate walk cycle and direction
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
  };

  const isLocalPlayer = typeof props.isLocalPlayer !== 'undefined' 
    ? props.isLocalPlayer 
    : (typeof props.isLocal !== 'undefined' ? props.isLocal : false);

  // Walk animation frame cycle: 0 -> 1 -> 2 -> 1
  const [walkStep, setWalkStep] = useState(1);

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
      {/* SPRITE CONTAINER - 48x48 */}
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

      {/* NAME TAG */}
      <div
        className="whitespace-nowrap mt-1 text-center pointer-events-none flex justify-center"
      >
        <div 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold shadow-lg"
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: player.isAdmin ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.25)',
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
    </div>
  );
}
