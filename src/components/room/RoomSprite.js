import React from 'react';

// Coordinates calibrated for pixel_assets.png (1024 x 363 px)
const SPRITE_DEFS = {
  // Main Furniture
  desk: {
    sheetX: 248,
    sheetY: 160,
    sheetW: 115,
    sheetH: 65,
    defaultW: 160,
    defaultH: 90,
  },
  counter: {
    sheetX: 372,
    sheetY: 170,
    sheetW: 130,
    sheetH: 75,
    defaultW: 180,
    defaultH: 105,
  },
  bookshelf: {
    sheetX: 184,
    sheetY: 265,
    sheetW: 62,
    sheetH: 90,
    defaultW: 86,
    defaultH: 125,
  },
  'bookshelf-alt': {
    sheetX: 267,
    sheetY: 270,
    sheetW: 62,
    sheetH: 85,
    defaultW: 86,
    defaultH: 120,
  },
  globe: {
    sheetX: 100,
    sheetY: 170,
    sheetW: 65,
    sheetH: 75,
    defaultW: 85,
    defaultH: 100,
  },
  clock: {
    sheetX: 54,
    sheetY: 16,
    sheetW: 40,
    sheetH: 92,
    defaultW: 50,
    defaultH: 115,
  },
  chest: {
    sheetX: 40,
    sheetY: 106,
    sheetW: 38,
    sheetH: 33,
    defaultW: 52,
    defaultH: 45,
  },
  'armchair-blue': {
    sheetX: 463,
    sheetY: 72,
    sheetW: 35,
    sheetH: 48,
    defaultW: 48,
    defaultH: 66,
  },
  'armchair-gold': {
    sheetX: 463,
    sheetY: 28,
    sheetW: 35,
    sheetH: 45,
    defaultW: 48,
    defaultH: 62,
  },

  // Carpets & Rugs
  'carpet-large': {
    sheetX: 314,
    sheetY: 17,
    sheetW: 115,
    sheetH: 60,
    defaultW: 240,
    defaultH: 125,
  },
  'carpet-medium': {
    sheetX: 320,
    sheetY: 90,
    sheetW: 88,
    sheetH: 50,
    defaultW: 180,
    defaultH: 102,
  },
  'carpet-runner': {
    sheetX: 512,
    sheetY: 17,
    sheetW: 48,
    sheetH: 115,
    defaultW: 96,
    defaultH: 230,
  },

  // Decor & Plants
  plant: {
    sheetX: 19,
    sheetY: 100,
    sheetW: 30,
    sheetH: 50,
    defaultW: 42,
    defaultH: 70,
  },
  bonsai: {
    sheetX: 18,
    sheetY: 18,
    sheetW: 30,
    sheetH: 38,
    defaultW: 42,
    defaultH: 52,
  },
  'books-stack': {
    sheetX: 195,
    sheetY: 16,
    sheetW: 34,
    sheetH: 45,
    defaultW: 42,
    defaultH: 55,
  },
  lamp: {
    sheetX: 430,
    sheetY: 90,
    sheetW: 18,
    sheetH: 35,
    defaultW: 26,
    defaultH: 50,
  },

  // Wall elements
  'wall-blue': {
    sheetX: 712,
    sheetY: 0,
    sheetW: 295,
    sheetH: 115,
    defaultW: 590,
    defaultH: 230,
  },
  'wall-stairs': {
    sheetX: 642,
    sheetY: 0,
    sheetW: 70,
    sheetH: 115,
    defaultW: 140,
    defaultH: 230,
  },
};

export default function RoomSprite({ type, x, y, width, height, zIndex, className = '' }) {
  const def = SPRITE_DEFS[type];
  if (!def) return null;

  const w = width || def.defaultW;
  const h = height || def.defaultH;
  const scaleX = w / def.sheetW;
  const scaleY = h / def.sheetH;

  const calculatedZIndex = zIndex !== undefined ? zIndex : Math.floor(y + h);

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
          backgroundImage: 'url(/pixel_assets.png)',
          backgroundPosition: `-${def.sheetX}px -${def.sheetY}px`,
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated', // crisp pixel art rendering
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
        }}
      />
    </div>
  );
}
