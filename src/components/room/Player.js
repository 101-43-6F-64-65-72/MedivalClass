'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { CLASSROOM_EMOTES } from './CircularEmoteMenu';

/**
 * Player Component
 * Renders 72x72 RPG Maker MZ sprite sheet ($Char_XXX.png: 216x288px)
 * Scaled to 48x48px with accurate walk cycle, 4-direction offsets,
 * realtime speech bubbles, emote reaction bubbles, and group nametags.
 */
function Player(props) {
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
  const isSpotlighted = Boolean(props.isSpotlighted);

  // Walk animation frame cycle: 0 -> 1 -> 2 -> 1
  const [walkStep, setWalkStep] = useState(1);

  // Active Emote Bubble State (auto-clears after 2.8s)
  const [activeEmote, setActiveEmote] = useState(null);

  // Overhead Chat Speech Bubbles State (Max 2 stacked bubbles)
  const [chatBubbles, setChatBubbles] = useState([]);
  const processedBubblesRef = useRef(new Set());
  const bubbleTimersRef = useRef(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      bubbleTimersRef.current.forEach((t) => clearTimeout(t));
      bubbleTimersRef.current.clear();
    };
  }, []);

  // Handle incoming emote reactions (stays active for 4.5s)
  useEffect(() => {
    const incoming = props.emote || player.emote;
    if (!incoming) return;

    const emoteId = typeof incoming === 'string' ? incoming : incoming.id;
    const found = CLASSROOM_EMOTES.find((e) => e.id === emoteId);
    if (found) {
      setActiveEmote(found);
      const timer = setTimeout(() => {
        setActiveEmote(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [props.emote, player.emote]);

  // Handle incoming chat speech bubbles (stays active for 12s, stacked max 2)
  useEffect(() => {
    const incomingChat = props.chatBubble || player.chatBubble;
    if (!incomingChat || !incomingChat.text) return;

    const bubbleId = incomingChat.id || `${incomingChat.time || Date.now()}-${incomingChat.text}`;
    if (processedBubblesRef.current.has(bubbleId)) return;
    processedBubblesRef.current.add(bubbleId);

    // Keep memory cache size bounded
    if (processedBubblesRef.current.size > 50) {
      const arr = Array.from(processedBubblesRef.current);
      processedBubblesRef.current = new Set(arr.slice(-20));
    }

    const newBubble = {
      id: bubbleId,
      text: incomingChat.text,
      time: incomingChat.time || Date.now(),
    };

    // Keep at most 2 stacked bubbles (oldest is dropped if a 3rd arrives)
    setChatBubbles((prev) => {
      const filtered = prev.filter((b) => b.id !== bubbleId);
      return [...filtered, newBubble].slice(-2);
    });

    // 12 seconds lifetime so it's not too short!
    const BUBBLE_LIFETIME = 12000;
    const timer = setTimeout(() => {
      setChatBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      bubbleTimersRef.current.delete(bubbleId);
    }, BUBBLE_LIFETIME);

    bubbleTimersRef.current.set(bubbleId, timer);
  }, [props.chatBubble, player.chatBubble]);

  // Continuous animation frame ticker (120ms) for walking and idle breathing
  useEffect(() => {
    const interval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 24);
    }, 120);
    return () => clearInterval(interval);
  }, []);

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

  // CHARACTER RESOLUTION:
  // 1-6: RPG Maker MZ Characters ($Char_001 to $Char_006)
  // 7: Tiny RPG Soldier
  // 8: Tiny RPG Orc
  const rawIdx = typeof player.characterIndex === 'number' ? player.characterIndex : 1;
  const isTinyRpgSoldier = rawIdx === 7;
  const isTinyRpgOrc = rawIdx === 8;
  const isTinyRpg = isTinyRpgSoldier || isTinyRpgOrc;

  // Tiny RPG sprite setup
  let tinyRpgUrl = '';
  let tinyRpgFrames = 6;
  if (isTinyRpgSoldier) {
    tinyRpgFrames = player.isMoving ? 8 : 6;
    tinyRpgUrl = player.isMoving 
      ? '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Soldier/Soldier with shadows/Soldier_Walk.png'
      : '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Soldier/Soldier with shadows/Soldier_Idle.png';
  } else if (isTinyRpgOrc) {
    tinyRpgFrames = player.isMoving ? 8 : 6;
    tinyRpgUrl = player.isMoving 
      ? '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Orc/Orc with shadows/Orc_Walk.png'
      : '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Orc/Orc with shadows/Orc_Idle.png';
  }

  const tinyRpgFrameIndex = walkStep % tinyRpgFrames;
  const tinyRpgFlip = player.direction === 'left';

  // RPG Maker MZ setup (default 1-6)
  const charIdx = ((rawIdx - 1) % 6) + 1;
  const charNum = String(Math.max(1, Math.min(6, charIdx))).padStart(3, '0');
  const rpgMakerSpriteUrl = `/assets/RPG Maker MZ (48x48)/characters/$Char_${charNum}.png`;

  const directionRowIndex = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  };
  const row = directionRowIndex[player.direction] !== undefined ? directionRowIndex[player.direction] : 0;
  const colSequence = [0, 1, 2, 1];
  const col = player.isMoving ? colSequence[walkStep % 4] : 1; // 1 is center standing frame

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
        zIndex: isSpotlighted ? 500 : (Math.floor(player.y) || 10),
        willChange: isLocalPlayer ? 'none' : 'left, top',
        transition: isLocalPlayer ? 'none' : 'left 0.06s linear, top 0.06s linear',
      }}
    >
      {/* ========================================================
          1. OVERHEAD REALTIME CHAT SPEECH BUBBLES & EMOTES (STACKED)
         ======================================================== */}
      {(chatBubbles.length > 0 || activeEmote) && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-1"
          style={{
            bottom: '82px',
            width: 'max-content',
            maxWidth: '220px',
          }}
        >
          {/* Active Emote sits at top of speech stack without disappearing */}
          {activeEmote && (
            <div 
              key={`emote-${activeEmote.id}`}
              className="relative select-none text-center"
              style={{
                animation: 'bubbleEntrance 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              }}
            >
              <div className="relative bg-[#fffdf2] border-2 border-[#2c1404] rounded-2xl px-2.5 py-1.5 shadow-xl flex items-center justify-center min-w-[38px] min-h-[36px]">
                <span className="text-xl sm:text-2xl leading-none select-none filter drop-shadow-sm font-emoji">
                  {activeEmote.icon}
                </span>
                {/* Pointer tail only if no chat bubbles below */}
                {chatBubbles.length === 0 && (
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#fffdf2] border-r-2 border-b-2 border-[#2c1404]"
                    style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Chat bubbles stack: oldest on top, newest on bottom */}
          {chatBubbles.map((bubble, index) => {
            const isLatest = index === chatBubbles.length - 1;
            return (
              <div 
                key={bubble.id}
                className="relative select-none text-center max-w-[210px] min-w-[50px]"
                style={{
                  animation: 'bubbleEntrance 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                }}
              >
                <div 
                  className={`relative px-3 py-1.5 rounded-2xl shadow-xl transition-all duration-200 ${
                    isLatest 
                      ? 'bg-[#fffdf2] text-[#2c1404] border-2 border-[#381c08] scale-100 z-20' 
                      : 'bg-[#faf6eb]/95 text-[#4a2610] border border-[#6b3815] scale-90 opacity-90 z-10'
                  }`}
                >
                  <p className="text-[11px] font-bold leading-tight break-words select-none font-sans">
                    {bubble.text}
                  </p>
                  {/* Speech bubble pointer - only on the latest (bottom-most) bubble */}
                  {isLatest && (
                    <div 
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#fffdf2] border-r-2 border-b-2 border-[#381c08]"
                      style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          CLEAN WAYPOINT LOCATION BEACON
         ======================================================== */}
      {isSpotlighted && (
        <>
          {/* Animated Waypoint Location Marker Pointing Down to Player */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none animate-bounce-short whitespace-nowrap">
            <div className="pixel-panel-gold px-2 py-0.5 text-[9px] font-black text-amber-950 flex items-center gap-1 shadow-lg border border-amber-900 tracking-wider">
              <MapPin className="w-3 h-3 text-amber-950 fill-amber-950" />
              <span>DI SINI</span>
            </div>
            {/* Downward triangle arrow */}
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-900 -mt-[1px]" />
          </div>

          {/* Clean Sonar / Radar Pulse Ring at feet */}
          <div 
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 pointer-events-none z-0"
            style={{ width: '48px', height: '18px' }}
          >
            {/* Inner target circle */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 bg-amber-400/20" />
            {/* Expanding radar ping wave */}
            <div className="absolute inset-0 rounded-full border border-amber-300 animate-ping opacity-75" />
          </div>
        </>
      )}

      {/* ========================================================
          2. CHARACTER SPRITE CONTAINER (48x48)
         ======================================================== */}
      <div
        className="relative mx-auto"
        style={{
          width: '48px',
          height: '48px',
          imageRendering: 'pixelated',
          overflow: 'hidden',
          filter: isSpotlighted ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
        }}
      >
        {isTinyRpg ? (
          /* Tiny RPG Soldier or Orc Sprite (properly scaled to match 48px character size) */
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundImage: `url('${tinyRpgUrl}')`,
              backgroundPosition: `${-tinyRpgFrameIndex * 140 - 46}px -46px`,
              backgroundSize: `${tinyRpgFrames * 140}px 140px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              transform: tinyRpgFlip ? 'scaleX(-1)' : 'scaleX(1)',
              transformOrigin: 'center center',
            }}
          />
        ) : (
          /* RPG Maker MZ Sprite (3 cols x 4 rows) */
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundImage: `url('${rpgMakerSpriteUrl}')`,
              backgroundPosition: `${bgX}px ${bgY}px`,
              backgroundSize: '144px 192px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        )}
      </div>

      {/* Shadow at feet */}
      <div 
        className="w-8 h-2.5 bg-black/45 rounded-full blur-[1px] mx-auto -mt-2" 
        style={{ pointerEvents: 'none' }}
      />

      {/* ========================================================
          4. MINIMALIST SLIM NAMETAG (ANTI-SLOP)
         ======================================================== */}
      <div className="whitespace-nowrap mt-1 pointer-events-none flex justify-center">
        <div 
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md shadow-md transition-all"
          style={{
            backgroundColor: isSpotlighted ? 'rgba(69, 26, 3, 0.92)' : 'rgba(15, 23, 42, 0.85)',
            color: player.isAdmin ? '#f87171' : '#f8fafc',
            border: isSpotlighted
              ? '1.5px solid #fbbf24'
              : player.isAdmin
              ? '1.5px solid rgba(239, 68, 68, 0.85)'
              : isSameRoom 
              ? '1px solid rgba(16, 185, 129, 0.65)' 
              : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isSpotlighted
              ? '0 0 14px rgba(251, 191, 36, 0.6)'
              : player.isAdmin
              ? '0 0 10px rgba(239, 68, 68, 0.45)'
              : isSameRoom 
              ? '0 2px 8px rgba(16, 185, 129, 0.18)' 
              : '0 2px 6px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Spotlight Location Tag */}
          {isSpotlighted && (
            <span className="text-[8px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded font-mono uppercase tracking-wider flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 fill-amber-950 inline" />
              <span>LOKASI</span>
            </span>
          )}

          {/* Subtle team star or role icon */}
          {player.isAdmin ? (
            <img 
              src="/assets/fantasy_pixelart_ui/icons/gold_star.png" 
              alt="Instruktur" 
              title="Instruktur" 
              className="w-3 h-3 image-pixelated shrink-0 inline-block" 
            />
          ) : isSameRoom ? (
            <img 
              src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" 
              alt="Teman Sekelompok" 
              title="Teman Sekelompok" 
              className="w-2.5 h-2.5 image-pixelated shrink-0 inline-block" 
            />
          ) : null}

          {/* Attendance number */}
          {player.attendanceNo && (
            <span className="text-amber-300 font-mono text-[9px] font-semibold">
              #{player.attendanceNo}
            </span>
          )}

          {/* Player name (Red for Admin) */}
          <span className={`font-semibold tracking-tight ${player.isAdmin ? 'text-red-400 font-bold drop-shadow' : 'text-slate-100'}`}>
            {player.username}
          </span>

          {/* Room / Group tag as sleek integrated badge */}
          {roomCode && (
            <span 
              className={`font-mono text-[8px] px-1 py-0.2 rounded font-semibold ${
                isSpotlighted
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : isSameRoom 
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-white/10 text-slate-300 border border-white/15'
              }`}
            >
              {roomCode}
            </span>
          )}
        </div>
      </div>

      {/* Inline Reaction & Bubble Entrance Animation */}
      <style jsx>{`
        @keyframes bubbleEntrance {
          0% { transform: translateY(8px) scale(0.85); opacity: 0; }
          70% { transform: translateY(-2px) scale(1.04); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .font-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
        }
      `}</style>
    </div>
  );
}

export default React.memo(Player);
