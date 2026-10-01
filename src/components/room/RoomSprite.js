'use client';

import React from 'react';

/**
 * RoomSprite Component
 * Stardew Valley Cozy Classroom Furniture & Environmental Sprites
 * Uses handcrafted, high-fidelity SVGs with authentic Stardew Valley color palettes,
 * soft drop shadows, warm honey oak, and zero visual glitches.
 */
const SPRITE_DEFS = {
  // Student Two-Seater Desk (includes chairs, notebooks, pencils, mug)
  'desk': {
    image: '/assets/stardew_student_desk.svg',
    isSvg: true,
    defaultW: 150,
    defaultH: 85,
  },
  'student-desk': {
    image: '/assets/stardew_student_desk.svg',
    isSvg: true,
    defaultW: 150,
    defaultH: 85,
  },

  // Teacher Executive Desk (includes teacher armchair, banker's lamp, ledger, apple)
  'teacher-desk': {
    image: '/assets/stardew_teacher_desk.svg',
    isSvg: true,
    defaultW: 200,
    defaultH: 95,
  },

  // Stardew Oak Bookshelves & Library
  'bookshelf': {
    image: '/assets/stardew_bookshelf.svg',
    isSvg: true,
    defaultW: 120,
    defaultH: 130,
  },
  'bookshelf-alt': {
    image: '/assets/stardew_bookshelf.svg',
    isSvg: true,
    defaultW: 120,
    defaultH: 130,
  },
  'bookshelf-narrow': {
    image: '/assets/stardew_bookshelf.svg',
    isSvg: true,
    defaultW: 80,
    defaultH: 130,
  },
  'cabinet': {
    image: '/assets/stardew_bookshelf.svg',
    isSvg: true,
    defaultW: 100,
    defaultH: 120,
  },

  // Stardew Potted Houseplants (Monstera / Fern in terracotta pots)
  'plant': {
    image: '/assets/stardew_plant.svg',
    isSvg: true,
    defaultW: 56,
    defaultH: 64,
  },

  // Pendulum Wall Clock
  'clock': {
    image: '/assets/stardew_clock.svg',
    isSvg: true,
    defaultW: 36,
    defaultH: 74,
  },

  // Arched Wooden Windows with Sunlight
  'window': {
    image: '/assets/stardew_window.svg',
    isSvg: true,
    defaultW: 80,
    defaultH: 96,
  },

  // Classroom Globe on Spindle
  'globe': {
    image: '/assets/stardew_globe.svg',
    isSvg: true,
    defaultW: 48,
    defaultH: 58,
  },

  // Cork Noticeboard with Student Art & Announcements
  'noticeboard': {
    image: '/assets/stardew_noticeboard.svg',
    isSvg: true,
    defaultW: 64,
    defaultH: 64,
  },

  // Green Slate Chalkboard
  'chalkboard': {
    image: '/assets/stardew_chalkboard.svg',
    isSvg: true,
    defaultW: 96,
    defaultH: 68,
  },

  // Stardew Woven Persian/Rustic Carpet Runner
  'rug': {
    image: '/assets/stardew_rug.svg',
    isSvg: true,
    defaultW: 760,
    defaultH: 340,
  },

  // Main Entrance Double Door
  'door': {
    image: '/assets/stardew_door.svg',
    isSvg: true,
    defaultW: 96,
    defaultH: 96,
  },
};

function RoomSprite({ type, x, y, width, height, zIndex, className = '' }) {
  const def = SPRITE_DEFS[type];
  // If undefined (such as legacy 'chair' which is now integrated into 'desk'), return null
  if (!def) return null;

  const w = width || def.defaultW;
  const h = height || def.defaultH;
  const calculatedZIndex = zIndex !== undefined ? zIndex : Math.floor(y + h);

  if (def.isSvg || def.image.endsWith('.svg')) {
    return (
      <div
        className={`absolute pointer-events-none select-none ${className}`}
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          zIndex: calculatedZIndex,
        }}
      >
        <img
          src={def.image}
          alt={type}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
          draggable={false}
        />
      </div>
    );
  }

  // Fallback for raster tilesheet crops
  const scaleX = w / def.sheetW;
  const scaleY = h / def.sheetH;

  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        zIndex: calculatedZIndex,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: def.sheetW,
          height: def.sheetH,
          backgroundImage: `url('${def.image}')`,
          backgroundPosition: `-${def.sheetX}px -${def.sheetY}px`,
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
        }}
      />
    </div>
  );
}

export default React.memo(RoomSprite);
