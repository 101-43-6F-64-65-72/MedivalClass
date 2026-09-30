export const ROOM_WIDTH = 1800;
export const ROOM_HEIGHT = 1200;
export const TILE_SIZE = 40;
export const PLAYER_SPEED = 230; // pixels per second

export const MAP_OBJECTS = [
  // Room Wall Boundaries
  { id: 'wall-top', type: 'wall', x: 0, y: 0, width: ROOM_WIDTH, height: 110, collision: true, visible: false },
  { id: 'wall-bottom', type: 'wall', x: 0, y: ROOM_HEIGHT - 45, width: ROOM_WIDTH, height: 45, collision: true, visible: true },
  { id: 'wall-left', type: 'wall', x: 0, y: 0, width: 45, height: ROOM_HEIGHT, collision: true, visible: true },
  { id: 'wall-right', type: 'wall', x: ROOM_WIDTH - 45, y: 0, width: 45, height: ROOM_HEIGHT, collision: true, visible: true },

  // Presentation Stage Area (North Center)
  { id: 'screen', type: 'screen', x: 650, y: 35, width: 500, height: 125, collision: true, visible: true },
  { id: 'podium', type: 'podium', x: 810, y: 175, width: 180, height: 85, collision: true, visible: true },

  // Grandfather Clock (Near North Wall)
  { id: 'clock-1', type: 'clock', x: 120, y: 75, width: 50, height: 110, collision: true, visible: true },
  { id: 'clock-2', type: 'clock', x: 1640, y: 75, width: 50, height: 110, collision: true, visible: true },

  // Giant Globe
  { id: 'globe-1', type: 'globe', x: 380, y: 155, width: 85, height: 95, collision: true, visible: true },

  // Library Bookshelves (North-West & North-East walls)
  { id: 'shelf-1', type: 'bookshelf', x: 190, y: 70, width: 86, height: 120, collision: true, visible: true },
  { id: 'shelf-2', type: 'bookshelf-alt', x: 280, y: 70, width: 86, height: 120, collision: true, visible: true },
  { id: 'shelf-3', type: 'bookshelf', x: 1430, y: 70, width: 86, height: 120, collision: true, visible: true },
  { id: 'shelf-4', type: 'bookshelf-alt', x: 1520, y: 70, width: 86, height: 120, collision: true, visible: true },

  // Left Classroom Study Desks Wing (Spacious layout, 160px aisles)
  { id: 'table-l1', type: 'desk', x: 200, y: 380, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-l2', type: 'desk', x: 480, y: 380, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-l3', type: 'desk', x: 200, y: 580, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-l4', type: 'desk', x: 480, y: 580, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-l5', type: 'desk', x: 340, y: 780, width: 160, height: 85, collision: true, visible: true },

  // Right Classroom Study Desks Wing (Wide 440px central aisle x: 640 to 1080)
  { id: 'table-r1', type: 'desk', x: 1140, y: 380, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-r2', type: 'desk', x: 1420, y: 380, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-r3', type: 'desk', x: 1140, y: 580, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-r4', type: 'desk', x: 1420, y: 580, width: 160, height: 85, collision: true, visible: true },
  { id: 'table-r5', type: 'desk', x: 1280, y: 780, width: 160, height: 85, collision: true, visible: true },

  // Gaming & Arcade Lounge (South-West)
  { id: 'game-zone', type: 'game-zone', x: 90, y: 920, width: 360, height: 220, collision: false, visible: true },
  { id: 'arcade-1', type: 'arcade', x: 140, y: 970, width: 65, height: 80, collision: true, visible: true },
  { id: 'arcade-2', type: 'arcade', x: 240, y: 970, width: 65, height: 80, collision: true, visible: true },
  { id: 'chest-1', type: 'chest', x: 350, y: 980, width: 52, height: 45, collision: true, visible: true },

  // Cozy Reading & Coffee Corner (South-East)
  { id: 'reading-zone', type: 'reading-zone', x: 1340, y: 920, width: 360, height: 220, collision: false, visible: true },
  { id: 'coffee-desk', type: 'desk', x: 1440, y: 975, width: 160, height: 85, collision: true, visible: true },
  { id: 'chest-2', type: 'chest', x: 1360, y: 985, width: 52, height: 45, collision: true, visible: true },
];

// Room decorative asset items (from user-provided pixel sheet)
export const DECORATIVE_ASSETS = [
  // North Wall Decorative Wood Panels with Blue Wallpaper
  { id: 'wall-stairs-nw', type: 'wall-stairs', x: 50, y: 0, width: 120, height: 110, zIndex: 5 },
  { id: 'wall-blue-1', type: 'wall-blue', x: 170, y: 0, width: 480, height: 110, zIndex: 5 },
  { id: 'wall-blue-2', type: 'wall-blue', x: 1150, y: 0, width: 480, height: 110, zIndex: 5 },
  { id: 'wall-stairs-ne', type: 'wall-stairs', x: 1630, y: 0, width: 120, height: 110, zIndex: 5 },

  // Presentation Stage Royal Red Carpets
  { id: 'stage-carpet-bg', type: 'carpet-large', x: 630, y: 55, width: 540, height: 220, zIndex: 2 },

  // Grand Central Aisle Red Runner Carpets (guiding players to the stage)
  { id: 'runner-1', type: 'carpet-runner', x: 852, y: 310, width: 96, height: 220, zIndex: 2 },
  { id: 'runner-2', type: 'carpet-runner', x: 852, y: 530, width: 96, height: 220, zIndex: 2 },
  { id: 'runner-3', type: 'carpet-runner', x: 852, y: 750, width: 96, height: 220, zIndex: 2 },

  // Potted Plants
  { id: 'plant-stage-l', type: 'plant', x: 580, y: 180, width: 42, height: 70 },
  { id: 'plant-stage-r', type: 'plant', x: 1180, y: 180, width: 42, height: 70 },
  { id: 'plant-west-aisle', type: 'plant', x: 120, y: 440, width: 42, height: 70 },
  { id: 'plant-east-aisle', type: 'plant', x: 1640, y: 440, width: 42, height: 70 },
  { id: 'plant-south-w', type: 'plant', x: 380, y: 1040, width: 42, height: 70 },
  { id: 'plant-south-e', type: 'plant', x: 1650, y: 1040, width: 42, height: 70 },

  // Reading & Game Area Carpets
  { id: 'rug-game', type: 'carpet-medium', x: 120, y: 960, width: 220, height: 110, zIndex: 2 },
  { id: 'rug-reading', type: 'carpet-medium', x: 1400, y: 960, width: 240, height: 110, zIndex: 2 },

  // Comfortable Armchairs at Reading Lounge & Corners
  { id: 'chair-read-1', type: 'armchair-blue', x: 1615, y: 980, width: 48, height: 66, zIndex: 1050 },
  { id: 'chair-read-2', type: 'armchair-gold', x: 1370, y: 980, width: 48, height: 62, zIndex: 1050 },

  // Classical Study Lamps
  { id: 'lamp-stage-l', type: 'lamp', x: 640, y: 220, width: 26, height: 50 },
  { id: 'lamp-stage-r', type: 'lamp', x: 1130, y: 220, width: 26, height: 50 },
  { id: 'lamp-read', type: 'lamp', x: 1540, y: 960, width: 26, height: 50 },
];
