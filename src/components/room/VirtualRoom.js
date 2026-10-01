"use client";

import React, { useRef, useEffect, useState } from 'react';
import { MAP_OBJECTS, DECORATIVE_ASSETS, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import GameObject from './GameObject';
import RoomSprite from './RoomSprite';
import Player from './Player';
import PresentationScreen from './PresentationScreen';
import QeebosNPC from './QeebosNPC';
import ImanuelNPC from './ImanuelNPC';
import KrisnaNPC from './KrisnaNPC';
import DzakihNPC from './DzakihNPC';
import CircularEmoteMenu from './CircularEmoteMenu';
import ChatBox from './ChatBox';
import PetCompanion, { CAT_BREEDS } from './PetCompanion';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Copy, Check, Edit2, Users, School, ChevronDown, ChevronUp } from 'lucide-react';

export default function VirtualRoom({ 
  username, 
  fullName, 
  attendanceNo, 
  roomCode, 
  initialRoomName, 
  characterIndex = 1, 
  color, 
  isAdmin = false, 
  onLeave 
}) {
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameInput, setEditingNameInput] = useState('');
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [isPresentationFocused, setIsPresentationFocused] = useState(false);
  const [isQeebosOpen, setIsQeebosOpen] = useState(false);
  const [isImanuelOpen, setIsImanuelOpen] = useState(false);
  const [isKrisnaOpen, setIsKrisnaOpen] = useState(false);
  const [isDzakihOpen, setIsDzakihOpen] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [localPetBreed, setLocalPetBreed] = useState(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const zoom = 1.15; // Optimal POV zoom for 3/4 classroom perspective
  
  // Initialize local player with dynamic safe spawn in entrance aisle, disabled when presentation or dialogue modal is open
  const localPlayer = usePlayerControls(undefined, undefined, !isPresentationActive && !isQeebosOpen && !isImanuelOpen && !isKrisnaOpen && !isDzakihOpen);

  // Initialize multiplayer with room metadata & shared universe cross-group presence
  const { 
    players: remotePlayers, 
    connected, 
    isRoomFull, 
    playerCount, 
    myGroupCount,
    roomName, 
    updateRoomName,
    gameStarted,
    hasAdminOnline,
    startGame,
    localEmote,
    remoteEmotes,
    sendEmote,
    chatMessages,
    localChatBubble,
    remoteChatBubbles,
    sendMessage,
    remotePets,
    updatePet,
  } = useMultiplayer(
    localPlayer, 
    username, 
    color, 
    { fullName, attendanceNo, roomCode, roomName: initialRoomName, characterIndex, isAdmin }
  );

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectPet = (breedId) => {
    setLocalPetBreed(breedId);
    updatePet(breedId);
    setShowPetModal(false);
  };

  const handleSaveRoomName = (e) => {
    e.preventDefault();
    if (editingNameInput.trim()) {
      updateRoomName(editingNameInput.trim());
    }
    setIsEditingName(false);
  };

  // Track window resize to ensure camera framing is always accurate
  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute camera position clamped within classroom boundaries
  const maxCamX = Math.max(0, ROOM_WIDTH - viewport.w / zoom);
  const maxCamY = Math.max(0, ROOM_HEIGHT - viewport.h / zoom);
  const targetCamX = localPlayer.x - (viewport.w / zoom) / 2 + 16;
  const targetCamY = localPlayer.y - (viewport.h / zoom) / 2 + 24;
  const camX = Math.max(0, Math.min(maxCamX, targetCamX));
  const camY = Math.max(0, Math.min(maxCamY, targetCamY));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* 2D Virtual Classroom Camera Layer */}
      <div 
        ref={containerRef}
        className="absolute top-0 left-0 shadow-2xl transition-transform duration-75 ease-out"
        style={{
          width: ROOM_WIDTH,
          height: ROOM_HEIGHT,
          transform: `translate3d(${-camX * zoom}px, ${-camY * zoom}px, 0) scale(${zoom})`,
          transformOrigin: 'top left',
          willChange: 'transform',
          backgroundColor: '#7a4c22',
          backgroundImage: "url('/assets/stardew_floor.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 96px',
        }}
      >
        {/* Render Modular Decorative Sprites (Stage platform accent) */}
        {DECORATIVE_ASSETS.map((asset) => {
          if (asset.type === 'carpet-stage') {
            return <GameObject key={asset.id} object={asset} />;
          }
          return (
            <RoomSprite
              key={asset.id}
              type={asset.type}
              x={asset.x}
              y={asset.y}
              width={asset.width}
              height={asset.height}
              zIndex={asset.zIndex}
            />
          );
        })}

        {/* Render Map Objects */}
        {MAP_OBJECTS.map((obj) => {
          if (obj.type === 'screen') {
            return (
              <PresentationScreen 
                key={obj.id} 
                object={obj} 
                localPlayer={localPlayer}
                isFocused={isPresentationFocused}
                setIsFocused={setIsPresentationFocused}
                onFocusChange={setIsPresentationActive}
              />
            );
          }
          if (obj.type === 'wall') {
            return <GameObject key={obj.id} object={obj} />;
          }
          return (
            <RoomSprite
              key={obj.id}
              type={obj.type}
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
            />
          );
        })}
        
        {/* Render Remote Students / Players and their Pets */}
        {remotePlayers.map((p) => (
          <React.Fragment key={p.id}>
            <Player 
              x={p.x} 
              y={p.y} 
              direction={p.direction}
              isMoving={p.isMoving}
              username={p.username}
              fullName={p.fullName}
              attendanceNo={p.attendanceNo}
              characterIndex={p.characterIndex || 1}
              isAdmin={p.isAdmin}
              color={p.color}
              roomCode={p.roomCode}
              localRoomCode={roomCode}
              emote={remoteEmotes[p.id]}
              chatBubble={remoteChatBubbles[p.id]}
              isLocal={false}
            />
            {remotePets[p.id] && (
              <PetCompanion
                ownerX={p.x}
                ownerY={p.y}
                ownerDirection={p.direction}
                ownerIsMoving={p.isMoving}
                ownerName={p.username}
                breedId={remotePets[p.id]}
                isLocal={false}
              />
            )}
          </React.Fragment>
        ))}

        {/* Render Local Student / Player */}
        <Player 
          x={localPlayer.x} 
          y={localPlayer.y} 
          direction={localPlayer.direction}
          isMoving={localPlayer.isMoving}
          username={username}
          fullName={fullName}
          attendanceNo={attendanceNo}
          characterIndex={characterIndex}
          isAdmin={isAdmin}
          color={color}
          roomCode={roomCode}
          localRoomCode={roomCode}
          emote={localEmote}
          chatBubble={localChatBubble}
          isLocal={true}
        />

        {/* Render Local Pet Companion if adopted */}
        {localPetBreed && (
          <PetCompanion
            ownerX={localPlayer.x}
            ownerY={localPlayer.y}
            ownerDirection={localPlayer.direction}
            ownerIsMoving={localPlayer.isMoving}
            ownerName={username}
            breedId={localPetBreed}
            isLocal={true}
          />
        )}

        {/* Physical Mentor NPC Qeebos (Rendered on stage carpet near teacher desk) */}
        <QeebosNPC 
          x={730} 
          y={530} 
          localPlayer={localPlayer} 
          onOpenChange={setIsQeebosOpen} 
        />

        {/* NPC Imanuel (Rendered on west aisle facing right, showcases AI Game example) */}
        <ImanuelNPC 
          x={95} 
          y={800} 
          localPlayer={localPlayer} 
          onOpenChange={setIsImanuelOpen} 
        />

        {/* NPC Krisna (Rendered at east bookshelf aisle, shares Canva presentation) */}
        <KrisnaNPC 
          x={1715} 
          y={720} 
          localPlayer={localPlayer} 
          onOpenChange={setIsKrisnaOpen} 
          onOpenPresentation={() => setIsPresentationFocused(true)}
        />

        {/* NPC Dzakih (Rendered at student desk row 2, acts funny / in his own world) */}
        <DzakihNPC 
          x={1250} 
          y={955} 
          localPlayer={localPlayer} 
          onOpenChange={setIsDzakihOpen} 
        />
      </div>

      {/* Radial Circular Emote Menu */}
      {!isPresentationActive && (
        <CircularEmoteMenu onSendEmote={sendEmote} />
      )}

      {/* Realtime In-Game Chat Box */}
      {!isPresentationActive && (
        <ChatBox
          messages={chatMessages}
          onSendMessage={sendMessage}
          currentRoomCode={roomCode}
          username={username}
        />
      )}
      
      {/* Classroom HUD Overlay (Hidden during Fullscreen Presentation) */}
      {!isPresentationActive && (
        isHudCollapsed ? (
          <div className="fixed top-4 left-4 pixel-panel-wood text-amber-100 px-3 py-1.5 z-40 flex items-center gap-2 animate-in fade-in duration-150">
            <img 
              src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" 
              alt="Kelas" 
              className="w-4 h-4 image-rendering-pixelated shrink-0" 
            />
            <span className="font-bold text-xs text-amber-200 truncate max-w-[120px]">
              {roomName || 'Kelas Virtual'}
            </span>
            <span className="font-mono text-[10px] text-amber-950 font-bold pixel-btn-gold px-1.5 py-0.2 pointer-events-none">
              {roomCode}
            </span>
            <button
              onClick={() => setIsPresentationFocused(true)}
              title="Buka Layar Presentasi Canva"
              className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow"
            >
              <span>Presentasi</span>
            </button>
            <button
              onClick={() => setShowPetModal(true)}
              title="Pilih Pet Kucing"
              className="pixel-btn-wood text-[10px] px-2 py-0.5 font-bold"
            >
              Pet
            </button>
            <button
              onClick={() => setIsHudCollapsed(false)}
              title="Buka Informasi Kelas"
              className="pixel-btn-wood w-6 h-6 p-0 shrink-0 ml-0.5"
            >
              <img 
                src="/assets/fantasy_pixelart_ui/arrows/gold_arrow_down_normal.png" 
                alt="Expand" 
                className="w-3.5 h-3.5 image-rendering-pixelated" 
              />
            </button>
          </div>
        ) : (
          <div className="fixed top-4 left-4 pixel-panel-wood text-amber-100 p-3 z-40 flex flex-col gap-2 min-w-[280px] max-w-[320px] animate-in fade-in duration-200">
            {/* Room Name Header with Edit & Collapse Feature */}
            <div className="flex items-center justify-between border-b border-[#5c3416] pb-1.5">
              {!isEditingName ? (
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <img 
                    src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" 
                    alt="Kelas" 
                    className="w-4 h-4 image-rendering-pixelated shrink-0" 
                  />
                  <h1 className="font-bold text-xs text-amber-200 truncate" title={roomName}>
                    {roomName || 'Kelas Virtual'}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingNameInput(roomName || '');
                        setIsEditingName(true);
                      }}
                      title="Ubah Nama Kelas"
                      className="pixel-btn-wood p-1 shrink-0 ml-1"
                    >
                      <Edit2 className="w-3 h-3 text-amber-300" />
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveRoomName} className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="text"
                    value={editingNameInput}
                    onChange={(e) => setEditingNameInput(e.target.value)}
                    autoFocus
                    className="w-full pixel-box-inset px-2 py-0.5 text-xs text-amber-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold"
                  >
                    Simpan
                  </button>
                </form>
              )}

              {/* Collapse HUD Button */}
              <button
                onClick={() => setIsHudCollapsed(true)}
                title="Kecilkan Panel"
                className="pixel-btn-wood w-6 h-6 p-0 shrink-0 ml-1"
              >
                <img 
                  src="/assets/fantasy_pixelart_ui/arrows/gold_arrow_up_normal.png" 
                  alt="Collapse" 
                  className="w-3.5 h-3.5 image-rendering-pixelated" 
                />
              </button>
            </div>

            {/* Team / Class Code & Member Count */}
            <div className="flex items-center justify-between gap-2 border-b border-[#5c3416] pb-1.5">
              <div>
                <span className="text-[9px] text-amber-300/70 font-medium uppercase tracking-wider block">Kelompok Anda</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-amber-300 tracking-widest">{roomCode}</span>
                  <button
                    onClick={handleCopyCode}
                    title="Salin Kode Kelompok"
                    className="pixel-btn-wood p-1"
                  >
                    {copied ? (
                      <img 
                        src="/assets/fantasy_pixelart_ui/icons/gold_tick.png" 
                        alt="Copied" 
                        className="w-3 h-3 image-rendering-pixelated" 
                      />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-300" />
                    )}
                  </button>
                </div>
              </div>
              <span className="text-[10px] font-bold pixel-btn-wood px-2 py-1 shrink-0 flex items-center gap-1 pointer-events-none">
                <img 
                  src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" 
                  alt="Tim" 
                  className="w-3 h-3 image-rendering-pixelated" 
                />
                <span>{myGroupCount} Tim</span>
                <span className="text-amber-500">•</span>
                <span className="text-amber-200/90 font-normal">{playerCount} di Kelas</span>
              </span>
            </div>
            
            {/* User Presence & Role Status */}
            <div className="flex items-center justify-between text-[11px] text-amber-200/90">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {connected ? `${playerCount} Siswa` : 'Offline'}
              </span>
              <span className="text-amber-200 font-mono text-[10px] flex items-center gap-1">
                {isAdmin && (
                  <img 
                    src="/assets/fantasy_pixelart_ui/icons/gold_star.png" 
                    alt="Admin" 
                    className="w-3 h-3 image-rendering-pixelated" 
                  />
                )}
                #{attendanceNo ? attendanceNo : '-'} {username}
              </span>
            </div>

            {/* Controls hint, Presentation button, Pet button & Leave button */}
            <div className="pt-1 border-t border-[#5c3416] flex items-center justify-between text-[10px] text-amber-300/70">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPresentationFocused(true)}
                  title="Buka Layar Presentasi Canva"
                  className="pixel-btn-gold text-[10px] px-2 py-0.5 text-amber-950 flex items-center gap-1 font-bold shadow-sm"
                >
                  <span>Presentasi</span>
                </button>
                <button
                  onClick={() => setShowPetModal(true)}
                  title="Pilih / Ganti Pet Kucing"
                  className="pixel-btn-wood text-[10px] px-2 py-0.5 text-amber-200 flex items-center gap-1 font-bold"
                >
                  <span>{localPetBreed ? CAT_BREEDS.find(c => c.id === localPetBreed)?.name.split(' ')[0] : 'Pet'}</span>
                </button>
              </div>

              {onLeave && (
                <button
                  onClick={onLeave}
                  className="pixel-btn-wood text-red-300 hover:text-red-100 text-[10px] px-2 py-0.5"
                >
                  Keluar
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Modal Peringatan Room Penuh (4/4) */}
      {isRoomFull && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="pixel-panel-wood text-amber-100 p-6 max-w-md w-full text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-950 text-red-400 rounded-full flex items-center justify-center mx-auto border-2 border-red-700 text-xl font-bold">
              <img 
                src="/assets/fantasy_pixelart_ui/icons/gold_cross.png" 
                alt="Penuh" 
                className="w-5 h-5 image-pixelated" 
              />
            </div>
            <h2 className="text-lg font-bold text-amber-300">Kelas Sudah Penuh!</h2>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              Maaf, Kode Kelas <span className="font-mono font-bold text-amber-300 tracking-wider">"{roomCode}"</span> sudah mencapai batas kapasitas <strong className="text-white">4/4 peserta</strong>. Silakan minta kode kelas lain atau buat room baru.
            </p>
            {onLeave && (
              <button
                onClick={onLeave}
                className="w-full py-2.5 pixel-btn-wood text-xs font-bold uppercase tracking-wider"
              >
                Kembali ke Menu Utama
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Adopsi Pet Kucing (All Cats Demo) */}
      {showPetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="pixel-panel-wood text-amber-100 p-5 max-w-lg w-full space-y-3.5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#5a3012] pb-2">
              <div>
                <h3 className="font-bold text-sm text-amber-300">Peliharaan Kucing (Pet Companion)</h3>
                <p className="text-[10px] text-amber-400/80">Kucing ini akan setia mengikutimu di dalam kelas virtual!</p>
              </div>
              <button
                onClick={() => setShowPetModal(false)}
                className="pixel-btn-wood px-2 py-1 text-xs"
              >
                <img
                  src="/assets/fantasy_pixelart_ui/icons/gold_cross.png"
                  alt="Close"
                  className="w-3.5 h-3.5 image-pixelated"
                />
              </button>
            </div>

            {/* Grid of Cats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto p-1">
              {CAT_BREEDS.map((cat) => {
                const isSelected = localPetBreed === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`pixel-box-inset p-2.5 flex flex-col items-center text-center gap-1.5 transition-all ${
                      isSelected ? 'border-amber-400 bg-amber-950/60 ring-1 ring-amber-400' : 'hover:border-amber-600/50'
                    }`}
                  >
                    {/* Animated Cat preview */}
                    <div className="w-10 h-10 flex items-center justify-center bg-amber-950/40 rounded-full border border-amber-800/40">
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
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-amber-200 truncate">{cat.name}</div>
                      <div className="text-[9px] text-amber-400/70 font-mono">All Cats Demo</div>
                    </div>
                    <button
                      onClick={() => handleSelectPet(cat.id)}
                      className={`w-full py-1 text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'pixel-btn-wood text-amber-300' : 'pixel-btn-gold'
                      }`}
                    >
                      {isSelected ? '✓ Dipakai' : 'Pilih Pet'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#5a3012] flex items-center justify-between gap-2">
              {localPetBreed && (
                <button
                  onClick={() => handleSelectPet(null)}
                  className="pixel-btn-silver text-xs px-3 py-1 font-semibold"
                >
                  Lepas Pet (Tanpa Kucing)
                </button>
              )}
              <button
                onClick={() => setShowPetModal(false)}
                className="pixel-btn-wood text-xs px-4 py-1 ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
