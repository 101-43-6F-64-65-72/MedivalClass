"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
import NetworkMonitor from './NetworkMonitor';
import AnnouncementOverlay from './AnnouncementOverlay';
import StudentPresenterModal from './StudentPresenterModal';
import DevTodoWidget from './DevTodoWidget';
import { playScrollOpen } from '@/lib/soundEffects';
import { usePresentation } from '@/hooks/usePresentation';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import TeamPromptVault from './TeamPromptVault';
import AdminAuraModal from './AdminAuraModal';
import { Copy, Check, Edit2, Users, School, ChevronDown, ChevronUp, Navigation, ShieldCheck, Sparkles, BookOpen, UserPlus, X, MapPin } from 'lucide-react';

export default function VirtualRoom({ 
  username, 
  fullName, 
  attendanceNo, 
  studentClass = 'XI PPLG-B', 
  roomCode, 
  initialRoomName, 
  groupNumber = null,
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
  const [isHudCollapsed, setIsHudCollapsed] = useState(true); // Default mini bar agar layar tidak penuh
  const [localPetBreed, setLocalPetBreed] = useState(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeTrackedNpcId, setActiveTrackedNpcId] = useState(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminAuraModalOpen, setIsAdminAuraModalOpen] = useState(false);
  const [isTeamVaultOpen, setIsTeamVaultOpen] = useState(false);
  const [lowLatencyMode, setLowLatencyMode] = useState(false);
  // Admin name editing state
  const [isEditingAdminName, setIsEditingAdminName] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState('');
  const [allDevDone, setAllDevDone] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('virtual_dev_todos') : null;
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return ['dev1', 'dev2', 'dev3', 'dev4'].every((k) => parsed[k]);
    } catch (_) { return false; }
  });
  const zoom = 1.15; // Optimal POV zoom for 3/4 classroom perspective

  // Bookshelf and Game Submissions Modals state
  const [isBookshelfModalOpen, setIsBookshelfModalOpen] = useState(false);
  const [selectedBookshelfClass, setSelectedBookshelfClass] = useState('XI PPLG-B');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Shared Presentation & Screen Sharing instance for both Whiteboard and Admin Panel
  const presentation = usePresentation({
    isAdmin,
    presenterName: isAdmin ? `Admin ${fullName || username || ''}`.trim() : (fullName || username || 'Siswa'),
  });

  // Check if current student is designated by admin as presenter
  const isDesignatedPresenter = Boolean(
    presentation.designatedPresenter &&
    (
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
    isTeamVaultOpen ||
    isAdminAuraModalOpen ||
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
    currentUsername,
    currentFullName,
    updatePlayerName,
    gameStarted,
    hasAdminOnline,
    startGame,
    // Admin & Spotlight
    spotlightPlayer,
    setSpotlight,
    activeClass,
    changeActiveClass,
    adminAura,
    updateAdminAura,
    localEmote,
    remoteEmotes,
    sendEmote,
    chatMessages,
    localChatBubble,
    remoteChatBubbles,
    sendMessage,
    remotePets,
    updatePet,
    pingMap,
    teamSharedPrompts,
    sharePromptData,
    deleteSharedPrompt,
    groupDevTodos,
    toggleGroupDevTodo,
    completedGroups,
    isMyGroupDevCompleted,
  } = useMultiplayer(
    localPlayer, 
    username, 
    color, 
    { fullName, attendanceNo, studentClass, roomCode, roomName: initialRoomName, groupNumber, characterIndex, isAdmin, isCreator }
  );

  // Security guard: Prohibit non-admin students from entering the Admin Room
  useEffect(() => {
    const clean = (roomCode || '').trim().toUpperCase();
    if (!isAdmin && (clean === 'ADMIN' || clean === 'ADMIN_ROOM' || clean === 'ADMINROOM' || clean.startsWith('ADMIN'))) {
      alert('Dilarang masuk ke Room Admin! Room ini khusus untuk Pengajar/Instruktur.');
      if (onLeave) onLeave();
    }
  }, [roomCode, isAdmin, onLeave]);

  // In Low Latency Mode, only render players from the same group (reduces realtime overhead)
  const visibleRemotePlayers = lowLatencyMode
    ? remotePlayers.filter((p) => (p.roomCode || '').toUpperCase() === (roomCode || '').toUpperCase())
    : remotePlayers;

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

  // Compute members of local student's group
  const myGroupMembers = useMemo(() => {
    const list = [];
    const myGroupCode = (roomCode || '').trim().toUpperCase();

    // 1. Local student
    list.push({
      id: myId,
      fullName: currentFullName || fullName,
      username: currentUsername || username,
      attendanceNo: attendanceNo || '',
      isSelf: true,
    });

    // 2. Teammates in same group
    if (Array.isArray(remotePlayers)) {
      remotePlayers.forEach((p) => {
        const pCode = (p.roomCode || '').trim().toUpperCase();
        if (myGroupCode && pCode === myGroupCode && !p.isAdmin) {
          list.push({
            id: p.id,
            fullName: p.fullName || p.username,
            username: p.username,
            attendanceNo: p.attendanceNo || '',
            isSelf: false,
          });
        }
      });
    }

    return list;
  }, [myId, fullName, username, currentFullName, currentUsername, attendanceNo, roomCode, remotePlayers]);

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

  const handleSaveAdminName = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = adminNameInput.trim();
    if (!clean) {
      setIsEditingAdminName(false);
      return;
    }
    updatePlayerName(clean);
    setIsEditingAdminName(false);
  };

  // Bookshelf coordinates on East and West sides
  const EAST_BOOKSHELVES = useMemo(() => [
    { id: 'shelf-e1', x: 1635, y: 150, centerY: 215 },
    { id: 'shelf-e2', x: 1635, y: 310, centerY: 375 },
    { id: 'shelf-e3', x: 1635, y: 560, centerY: 625 },
  ], []);

  const WEST_BOOKSHELVES = useMemo(() => [
    { id: 'shelf-w1', x: 45, y: 150, centerY: 215 },
    { id: 'shelf-w2', x: 45, y: 310, centerY: 375 },
    { id: 'shelf-w3', x: 45, y: 560, centerY: 625 },
  ], []);

  // Dynamically find bookshelf closest to player Y
  const nearestEastShelf = useMemo(() => {
    if (!localPlayer) return EAST_BOOKSHELVES[0];
    let closest = EAST_BOOKSHELVES[0];
    let minDist = Infinity;
    for (const s of EAST_BOOKSHELVES) {
      const dist = Math.abs(localPlayer.y - s.centerY);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }
    return closest;
  }, [localPlayer?.y, EAST_BOOKSHELVES]);

  const nearestWestShelf = useMemo(() => {
    if (!localPlayer) return WEST_BOOKSHELVES[0];
    let closest = WEST_BOOKSHELVES[0];
    let minDist = Infinity;
    for (const s of WEST_BOOKSHELVES) {
      const dist = Math.abs(localPlayer.y - s.centerY);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }
    return closest;
  }, [localPlayer?.y, WEST_BOOKSHELVES]);

  // Proximity to West Bookshelves (XI PPLG-A)
  const isNearWestShelf = Boolean(
    localPlayer &&
    localPlayer.x <= 230 &&
    localPlayer.y >= 100 &&
    localPlayer.y <= 750
  );

  // Proximity to East Bookshelves (XI PPLG-B)
  const isNearEastShelf = Boolean(
    localPlayer &&
    localPlayer.x >= 1500 &&
    localPlayer.y >= 100 &&
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

  // Target position for classroom-wide theatrical spotlight cutout
  const spotlightPos = useMemo(() => {
    if (!spotlightPlayer) return null;
    const isMe = 
      (spotlightPlayer.id && spotlightPlayer.id === myId) || 
      (attendanceNo && String(spotlightPlayer.attendanceNo) === String(attendanceNo)) ||
      (username && spotlightPlayer.username && spotlightPlayer.username.toLowerCase() === username.toLowerCase());
    if (isMe) {
      return { x: localPlayer.x, y: localPlayer.y };
    }
    const found = remotePlayers.find(p => 
      p.id === spotlightPlayer.id || 
      (p.attendanceNo && String(p.attendanceNo) === String(spotlightPlayer.attendanceNo)) ||
      (p.username && spotlightPlayer.username && p.username.toLowerCase() === spotlightPlayer.username.toLowerCase())
    );
    if (found) {
      return { x: found.x, y: found.y };
    }
    return null;
  }, [spotlightPlayer, myId, attendanceNo, username, localPlayer.x, localPlayer.y, remotePlayers]);

  // Relative distance and compass direction to spotlighted player
  const spotlightNav = useMemo(() => {
    if (!spotlightPos || !localPlayer) return null;
    const dx = spotlightPos.x - localPlayer.x;
    const dy = spotlightPos.y - localPlayer.y;
    const distancePx = Math.hypot(dx, dy);
    const distanceMeters = Math.max(1, Math.round(distancePx / 32));
    const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    return { distanceMeters, angleDeg, isClose: distanceMeters <= 2 };
  }, [spotlightPos, localPlayer?.x, localPlayer?.y]);

  // Audio chime when spotlight is activated
  const prevSpotlightRef = useRef(null);
  useEffect(() => {
    if (spotlightPlayer && !prevSpotlightRef.current) {
      playScrollOpen();
    }
    prevSpotlightRef.current = spotlightPlayer;
  }, [spotlightPlayer]);

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
                presenterName={isAdmin ? `Admin ${fullName || username || ''}`.trim() : (fullName || username || 'Siswa')}
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
          style={{ left: '180px', top: '160px' }}
        >
          <div className="pixel-panel-gold px-2.5 py-1 text-[10px] font-black text-amber-950 uppercase tracking-wider shadow-lg border border-amber-900 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen className="w-3 h-3 text-amber-900" />
            <span>Rak Buku XI PPLG-A</span>
          </div>
        </div>

        <div 
          className="absolute z-30 pointer-events-none select-none"
          style={{ left: '1620px', top: '160px', transform: 'translate(-100%, 0)' }}
        >
          <div className="pixel-panel-gold px-2.5 py-1 text-[10px] font-black text-amber-950 uppercase tracking-wider shadow-lg border border-amber-900 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen className="w-3 h-3 text-amber-900" />
            <span>Rak Buku XI PPLG-B</span>
          </div>
        </div>

        {/* Dynamic Proximity Interaction Prompts at the closest Bookshelf to Player [R] */}
        {isNearWestShelf && !isModalBlocking && (
          <div 
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{ 
              left: '180px', 
              top: `${nearestWestShelf.centerY}px`, 
              transform: 'translate(0, -50%)',
              zIndex: 999 
            }}
            onClick={() => {
              setSelectedBookshelfClass('XI PPLG-A');
              setIsBookshelfModalOpen(true);
            }}
          >
            <div className="animate-bounce-short">
              <div className="pixel-panel-wood px-2.5 py-1 text-amber-100 flex items-center gap-1.5 shadow-2xl border border-amber-600 whitespace-nowrap">
                <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2">R</span>
                <span className="text-[11px] font-bold text-amber-200">Tekan R untuk Buka Rak Buku XI PPLG-A</span>
              </div>
            </div>
          </div>
        )}

        {isNearEastShelf && !isModalBlocking && (
          <div 
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{ 
              left: '1615px', 
              top: `${nearestEastShelf.centerY}px`, 
              transform: 'translate(-100%, -50%)',
              zIndex: 999 
            }}
            onClick={() => {
              setSelectedBookshelfClass('XI PPLG-B');
              setIsBookshelfModalOpen(true);
            }}
          >
            <div className="animate-bounce-short">
              <div className="pixel-panel-wood px-2.5 py-1 text-amber-100 flex items-center gap-1.5 shadow-2xl border border-amber-600 whitespace-nowrap">
                <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2">R</span>
                <span className="text-[11px] font-bold text-amber-200">Tekan R untuk Buka Rak Buku XI PPLG-B</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Render Remote Students / Players and their Pets */}
        {visibleRemotePlayers.map((p) => {
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
                aura={p.aura}
                color={p.color}
                roomCode={p.roomCode}
                localRoomCode={roomCode}
                emote={remoteEmotes[p.id]}
                chatBubble={remoteChatBubbles[p.id]}
                isSpotlighted={isPlayerSpotlighted}
                isGroupCompleted={Boolean(p.roomCode && completedGroups && completedGroups.has(p.roomCode.trim().toUpperCase()))}
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
              username={currentUsername || username}
              fullName={currentFullName || fullName}
              attendanceNo={attendanceNo}
              characterIndex={characterIndex}
              isAdmin={isAdmin}
              aura={isAdmin ? adminAura : null}
              color={color}
              roomCode={roomCode}
              localRoomCode={roomCode}
              emote={localEmote}
              chatBubble={localChatBubble}
              isSpotlighted={isLocalSpotlighted}
              isGroupCompleted={Boolean(isMyGroupDevCompleted || (roomCode && completedGroups && completedGroups.has(roomCode.trim().toUpperCase())))}
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
          roomCode={roomCode}
          username={currentUsername || username}
          attendanceNo={attendanceNo}
          teamSharedPrompts={teamSharedPrompts}
          onSharePromptData={sharePromptData}
          onDeleteSharedPrompt={deleteSharedPrompt}
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
          allDevDone={allDevDone}
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
      
      {/* Top Player Location Indicator Banner */}
      {spotlightPlayer && !isPresentationActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pixel-panel-gold px-3.5 py-1.5 flex items-center gap-2 shadow-2xl border border-amber-900 animate-in fade-in slide-in-from-top-3 duration-200">
          <MapPin className="w-3.5 h-3.5 text-amber-950 fill-amber-950 shrink-0" />
          <span className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
            Lokasi Siswa:
          </span>
          <span className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-400">
            {spotlightPlayer.username || spotlightPlayer.fullName} {spotlightPlayer.attendanceNo ? `(#${spotlightPlayer.attendanceNo})` : ''}
          </span>
          {spotlightNav && !spotlightNav.isClose && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-950/20 rounded text-[10px] font-mono font-bold text-amber-950">
              <span 
                className="inline-block transition-transform duration-100 font-bold" 
                style={{ transform: `rotate(${spotlightNav.angleDeg}deg)` }}
              >
                ➔
              </span>
              <span>{spotlightNav.distanceMeters}m</span>
            </div>
          )}
          {spotlightNav?.isClose && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded border border-emerald-400">
              Dekat Anda
            </span>
          )}
          <span className="text-[9px] font-mono pixel-btn-wood text-amber-200 px-1.5 py-0.2 font-bold pointer-events-none">
            {spotlightPlayer.roomCode}
          </span>
          {isAdmin && (
            <button
              onClick={() => setSpotlight(null)}
              className="pixel-btn-wood text-[9px] px-1.5 py-0.5 text-amber-300 ml-1 hover:text-white"
              title="Tutup Petunjuk Lokasi"
            >
              Tutup
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

            {/* Admin Red Name Display & Quick Edit in Mini HUD */}
            {isAdmin && (
              !isEditingAdminName ? (
                <div className="flex items-center gap-1">
                  <span className="text-red-400 font-bold text-xs truncate max-w-[100px]" title={currentUsername || username}>
                    {currentUsername || username}
                  </span>
                  <button
                    onClick={() => {
                      setAdminNameInput(currentUsername || username);
                      setIsEditingAdminName(true);
                    }}
                    title="Ubah Nama Admin"
                    className="pixel-btn-wood p-0.5 text-red-300 hover:text-red-100 shrink-0"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveAdminName} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    autoFocus
                    className="pixel-box-inset px-1.5 py-0.5 text-xs font-bold text-red-400 bg-[#120702] border border-red-700 focus:outline-none w-20"
                  />
                  <button type="submit" className="pixel-btn-gold text-[9px] px-1 py-0.2 font-bold">OK</button>
                  <button type="button" onClick={() => setIsEditingAdminName(false)} className="pixel-btn-silver text-[9px] px-1 py-0.2">X</button>
                </form>
              )
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  title="Buka Panel Admin / Pengajar"
                  className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow animate-pulse"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => setIsAdminAuraModalOpen(true)}
                  title="Kustomisasi Aura Admin (Biasa, Love, Bintang, Warna)"
                  className="pixel-btn-wood text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 text-amber-200"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Aura</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsPresentationFocused(true)}
              title="Buka Layar Presentasi Canva"
              className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow"
            >
              <span>Presentasi</span>
            </button>
            <button
              onClick={() => setIsTrackerOpen(prev => !prev)}
              title="Buka Pelacak Lokasi NPC"
              className="pixel-btn-wood text-[10px] px-2 py-0.5 font-bold flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-amber-400" />
              <span>NPC</span>
            </button>
            <button
              onClick={() => setIsTeamVaultOpen(true)}
              title="Buka Bahan Prompt Tim (Supabase & Ide Game)"
              className="pixel-btn-wood text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 relative"
            >
              <Users className="w-3 h-3 text-amber-400" />
              <span>Bahan Tim</span>
              {teamSharedPrompts?.length > 0 && (
                <span className="bg-amber-400 text-amber-950 text-[9px] px-1 py-0.1 rounded-full font-black">
                  {teamSharedPrompts.length}
                </span>
              )}
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
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  !isEditingAdminName ? (
                    <div className="flex items-center gap-1">
                      <span className="text-red-400 font-bold font-mono text-[10px] flex items-center gap-1">
                        <img 
                          src="/assets/fantasy_pixelart_ui/icons/gold_star.png" 
                          alt="Admin" 
                          className="w-3 h-3 image-rendering-pixelated" 
                        />
                        <span>#{attendanceNo ? attendanceNo : '-'}</span>
                        <span className="underline decoration-red-500/50">{currentUsername || username}</span>
                      </span>
                      <button
                        onClick={() => {
                          setAdminNameInput(currentUsername || username);
                          setIsEditingAdminName(true);
                        }}
                        title="Ubah Nama Admin"
                        className="pixel-btn-wood p-0.5 text-red-300 hover:text-red-100 ml-0.5"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveAdminName} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={adminNameInput}
                        onChange={(e) => setAdminNameInput(e.target.value)}
                        autoFocus
                        className="pixel-box-inset px-1.5 py-0.5 text-[10px] font-bold text-red-400 bg-[#120702] border border-red-700 focus:outline-none w-24"
                      />
                      <button type="submit" className="pixel-btn-gold text-[9px] px-1 py-0.2 font-bold">OK</button>
                      <button type="button" onClick={() => setIsEditingAdminName(false)} className="pixel-btn-silver text-[9px] px-1 py-0.2">X</button>
                    </form>
                  )
                ) : (
                  <span className="text-amber-200 font-mono text-[10px]">
                    #{attendanceNo ? attendanceNo : '-'} {username}
                  </span>
                )}
              </div>
            </div>

            {/* Controls hint, Presentation button, Pet button & Leave button */}
            <div className="pt-1 border-t border-[#5c3416] flex items-center justify-between text-[10px] text-amber-300/70">
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      title="Buka Panel Admin / Pengajar"
                      className="pixel-btn-gold text-[10px] px-2 py-0.5 text-amber-950 flex items-center gap-1 font-bold shadow-sm animate-pulse"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                    <button
                      onClick={() => setIsAdminAuraModalOpen(true)}
                      title="Kustomisasi Aura Admin (Biasa, Love, Bintang, Warna)"
                      className="pixel-btn-wood text-[10px] px-2 py-0.5 text-amber-200 flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Aura</span>
                    </button>
                  </>
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
                <button
                  onClick={() => setIsTeamVaultOpen(true)}
                  title="Buka Bahan Prompt Tim (Supabase & Ide Game)"
                  className="pixel-btn-wood text-[10px] px-2 py-0.5 text-amber-200 flex items-center gap-1 font-bold relative"
                >
                  <Users className="w-3 h-3 text-amber-400" />
                  <span>Bahan Tim</span>
                  {teamSharedPrompts?.length > 0 && (
                    <span className="bg-amber-400 text-amber-950 text-[9px] px-1 py-0.1 rounded-full font-black">
                      {teamSharedPrompts.length}
                    </span>
                  )}
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
        pingMap={pingMap}
        isAdmin={isAdmin}
        adminAura={adminAura}
        onOpenAuraModal={() => setIsAdminAuraModalOpen(true)}
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
        groupMembers={myGroupMembers}
        onSubmitted={() => {
          setSelectedBookshelfClass(activeClass);
          setIsBookshelfModalOpen(true);
        }}
      />



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

      {/* Network & Bandwidth Monitor */}
      <NetworkMonitor
        playerId={myId}
        lowLatencyMode={lowLatencyMode}
        onToggleLowLatency={setLowLatencyMode}
      />

      {/* Dev Todo Checklist Widget (tracks shared DEV 1-4 milestones, directs to Sam when done) */}
      <DevTodoWidget
        onDirectToSam={() => setActiveTrackedNpcId('npc-sam')}
        todos={groupDevTodos}
        onToggleTodo={toggleGroupDevTodo}
        roomCode={roomCode}
        isAllCompleted={isMyGroupDevCompleted}
      />

      {/* Standalone Team Shared Prompt Vault Modal */}
      {isTeamVaultOpen && (
        <TeamPromptVault
          roomCode={roomCode}
          username={currentUsername || username}
          attendanceNo={attendanceNo}
          teamSharedPrompts={teamSharedPrompts}
          onSharePromptData={sharePromptData}
          onDeleteSharedPrompt={deleteSharedPrompt}
          isEmbedded={false}
          onClose={() => setIsTeamVaultOpen(false)}
        />
      )}

      {/* Admin Custom Aura Modal */}
      {isAdmin && (
        <AdminAuraModal
          isOpen={isAdminAuraModalOpen}
          onClose={() => setIsAdminAuraModalOpen(false)}
          currentAura={adminAura}
          onSaveAura={updateAdminAura}
          characterIndex={characterIndex}
        />
      )}

    </div>
  );
}
