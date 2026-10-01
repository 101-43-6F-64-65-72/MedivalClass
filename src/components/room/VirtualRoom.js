"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MAP_OBJECTS, DECORATIVE_ASSETS, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import GameObject from './GameObject';
import RoomSprite from './RoomSprite';
import Player from './Player';
import PresentationScreen from './PresentationScreen';
import QeebosNPC from './QeebosNPC';
import ImanuelNPC from './ImanuelNPC';
import KrisnaNPC from './KrisnaNPC';
import DzakihNPC from './DzakihNPC';
import SamNPC from './SamNPC';
import CircularEmoteMenu from './CircularEmoteMenu';
import ChatBox from './ChatBox';
import PetCompanion, { CAT_BREEDS } from './PetCompanion';
import NpcTracker, { CLASSROOM_NPCS } from './NpcTracker';
import AdminPanel from '@/components/admin/AdminPanel';
import BookshelfModal from './BookshelfModal';
import GameSubmissionModal from './GameSubmissionModal';
import AnnouncementOverlay from './AnnouncementOverlay';
import StudentPresenterModal from './StudentPresenterModal';
import { usePresentation } from '@/hooks/usePresentation';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Copy, Check, Edit2, Users, School, ChevronDown, ChevronUp, Navigation, ShieldCheck, Sparkles, BookOpen, UserPlus, X } from 'lucide-react';

