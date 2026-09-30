"use client";

import React, { useRef, useEffect, useState } from 'react';
import { MAP_OBJECTS, DECORATIVE_ASSETS, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import GameObject from './GameObject';
import RoomSprite from './RoomSprite';
import Player from './Player';
import PresentationScreen from './PresentationScreen';
import GameArea from './GameArea';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import { useMultiplayer } from '@/hooks/useMultiplayer';

export default function VirtualRoom({ username, color }) {
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const zoom = 1.15; // Optimal POV zoom for 3/4 perspective
  
  // Initialize local player with dynamic safe spawn in main aisle
  const localPlayer = usePlayerControls();

  // Initialize multiplayer
  const { players: remotePlayers, connected } = useMultiplayer(localPlayer, username, color);

  // Track window resize to ensure camera framing is always accurate
  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute camera position clamped within room boundaries
  const maxCamX = Math.max(0, ROOM_WIDTH - viewport.w / zoom);
  const maxCamY = Math.max(0, ROOM_HEIGHT - viewport.h / zoom);
  const targetCamX = localPlayer.x - (viewport.w / zoom) / 2 + 16;
  const targetCamY = localPlayer.y - (viewport.h / zoom) / 2 + 24;
  const camX = Math.max(0, Math.min(maxCamX, targetCamX));
  const camY = Math.max(0, Math.min(maxCamY, targetCamY));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* 2D Virtual Game Camera Layer */}
      <div 
        ref={containerRef}
        className="absolute top-0 left-0 shadow-2xl transition-transform duration-75 ease-out"
        style={{
          width: ROOM_WIDTH,
          height: ROOM_HEIGHT,
          transform: `translate3d(${-camX * zoom}px, ${-camY * zoom}px, 0) scale(${zoom})`,
          transformOrigin: 'top left',
          willChange: 'transform',
          backgroundColor: '#b88d61', // Warm vintage academy wood parquet
          backgroundImage: `
            linear-gradient(rgba(148, 105, 68, 0.45) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 105, 68, 0.45) 1px, transparent 1px),
            repeating-linear-gradient(45deg, rgba(120, 80, 48, 0.1) 0px, rgba(120, 80, 48, 0.1) 2px, transparent 2px, transparent 32px)
          `,
          backgroundSize: '32px 32px, 32px 32px, 64px 64px',
        }}
      >
        {/* Render Modular Decorative Sprites (Wall panels, carpets, armchairs, plants) */}
        {DECORATIVE_ASSETS.map((asset) => (
          <RoomSprite
            key={asset.id}
            type={asset.type}
            x={asset.x}
            y={asset.y}
            width={asset.width}
            height={asset.height}
            zIndex={asset.zIndex}
          />
        ))}

        {/* Render Map Objects */}
        {MAP_OBJECTS.map((obj) => {
          if (obj.type === 'screen') {
            return <PresentationScreen key={obj.id} object={obj} />;
          }
          if (obj.type === 'arcade') {
            return <GameArea key={obj.id} object={obj} localPlayer={localPlayer} />;
          }
          if (['desk', 'podium', 'bookshelf', 'bookshelf-alt', 'clock', 'globe', 'chest'].includes(obj.type)) {
            return (
              <RoomSprite
                key={obj.id}
                type={obj.type === 'podium' ? 'counter' : obj.type}
                x={obj.x}
                y={obj.y}
                width={obj.width}
                height={obj.height}
              />
            );
          }
          return <GameObject key={obj.id} object={obj} />;
        })}
        
        {/* Render Remote Players */}
        {remotePlayers.map(p => (
          <Player 
            key={p.id}
            x={p.x} 
            y={p.y} 
            direction={p.direction}
            isMoving={p.isMoving}
            username={p.username}
            color={p.color}
            isLocal={false}
          />
        ))}

        {/* Render Local Player */}
        <Player 
          x={localPlayer.x} 
          y={localPlayer.y} 
          direction={localPlayer.direction}
          isMoving={localPlayer.isMoving}
          username={username}
          color={color}
          isLocal={true}
        />
      </div>
      
      {/* HUD overlay */}
      <div className="fixed top-4 left-4 bg-slate-900/90 text-white px-4 py-3 rounded-xl border border-slate-700 shadow-xl z-50 backdrop-blur-md flex flex-col gap-1.5 min-w-[220px]">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-sm text-amber-400">Grand Academy Hall</h1>
          <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800">
            Pixel Art
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            {connected ? `${remotePlayers.length + 1} Player Online` : 'Offline Mode'}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">{username}</span>
        </div>

        <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Move: <strong className="text-slate-300">WASD / Arrow</strong></span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">1800 × 1200 px</span>
        </div>
      </div>
    </div>
  );
}
