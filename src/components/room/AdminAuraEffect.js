'use client';

import React from 'react';

/**
 * AdminAuraEffect Component
 * Renders a subtle, tasteful, non-intrusive aura around Admin character.
 * Modes: 'biasa' (gentle halo), 'love' (floating micro hearts), 'bintang' (soft twinkling stars), 'none'
 */
export default function AdminAuraEffect({ aura }) {
  if (!aura || aura.type === 'none') return null;

  const color = aura.color || '#f59e0b';
  const type = aura.type || 'biasa';

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-0" 
      style={{ overflow: 'visible' }}
    >
      {/* 1. Base Subtle Ground Halo Ring (Soft, gentle pulse) */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full animate-aura-pulse"
        style={{
          width: '46px',
          height: '16px',
          background: `radial-gradient(ellipse at center, ${color}2a 0%, ${color}0d 60%, transparent 80%)`,
          boxShadow: `0 0 10px ${color}35, inset 0 0 8px ${color}25`,
          border: `1px solid ${color}45`,
        }}
      />

      {/* 2. Soft Ambient Back-Glow (Very subtle behind character torso) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-aura-pulse"
        style={{
          width: '40px',
          height: '42px',
          background: `radial-gradient(circle, ${color}1c 0%, ${color}05 60%, transparent 80%)`,
          filter: 'blur(3px)',
        }}
      />

      {/* 3. Type-Specific Particle Effects */}
      {type === 'love' && (
        <div className="absolute inset-0">
          {/* Micro Heart 1 */}
          <div 
            className="absolute bottom-1 left-2 animate-aura-love"
            style={{
              '--aura-dx': '-4px',
              animationDelay: '0s',
              color: color,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          {/* Micro Heart 2 */}
          <div 
            className="absolute bottom-2 right-2 animate-aura-love"
            style={{
              '--aura-dx': '5px',
              animationDelay: '0.75s',
              color: color,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          {/* Micro Heart 3 */}
          <div 
            className="absolute bottom-0 left-5 animate-aura-love"
            style={{
              '--aura-dx': '-2px',
              animationDelay: '1.45s',
              color: color,
            }}
          >
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          {/* Micro Heart 4 */}
          <div 
            className="absolute bottom-1 right-4 animate-aura-love"
            style={{
              '--aura-dx': '3px',
              animationDelay: '2.15s',
              color: color,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
      )}

      {type === 'bintang' && (
        <div className="absolute inset-0">
          {/* Sparkle Star 1 */}
          <div 
            className="absolute -top-1 left-2 animate-aura-sparkle"
            style={{
              animationDelay: '0s',
              color: color,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
            </svg>
          </div>

          {/* Sparkle Star 2 */}
          <div 
            className="absolute top-3 right-0 animate-aura-sparkle"
            style={{
              animationDelay: '0.6s',
              color: color,
            }}
          >
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
            </svg>
          </div>

          {/* Sparkle Star 3 */}
          <div 
            className="absolute top-6 left-0 animate-aura-sparkle"
            style={{
              animationDelay: '1.2s',
              color: color,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
            </svg>
          </div>

          {/* Sparkle Star 4 */}
          <div 
            className="absolute -top-2 right-2 animate-aura-sparkle"
            style={{
              animationDelay: '1.8s',
              color: color,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