export default function VirtualRoom({ 
  username, 
  fullName, 
  attendanceNo, 
  studentClass = 'XI PPLG-B',
  roomCode, 
  initialRoomName, 
  characterIndex = 1, 
  color, 
  isAdmin = false, 
  isCreator = false,
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
  const [isSamOpen, setIsSamOpen] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [localPetBreed, setLocalPetBreed] = useState(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackedNpcId, setActiveTrackedNpcId] = useState(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const zoom = 1.15; // Optimal POV zoom for 3/4 classroom perspective

  // Bookshelf and Game Submissions Modals state
  const [isBookshelfModalOpen, setIsBookshelfModalOpen] = useState(false);
  const [selectedBookshelfClass, setSelectedBookshelfClass] = useState('XI PPLG-B');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Shared Presentation & Screen Sharing instance for both Whiteboard and Admin Panel
  const presentation = usePresentation({
    isAdmin,
    presenterName: fullName || username || (isAdmin ? 'Guru Pengajar' : 'Siswa'),
  });

  // Check if current student is designated by admin as presenter
  const isDesignatedPresenter = Boolean(
    presentation.designatedPresenter &&
    (
      (myId && presentation.designatedPresenter.id === myId) ||
      (attendanceNo && String(presentation.designatedPresenter.attendanceNo) === String(attendanceNo)) ||
      (username && presentation.designatedPresenter.username?.toLowerCase() === username.toLowerCase())
    )
  );
  
  // Disable player movement while modals are active or teacher forces fullscreen focus
  const isModalBlocking = 
    isPresentationActive || 
    isQeebosOpen || 
    isImanuelOpen || 
    isKrisnaOpen || 
    isDzakihOpen || 
    isSamOpen || 
    isBookshelfModalOpen || 
    isSubmissionModalOpen ||
    isDesignatedPresenter ||
    presentation.isForcedFullscreen; // Freeze movement when admin locks fullscreen focus

  const localPlayer = usePlayerControls(undefined, undefined, !isModalBlocking);

  // Initialize multiplayer with room metadata & shared universe cross-group presence
  const { 
    players: remotePlayers, 
    myId,
    connected, 
    isRoomFull, 
    playerCount, 
    myGroupCount,
    roomName, 
    updateRoomName,
    gameStarted,
    hasAdminOnline,
    startGame,
    // Room join approval
    pendingJoinRequests,
    handleApproveJoin,
    handleRejectJoin,
    // Admin & Spotlight
    spotlightPlayer,
    setSpotlight,
    activeClass,
    changeActiveClass,
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
    { fullName, attendanceNo, studentClass, roomCode, roomName: initialRoomName, characterIndex, isAdmin, isCreator }
  );

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectPet = useCallback((breedId) => {
    setLocalPetBreed(breedId);
    updatePet(breedId);
    setShowPetModal(false);
  }, [updatePet]);

  const handleOpenPresentation = useCallback(() => {
    setIsPresentationFocused(true);
  }, []);

  const handleOpenSubmission = useCallback(() => {
    setIsSubmissionModalOpen(true);
  }, []);

  const handleOpenBookshelf = useCallback((targetCls) => {
    if (targetCls) setSelectedBookshelfClass(targetCls);
    setIsBookshelfModalOpen(true);
  }, []);

  const handleSaveRoomName = (e) => {
    e.preventDefault();
    const cleanName = editingNameInput.trim();
    if (!cleanName) {
      setIsEditingName(false);
      return;
    }

    // Prevent duplicate group name with other existing groups
    const isDuplicate = remotePlayers.some((p) => {
      const isOtherGroup = p.roomCode && p.roomCode.trim().toUpperCase() !== roomCode.trim().toUpperCase();
      return isOtherGroup && p.roomName && p.roomName.trim().toLowerCase() === cleanName.toLowerCase();
    });

    if (isDuplicate) {
      alert(`Nama kelompok "${cleanName}" sudah digunakan oleh kelompok lain! Silakan gunakan nama kelompok yang berbeda.`);
      return;
    }

    updateRoomName(cleanName);
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

  // Proximity to West Bookshelves (XI PPLG-A)
  const isNearWestShelf = Boolean(
    localPlayer &&
    localPlayer.x <= 230 &&
    localPlayer.y >= 120 &&
    localPlayer.y <= 750
  );

  // Proximity to East Bookshelves (XI PPLG-B)
  const isNearEastShelf = Boolean(
    localPlayer &&
    localPlayer.x >= 1520 &&
    localPlayer.y >= 120 &&
    localPlayer.y <= 750
  );

  // Keyboard shortcut listener to interact with Bookshelves via 'R' or 'B' (distinct from NPC key 'E')
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isInput) return;

      if ((e.key === 'r' || e.key === 'R' || e.key === 'b' || e.key === 'B') && !isModalBlocking) {
        if (isNearWestShelf) {
          e.preventDefault();
          setSelectedBookshelfClass('XI PPLG-A');
          setIsBookshelfModalOpen(true);
        } else if (isNearEastShelf) {
          e.preventDefault();
          setSelectedBookshelfClass('XI PPLG-B');
          setIsBookshelfModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNearWestShelf, isNearEastShelf, isModalBlocking]);

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
        className="absolute top-0 left-0 shadow-2xl"
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
                isFocused={isPresentationFocused}
                setIsFocused={setIsPresentationFocused}
                onFocusChange={setIsPresentationActive}
                isAdmin={isAdmin}
                presenterName={fullName || username || (isAdmin ? 'Guru Pengajar' : 'Siswa')}
                presentation={presentation}
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

        {/* Bookshelf Identity Signs at Side of Bookshelves (Clearly Visible in Aisle) */}
        <div 
          className="absolute z-30 pointer-events-none select-none"
          style={{ left: '180px', top: '210px' }}
        >
          <div className="pixel-panel-gold px-2.5 py-1 text-[10px] font-black text-amber-950 uppercase tracking-wider shadow-lg border border-amber-900 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen className="w-3 h-3 text-amber-900" />
            <span>Rak Buku XI PPLG-A</span>
          </div>
        </div>

        <div 
          className="absolute z-30 pointer-events-none select-none"
          style={{ left: '1620px', top: '210px', transform: 'translate(-100%, 0)' }}
        >
          <div className="pixel-panel-gold px-2.5 py-1 text-[10px] font-black text-amber-950 uppercase tracking-wider shadow-lg border border-amber-900 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen className="w-3 h-3 text-amber-900" />
            <span>Rak Buku XI PPLG-B</span>
          </div>
        </div>

        {/* Proximity Interaction Prompts at Side of Bookshelves [R] */}
        {isNearWestShelf && !isModalBlocking && (
          <div 
            className="absolute z-40 pointer-events-auto cursor-pointer animate-bounce-short"
            style={{ left: '180px', top: '250px' }}
            onClick={() => {
              setSelectedBookshelfClass('XI PPLG-A');
              setIsBookshelfModalOpen(true);
            }}
          >
            <div className="pixel-panel-wood px-2.5 py-1 text-amber-100 flex items-center gap-1.5 shadow-2xl border border-amber-600 whitespace-nowrap">
              <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2">R</span>
              <span className="text-[11px] font-bold text-amber-200">Tekan R untuk Buka Rak Buku XI PPLG-A</span>
            </div>
          </div>
        )}

        {isNearEastShelf && !isModalBlocking && (
          <div 
            className="absolute z-40 pointer-events-auto cursor-pointer animate-bounce-short"
            style={{ left: '1620px', top: '250px', transform: 'translate(-100%, 0)' }}
            onClick={() => {
              setSelectedBookshelfClass('XI PPLG-B');
              setIsBookshelfModalOpen(true);
            }}
          >
            <div className="pixel-panel-wood px-2.5 py-1 text-amber-100 flex items-center gap-1.5 shadow-2xl border border-amber-600 whitespace-nowrap">
              <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2">R</span>
              <span className="text-[11px] font-bold text-amber-200">Tekan R untuk Buka Rak Buku XI PPLG-B</span>
            </div>
          </div>
        )}
        
        {/* Render Remote Students / Players and their Pets */}
        {remotePlayers.map((p) => {
          const isPlayerSpotlighted = Boolean(
            spotlightPlayer && (
              spotlightPlayer.id === p.id ||
              (p.attendanceNo && String(spotlightPlayer.attendanceNo) === String(p.attendanceNo))
            )
          );
          return (
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
                isSpotlighted={isPlayerSpotlighted}
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
          );
        })}

        {/* Render Local Student / Player */}
        {(() => {
          const isLocalSpotlighted = Boolean(
            spotlightPlayer && (
              spotlightPlayer.id === myId ||
              (attendanceNo && String(spotlightPlayer.attendanceNo) === String(attendanceNo))
            )
          );
          return (
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
              isSpotlighted={isLocalSpotlighted}
              isLocal={true}
            />
          );
        })()}

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

        {/* Physical Mentor NPC Qeebos (Rendered at east bookshelf aisle) */}
        <QeebosNPC 
          x={1715} 
          y={720} 
          localPlayer={localPlayer} 
          onOpenChange={setIsQeebosOpen} 
          isTracked={activeTrackedNpcId === 'npc-qeebos'}
        />

        {/* NPC Imanuel (Rendered on west aisle facing right, showcases AI Game example) */}
        <ImanuelNPC 
          x={95} 
          y={800} 
          localPlayer={localPlayer} 
          onOpenChange={setIsImanuelOpen} 
          isTracked={activeTrackedNpcId === 'npc-imanuel'}
        />

        {/* NPC Krisna (Rendered on stage platform, shares Canva presentation) */}
        <KrisnaNPC 
          x={730} 
          y={530} 
          localPlayer={localPlayer} 
          onOpenChange={setIsKrisnaOpen} 
          onOpenPresentation={handleOpenPresentation}
          isTracked={activeTrackedNpcId === 'npc-krisna'}
        />

        {/* NPC Dzakih (Rendered at student desk row 2, acts as the Pet Master & setting pet) */}
        <DzakihNPC 
          x={1250} 
          y={955} 
          localPlayer={localPlayer} 
          onOpenChange={setIsDzakihOpen} 
          localPetBreed={localPetBreed}
          onSelectPet={handleSelectPet}
          isTracked={activeTrackedNpcId === 'npc-dzakih'}
        />

        {/* NPC Sam (Rendered directly next to west wall clock, poetic mentor with task submission link) */}
        <SamNPC 
          x={135} 
          y={520} 
          localPlayer={localPlayer} 
          onOpenChange={setIsSamOpen} 
          isTracked={activeTrackedNpcId === 'npc-sam'}
          onOpenSubmission={handleOpenSubmission}
          onOpenBookshelf={handleOpenBookshelf}
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
      
      {/* Top Spotlight Announcement Banner */}
      {spotlightPlayer && !isPresentationActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pixel-panel-wood px-4 py-1.5 flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-xs font-bold text-amber-200">
            SOROTAN KELAS: <span className="text-white underline">{spotlightPlayer.username || spotlightPlayer.fullName}</span> {spotlightPlayer.attendanceNo ? `(#${spotlightPlayer.attendanceNo})` : ''}
          </span>
          <span className="text-[10px] font-mono pixel-btn-gold text-amber-950 px-1.5 py-0.2 font-bold pointer-events-none">
            {spotlightPlayer.roomCode}
          </span>
          {isAdmin && (
            <button
              onClick={() => setSpotlight(null)}
              className="pixel-btn-wood text-[9px] px-1.5 py-0.5 text-amber-300 ml-1 hover:text-white"
              title="Matikan Sorotan"
            >
              Hapus
            </button>
          )}
        </div>
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
              {roomName || 'Kelompok 1'}
            </span>
            <span className="font-mono text-[10px] text-amber-950 font-bold pixel-btn-gold px-1.5 py-0.2 pointer-events-none">
              {roomCode}
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                title="Buka Panel Admin / Pengajar"
                className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow animate-pulse"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
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
              title="Buka Informasi Kelompok"
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
                    {roomName || 'Kelompok 1'}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingNameInput(roomName || '');
                        setIsEditingName(true);
                      }}
                      title="Ubah Nama Kelompok"
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
                {isAdmin && (
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    title="Buka Panel Admin / Pengajar"
                    className="pixel-btn-gold text-[10px] px-2 py-0.5 text-amber-950 flex items-center gap-1 font-bold shadow-sm animate-pulse"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={() => setIsPresentationFocused(true)}
                  title="Buka Layar Presentasi Canva"
                  className="pixel-btn-gold text-[10px] px-2 py-0.5 text-amber-950 flex items-center gap-1 font-bold shadow-sm"
                >
                  <span>Presentasi</span>
                </button>
                <button
                  onClick={() => setIsTrackerOpen(prev => !prev)}
                  title="Buka Pelacak Lokasi NPC (Qeebos, Krisna, Imanuel, Sam, Dzakih)"
                  className="pixel-btn-wood text-[10px] px-2 py-0.5 text-amber-200 flex items-center gap-1 font-bold"
                >
                  <Navigation className="w-3 h-3 text-amber-400" />
                  <span>Lacak NPC</span>
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
            <h2 className="text-lg font-bold text-amber-300">Kelompok Sudah Penuh!</h2>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              Maaf, Kode Kelompok <span className="font-mono font-bold text-amber-300 tracking-wider">"{roomCode}"</span> sudah mencapai batas kapasitas <strong className="text-white">4/4 peserta</strong>. Silakan minta kode kelompok lain atau buat kelompok baru.
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

      {/* Pelacak Lokasi NPC (NPC Tracker) */}
      <NpcTracker
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        localPlayer={localPlayer}
        activeTrackedId={activeTrackedNpcId}
        onToggleTrack={(id) => setActiveTrackedNpcId(id)}
        camX={camX}
        camY={camY}
        zoom={zoom}
        viewport={viewport}
      />

      {/* Admin / Pengajar Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        activeClass={activeClass}
        onSelectClass={changeActiveClass}
        players={remotePlayers}
        localPlayerInfo={{
          id: myId,
          username,
          fullName,
          attendanceNo,
          studentClass: activeClass,
          roomCode,
          roomName,
          characterIndex,
          isAdmin,
        }}
        spotlightPlayer={spotlightPlayer}
        onSetSpotlight={setSpotlight}
        presentation={presentation}
      />

      {/* Rak Buku Karya Game Modal */}
      <BookshelfModal
        isOpen={isBookshelfModalOpen}
        onClose={() => setIsBookshelfModalOpen(false)}
        targetClass={selectedBookshelfClass}
        onOpenSubmit={() => {
          setIsBookshelfModalOpen(false);
          setIsSubmissionModalOpen(true);
        }}
      />

      {/* Setor Link Game Modal */}
      <GameSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        studentInfo={{
          fullName,
          username,
          attendanceNo,
          studentClass: activeClass,
          roomCode,
          roomName,
        }}
        onSubmitted={() => {
          setSelectedBookshelfClass(activeClass);
          setIsBookshelfModalOpen(true);
        }}
      />

      {/* Modal Konfirmasi Izin Bergabung Kelompok untuk Pembuat Room (Host) */}
      {pendingJoinRequests && pendingJoinRequests.length > 0 && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md pixel-panel-wood p-5 text-amber-100 shadow-2xl border-2 border-amber-600 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#5c3416] pb-2">
              <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="font-bold text-sm text-amber-200">
                Permintaan Bergabung Kelompok ({pendingJoinRequests.length})
              </h3>
            </div>

            <div className="pixel-box-inset p-3 bg-[#180a03] space-y-1.5 text-xs">
              <div className="text-amber-300 font-bold text-sm">
                {pendingJoinRequests[0].applicant?.fullName || pendingJoinRequests[0].applicant?.username || 'Siswa'}
              </div>
              <div className="text-[11px] text-amber-400 font-mono">
                Absen: #{pendingJoinRequests[0].applicant?.attendanceNo || '-'} | Kelas: {pendingJoinRequests[0].applicant?.studentClass || activeClass}
              </div>
              <p className="text-[11px] text-amber-200/80 pt-1">
                Ingin bergabung ke kelompok Anda (<strong>{roomName}</strong>, Kode: <strong className="font-mono text-amber-300">{roomCode}</strong>).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRejectJoin(pendingJoinRequests[0].requestId)}
                className="pixel-btn-wood text-xs px-3 py-1.5 font-bold text-red-300 hover:text-white"
              >
                Tolak
              </button>
              <button
                type="button"
                onClick={() => handleApproveJoin(pendingJoinRequests[0].requestId)}
                className="pixel-btn-gold text-xs px-4 py-1.5 font-black text-amber-950 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Terima / Izinkan Masuk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Overlay (Top Marquee Banner or Center Bounce Popup) */}
      <AnnouncementOverlay
        announcement={presentation.activeAnnouncement}
        onDismiss={presentation.clearAnnouncement}
      />

      {/* Designated Student Presenter Interactive Modal */}
      <StudentPresenterModal
        isOpen={isDesignatedPresenter}
        designatedData={presentation.designatedPresenter}
        onClose={presentation.revokePresenter}
        onConfirmShowGame={(submission) => {
          if (submission?.game_url) {
            presentation.changePresentationUrl(submission.game_url);
            presentation.setGameSubmission(submission);
            setIsPresentationFocused(true);
          }
        }}
        onStartShareScreen={(submission) => {
          if (submission) {
            presentation.setGameSubmission(submission);
          }
          presentation.startScreenShare();
          setIsPresentationFocused(true);
        }}
        onRevokePresenter={presentation.revokePresenter}
      />

    </div>
  );
}
