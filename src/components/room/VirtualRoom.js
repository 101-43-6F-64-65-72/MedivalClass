"use client";

import React, { useRef, useEffect, useState } from 'react';
import { MAP_OBJECTS, DECORATIVE_ASSETS, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import GameObject from './GameObject';
import RoomSprite from './RoomSprite';
import Player from './Player';
import PresentationScreen from './PresentationScreen';
import ChatbotWidget from './ChatbotWidget';
import CircularEmoteMenu from './CircularEmoteMenu';
import ChatBox from './ChatBox';
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
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const zoom = 1.15; // Optimal POV zoom for 3/4 classroom perspective
  
  // Initialize local player with dynamic safe spawn in entrance aisle, disabled when presentation is fullscreen
  const localPlayer = usePlayerControls(undefined, undefined, !isPresentationActive);

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
        
        {/* Render Remote Students / Players */}
        {remotePlayers.map((p) => (
          <Player 
            key={p.id}
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
          <div className="fixed top-4 left-4 bg-[#261408]/95 text-amber-100 px-3 py-1.5 rounded-xl border border-[#8c5324] shadow-xl z-40 backdrop-blur-md flex items-center gap-2 animate-in fade-in duration-150">
            <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-xs text-amber-200 truncate max-w-[120px]">{roomName || 'Kelas Virtual'}</span>
            <span className="font-mono text-[10px] text-amber-400 font-bold bg-[#421d05] px-1.5 py-0.5 rounded border border-amber-700/80">
              {roomCode}
            </span>
            <button
              onClick={() => setIsHudCollapsed(false)}
              title="Buka Informasi Kelas"
              className="p-1 hover:bg-[#452108] rounded text-amber-300 transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="fixed top-4 left-4 bg-[#261408]/95 text-amber-100 px-3.5 py-2.5 rounded-2xl border-2 border-[#8c5324] shadow-2xl z-40 backdrop-blur-md flex flex-col gap-2 min-w-[280px] max-w-[320px] animate-in fade-in duration-200">
            {/* Room Name Header with Edit & Collapse Feature */}
            <div className="flex items-center justify-between border-b border-[#5c3416] pb-1.5">
              {!isEditingName ? (
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <School className="w-4 h-4 text-amber-400 shrink-0" />
                  <h1 className="font-bold text-xs text-amber-300 truncate" title={roomName}>
                    {roomName || 'Kelas Virtual'}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingNameInput(roomName || '');
                        setIsEditingName(true);
                      }}
                      title="Ubah Nama Kelas"
                      className="p-0.5 hover:bg-[#452108] rounded text-amber-400/70 hover:text-amber-200 transition shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
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
                    className="w-full bg-[#1b0d05] border border-amber-600 rounded px-2 py-0.5 text-xs text-amber-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-amber-950 text-[10px] px-2 py-0.5 rounded font-bold"
                  >
                    Simpan
                  </button>
                </form>
              )}

              {/* Collapse HUD Button */}
              <button
                onClick={() => setIsHudCollapsed(true)}
                title="Kecilkan Panel"
                className="p-0.5 ml-1 hover:bg-[#452108] rounded text-amber-300/70 hover:text-amber-100 transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Team / Class Code & Member Count */}
            <div className="flex items-center justify-between gap-2 border-b border-[#5c3416] pb-1.5">
              <div>
                <span className="text-[9px] text-amber-300/70 font-medium uppercase tracking-wider block">Kelompok Anda</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-amber-400 tracking-widest">{roomCode}</span>
                  <button
                    onClick={handleCopyCode}
                    title="Salin Kode Kelompok"
                    className="p-0.5 hover:bg-[#452108] rounded transition text-amber-400/80 hover:text-amber-200"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-[#421d05] text-amber-300 px-2 py-0.5 rounded-full border border-amber-700/80 shrink-0 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" />
                <span>{myGroupCount} Tim</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-200/90 font-normal">{playerCount} di Kelas</span>
              </span>
            </div>
            
            {/* User Presence & Role Status */}
            <div className="flex items-center justify-between text-[11px] text-amber-200/90">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {connected ? `${playerCount} Siswa` : 'Offline'}
              </span>
              <span className="text-amber-200/90 font-mono text-[10px] flex items-center gap-1">
                {isAdmin && <span title="Instruktur / Guru" className="text-amber-400">👑</span>}
                #{attendanceNo ? attendanceNo : '-'} {username}
              </span>
            </div>

            {/* Controls hint & Leave button */}
            <div className="pt-1 border-t border-[#5c3416] flex items-center justify-between text-[10px] text-amber-300/70">
              <span>WASD / Arrow</span>
              {onLeave && (
                <button
                  onClick={onLeave}
                  className="text-red-400 hover:text-red-300 text-[10px] underline font-medium"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl max-w-md w-full text-center shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-950 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-800 text-xl font-bold">
              🚫
            </div>
            <h2 className="text-xl font-bold text-white">Kelas Sudah Penuh!</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Maaf, Kode Kelas <span className="font-mono font-bold text-amber-400 tracking-wider">"{roomCode}"</span> sudah mencapai batas kapasitas <strong className="text-white">4/4 peserta</strong>. Silakan minta kode kelas lain atau buat room baru.
            </p>
            {onLeave && (
              <button
                onClick={onLeave}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition shadow-lg"
              >
                Kembali ke Menu Utama
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI NPC Chatbot Widget (Always available for students) */}
      <ChatbotWidget gameStarted={true} />
    </div>
  );
}
