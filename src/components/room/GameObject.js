'use client';

import React from 'react';

/**
 * GameObject Component
 * Stardew Valley Architectural Elements:
 * - Authentic schoolhouse wainscoted walls (warm cream wallpaper + honey oak beadboard)
 * - Heavy oak crown molding and baseboards
 * - Cozy wooden side walls with rich ambient depth
 */
export default function GameObject({ object }) {
  if (!object.visible) return null;

  const zIndex = Math.floor(object.y + object.height);

  const baseStyle = {
    position: 'absolute',
    left: object.x,
    top: object.y,
    width: object.width,
    height: object.height,
    zIndex: object.collision ? zIndex : (object.zIndex || 0),
    userSelect: 'none',
  };

  switch (object.type) {
    case 'wall':
      if (object.id === 'wall-top') {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: '#f6eee2', // Warm Stardew cream wallpaper
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(160, 115, 75, 0.08) 24px, rgba(160, 115, 75, 0.08) 25px)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            }}
          >
            {/* Top Ceiling Dark Oak Crown Molding */}
            <div
              style={{
                width: '100%',
                height: 12,
                backgroundColor: '#4a250a',
                borderBottom: '2px solid #6b3915',
                boxShadow: 'inset 0 -2px 0 #2c1404',
              }}
            />

            {/* Middle Wooden Chair-Rail Trim */}
            <div
              style={{
                position: 'absolute',
                top: 66,
                left: 0,
                width: '100%',
                height: 8,
                backgroundColor: '#8c5324',
                borderTop: '1.5px solid #d49a5b',
                borderBottom: '2px solid #4a250a',
              }}
            />

            {/* Lower Wooden Beadboard Wainscoting */}
            <div
              style={{
                position: 'absolute',
                top: 74,
                left: 0,
                bottom: 16,
                width: '100%',
                backgroundColor: '#7a4419',
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 15px, #582f10 15px, #582f10 17px, #945928 17px, #945928 18px)',
              }}
            />

            {/* Heavy Baseboard Trim (Bottom) */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 16,
                backgroundColor: '#452108',
                borderTop: '2px solid #8c5324',
                boxShadow: 'inset 0 2px 0 #2c1404, 0 6px 12px rgba(0, 0, 0, 0.35)',
              }}
            />
          </div>
        );
      }

      if (object.id === 'wall-bottom') {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: '#452108',
              borderTop: '3px solid #78421b',
              boxShadow: 'inset 0 4px 10px rgba(0, 0, 0, 0.45)',
            }}
          />
        );
      }

      if (object.id === 'wall-left' || object.id === 'wall-right') {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: '#5c3416',
              borderLeft: object.id === 'wall-right' ? '3px solid #3a1e08' : 'none',
              borderRight: object.id === 'wall-left' ? '3px solid #3a1e08' : 'none',
              boxShadow: object.id === 'wall-left' 
                ? 'inset -4px 0 8px rgba(0,0,0,0.35)' 
                : 'inset 4px 0 8px rgba(0,0,0,0.35)',
            }}
          />
        );
      }

      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: '#452108',
          }}
        />
      );

    case 'carpet-stage':
      return null;

    default:
      return null;
  }
}
