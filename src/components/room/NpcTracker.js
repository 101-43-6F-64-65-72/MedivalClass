'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navigation, Compass, MapPin, X, Check, Eye, EyeOff } from 'lucide-react';
import { playDialogueOpen, playChoiceHover, playChoiceClick, playCloseSound } from '@/lib/soundEffects';

export const CLASSROOM_NPCS = [
  {
    id: 'npc-qeebos',
    name: 'Qeebos',
    role: 'Mentor Utama',
    desc: 'Panduan pembelajaran & generator scroll prompt',
    location: 'Lorong Rak Buku Timur',
    x: 1715,
    y: 720,
    portrait: '/assets/OwnAssets/qeebos/normal.png',
    spriteSheet: '/assets/OwnAssets/qeebos/qeebos.png',
    color: '#f59e0b',
  },
  {
    id: 'npc-krisna',
    name: 'Krisna',
    role: 'Materi Canva',
    desc: 'Slide presentasi & materi pembelajaran interaktif',
    location: 'Panggung Utama Depan',
    x: 730,
    y: 530,
    portrait: '/assets/OwnAssets/krisna/normal.png',
    spriteSheet: '/assets/OwnAssets/krisna/krisna.png',
    color: '#3b82f6',
  },
  {
    id: 'npc-imanuel',
    name: 'Imanuel',
    role: 'Contoh Game AI',
    desc: 'Demo game Pixel Arena Coin Grabber hasil AI',
    location: 'Lorong Meja Belajar Barat',
    x: 95,
    y: 800,
    portrait: '/assets/OwnAssets/imanuel/normal.png',
    spriteSheet: '/assets/OwnAssets/imanuel/imanuel.png',
    color: '#10b981',
  },
  {
    id: 'npc-sam',
    name: 'Sam',
    role: 'Arsip & Rak Buku Game',
    desc: 'Penjaga arsip karya game & rak buku kelas XI',
    location: 'Tepat di Samping Jam Dinding Barat',
    x: 135,
    y: 520,
    portrait: '/assets/OwnAssets/Sam/potraitsam.png',
    spriteSheet: '/assets/OwnAssets/Sam/Sam.png',
    color: '#f97316',
  },
  {
    id: 'npc-dzakih',
    name: 'Dzakih',
    role: 'Setting Pet Kucing',
    desc: 'Adopsi, pilih jenis kucing, atau lepas hewan peliharaan',
    location: 'Meja Siswa Baris Kedua',
    x: 1250,
    y: 955,
    portrait: '/assets/OwnAssets/dzakih/normal.png',
    spriteSheet: '/assets/OwnAssets/dzakih/dzakih.png',
    color: '#ec4899',
  },
];

