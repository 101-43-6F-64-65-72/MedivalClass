import React, { useState } from 'react';

export default function GameArea({ object, localPlayer }) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  if (!object.visible) return null;

  // Simple proximity check (is player near the arcade?)
  const isNear = 
    localPlayer &&
    localPlayer.x > object.x - 50 &&
    localPlayer.x < object.x + object.width + 50 &&
    localPlayer.y > object.y - 50 &&
    localPlayer.y < object.y + object.height + 50;

  const zIndex = Math.floor(object.y + object.height);

  return (
    <>
      <div 
        style={{
          position: 'absolute',
          left: object.x,
          top: object.y - 30, // Visual offset so hitbox matches arcade base
          width: object.width,
          height: object.height + 30,
          zIndex,
          cursor: isNear ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (isNear) setIsPlaying(true);
        }}
      >
        {/* Arcade cabinet sprite from room_assets_v2.jpg */}
        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: 'url(/room_assets_v2.jpg)',
            backgroundPosition: '-72px -540px',
            backgroundSize: 'calc(1024px * 0.55) calc(1024px * 0.55)',
            backgroundRepeat: 'no-repeat',
            filter: isNear ? 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
          }}
        />
        {isNear && !isPlaying && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md animate-bounce">
            Press to Play 🕹️
          </div>
        )}
      </div>

      {/* Game Modal */}
      {isPlaying && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-xl border-4 border-slate-600 shadow-2xl max-w-lg w-full text-center text-white">
            <h2 className="text-3xl font-bold text-emerald-400 mb-4">Demo Game</h2>
            <div className="bg-slate-900 h-64 rounded flex items-center justify-center mb-6 border border-slate-700">
              <p className="text-slate-400">Game Placeholder (Modular Component)</p>
            </div>
            <button 
              onClick={() => setIsPlaying(false)}
              className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      )}
    </>
  );
}