export default function NpcTracker({
  isOpen,
  onClose,
  localPlayer,
  activeTrackedId,
  onToggleTrack,
  camX = 0,
  camY = 0,
  zoom = 1.15,
  viewport = { w: 1200, h: 800 },
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate distance & angle to any NPC from player position
  const getNavInfo = (npc) => {
    if (!localPlayer) return { distance: 0, angleDeg: 0 };
    const dx = npc.x - localPlayer.x;
    const dy = npc.y - localPlayer.y;
    const distancePx = Math.hypot(dx, dy);
    // Convert 20px = approx 1 meter in-game scale
    const distanceMeters = Math.max(1, Math.round(distancePx / 20));
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    return { distancePx, distanceMeters, angleDeg };
  };

  const trackedNpc = CLASSROOM_NPCS.find((n) => n.id === activeTrackedId);
  const trackedNav = trackedNpc ? getNavInfo(trackedNpc) : null;

  // Offscreen screen-edge pointer calculation
  let isTargetOffscreen = false;
  let edgePointerX = 0;
  let edgePointerY = 0;
  let edgeAngleDeg = 0;

  if (trackedNpc && localPlayer) {
    const screenX = (trackedNpc.x - camX) * zoom;
    const screenY = (trackedNpc.y - camY) * zoom;
    const marginX = 80;
    const marginY = 80;

    isTargetOffscreen =
      screenX < marginX ||
      screenX > viewport.w - marginX ||
      screenY < marginY ||
      screenY > viewport.h - marginY;

    if (isTargetOffscreen) {
      const centerX = viewport.w / 2;
      const centerY = viewport.h / 2;
      const diffX = screenX - centerX;
      const diffY = screenY - centerY;
      edgeAngleDeg = (Math.atan2(diffY, diffX) * 180) / Math.PI;

      const angleRad = Math.atan2(diffY, diffX);
      const radiusX = viewport.w / 2 - 40;
      const radiusY = viewport.h / 2 - 40;

      edgePointerX = Math.max(
        40,
        Math.min(viewport.w - 40, centerX + Math.cos(angleRad) * radiusX)
      );
      edgePointerY = Math.max(
        40,
        Math.min(viewport.h - 40, centerY + Math.sin(angleRad) * radiusY)
      );
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ========================================================
          1. ACTIVE TRACKED NPC HUD BANNER (Bottom Center)
         ======================================================== */}
      {trackedNpc && trackedNav && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="pixel-panel-wood text-amber-100 px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xl border border-amber-600/80">
            {/* Direction Arrow */}
            <div
              className="w-5 h-5 flex items-center justify-center transition-transform duration-75 text-amber-300 font-bold"
              style={{
                transform: `rotate(${trackedNav.angleDeg}deg)`,
              }}
            >
              ➔
            </div>

            {/* Target Info */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-amber-400 font-bold">Lacak:</span>
              <span className="font-bold text-white">{trackedNpc.name}</span>
              <span className="text-amber-500">•</span>
              <span className="text-amber-300 font-mono font-bold">
                {trackedNav.distanceMeters}m
              </span>
              <span className="text-[10px] text-amber-400/80 hidden sm:inline">
                ({trackedNpc.role})
              </span>
            </div>

            {/* Stop Tracking Button */}
            <button
              onClick={() => {
                playChoiceClick();
                onToggleTrack(null);
              }}
              title="Hentikan Lacak"
              className="pixel-btn-wood p-1 text-[10px] text-amber-300 hover:text-red-300 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          2. OFF-SCREEN EDGE WAYPOINT POINTER (Pins to Screen Border)
         ======================================================== */}
      {trackedNpc && isTargetOffscreen && (
        <div
          className="fixed z-40 pointer-events-none select-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${edgePointerX}px`,
            top: `${edgePointerY}px`,
          }}
        >
          <div className="flex flex-col items-center animate-pulse">
            <div className="pixel-panel-wood px-2 py-0.5 text-[10px] font-bold text-amber-200 shadow-xl border border-amber-500 flex items-center gap-1 whitespace-nowrap">
              <span>{trackedNpc.name}</span>
              <span className="text-amber-400 font-mono">
                {trackedNav.distanceMeters}m
              </span>
            </div>
            <div
              className="w-5 h-5 text-amber-400 font-black text-sm flex items-center justify-center drop-shadow"
              style={{
                transform: `rotate(${edgeAngleDeg}deg)`,
              }}
            >
              ➔
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. NPC TRACKER MODAL / PARCHMENT WINDOW
         ======================================================== */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div className="pixel-panel-wood text-amber-100 p-5 max-w-lg w-full space-y-3.5 shadow-2xl border-2 border-amber-600">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#5a3012] pb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-amber-300">
                    Pelacak Lokasi NPC (NPC Tracker)
                  </h3>
                  <p className="text-[10px] text-amber-400/80">
                    Pilih NPC untuk memunculkan petunjuk arah dan jarak langsung di layar
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                className="pixel-btn-wood px-2 py-1 text-xs"
                title="Tutup"
              >
                <img
                  src="/assets/fantasy_pixelart_ui/icons/gold_cross.png"
                  alt="Close"
                  className="w-3.5 h-3.5 image-pixelated"
                />
              </button>
            </div>

            {/* List of NPCs */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto p-1 pixel-scrollbar">
              {CLASSROOM_NPCS.map((npc) => {
                const nav = getNavInfo(npc);
                const isTracked = activeTrackedId === npc.id;

                return (
                  <div
                    key={npc.id}
                    className={`pixel-box-inset p-2.5 flex items-center justify-between gap-3 transition-all ${
                      isTracked
                        ? 'border-amber-400 bg-amber-950/70 ring-1 ring-amber-400'
                        : 'hover:border-amber-600/60'
                    }`}
                  >
                    {/* Left: Avatar / Portrait & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Portrait preview box */}
                      <div className="w-11 h-11 rounded bg-[#1a0c04] border border-amber-800/80 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-0.5">
                        {npc.portrait ? (
                          <img
                            src={npc.portrait}
                            alt={npc.name}
                            className="w-full h-full object-contain image-pixelated"
                          />
                        ) : (
                          <div className="w-9 h-9 overflow-hidden flex items-center justify-center relative">
                            <div
                              className="w-12 h-12 image-pixelated pointer-events-none select-none"
                              style={{
                                backgroundImage: `url('${npc.spriteSheet}')`,
                                backgroundPosition: '-48px 0px', // Center front frame
                                backgroundSize: '144px 192px',
                                backgroundRepeat: 'no-repeat',
                                transform: 'scale(1.15) translateY(2px)',
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-amber-200">
                            {npc.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-700/60 text-amber-300 font-semibold">
                            {npc.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-400/80 truncate">
                          {npc.desc}
                        </div>
                        <div className="text-[9px] text-amber-500/90 font-mono">
                          Lokasi: {npc.location}
                        </div>
                      </div>
                    </div>

                    {/* Right: Distance & Action Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Compass pointer & Distance */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className="text-xs text-amber-400 inline-block font-bold"
                            style={{
                              transform: `rotate(${nav.angleDeg}deg)`,
                            }}
                          >
                            ➔
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-300">
                            {nav.distanceMeters}m
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-500/70 block">
                          jarak
                        </span>
                      </div>

                      {/* Track toggle button */}
                      <button
                        onMouseEnter={() => playChoiceHover()}
                        onClick={() => {
                          playChoiceClick();
                          onToggleTrack(isTracked ? null : npc.id);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isTracked
                            ? 'pixel-btn-wood text-red-300 border-red-500/60'
                            : 'pixel-btn-gold text-amber-950'
                        }`}
                      >
                        {isTracked ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Batal</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Lacak</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#5a3012] flex items-center justify-between text-[11px] text-amber-300/80">
              <span>
                {trackedNpc
                  ? `Sedang melacak: ${trackedNpc.name} (${trackedNav?.distanceMeters}m)`
                  : 'Belum ada NPC yang dilacak.'}
              </span>
              <button
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                className="pixel-btn-wood text-xs px-4 py-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
