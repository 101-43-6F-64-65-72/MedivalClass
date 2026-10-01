export const ROOM_WIDTH = 1800;
export const ROOM_HEIGHT = 1200;
export const TILE_SIZE = 32;
export const PLAYER_SPEED = 230; // pixels per second

export const MAP_OBJECTS = [
  // Room Boundary Walls
  { id: 'wall-top', type: 'wall', x: 0, y: 0, width: ROOM_WIDTH, height: 110, collision: true, visible: true },
  { id: 'wall-bottom', type: 'wall', x: 0, y: ROOM_HEIGHT - 40, width: ROOM_WIDTH, height: 40, collision: true, visible: true },
  { id: 'wall-left', type: 'wall', x: 0, y: 0, width: 40, height: ROOM_HEIGHT, collision: true, visible: true },
  { id: 'wall-right', type: 'wall', x: ROOM_WIDTH - 40, y: 0, width: 40, height: ROOM_HEIGHT, collision: true, visible: true },

  // ==========================================
  // FRONT OF CLASSROOM: Canva Presentation Screen
  // Mounted gracefully against front wainscoted wall
  // ==========================================
  { id: 'screen', type: 'screen', x: 540, y: 35, width: 720, height: 405, collision: true, visible: true },

  // Front Wall Decorative Accents
  { id: 'chalkboard-front', type: 'chalkboard', x: 230, y: 35, width: 96, height: 68, collision: false, visible: true },
  { id: 'win-top-l', type: 'window', x: 360, y: 15, width: 80, height: 96, collision: false, visible: true },
  { id: 'noticeboard-front', type: 'noticeboard', x: 1300, y: 35, width: 64, height: 64, collision: false, visible: true },
  { id: 'win-top-r', type: 'window', x: 1400, y: 15, width: 80, height: 96, collision: false, visible: true },

  // Front Stage Plants
  { id: 'plant-stage-l', type: 'plant', x: 440, y: 430, width: 56, height: 64, collision: true, visible: true },
  { id: 'plant-stage-r', type: 'plant', x: 1300, y: 430, width: 56, height: 64, collision: true, visible: true },

  // Teacher Area (Desk includes armchair, banker's lamp, ledger, apple)
  { id: 'teacher-desk', type: 'teacher-desk', x: 800, y: 500, width: 200, height: 95, collision: true, visible: true },
  { id: 'teacher-globe', type: 'globe', x: 1020, y: 520, width: 48, height: 58, collision: true, visible: true },

  // ==========================================
  // MIDDLE: Student Desks (Left Wing)
  // Each desk includes 2 built-in chairs, notebooks, & pencils
  // ==========================================
  // Row 1
  { id: 'desk-l1', type: 'student-desk', x: 200, y: 685, width: 150, height: 85, collision: true, visible: true },
  { id: 'desk-l2', type: 'student-desk', x: 440, y: 685, width: 150, height: 85, collision: true, visible: true },

  // Row 2
  { id: 'desk-l3', type: 'student-desk', x: 200, y: 865, width: 150, height: 85, collision: true, visible: true },
  { id: 'desk-l4', type: 'student-desk', x: 440, y: 865, width: 150, height: 85, collision: true, visible: true },

  // ==========================================
  // MIDDLE: Student Desks (Right Wing)
  // ==========================================
  // Row 1
  { id: 'desk-r1', type: 'student-desk', x: 1210, y: 685, width: 150, height: 85, collision: true, visible: true },
  { id: 'desk-r2', type: 'student-desk', x: 1450, y: 685, width: 150, height: 85, collision: true, visible: true },

  // Row 2
  { id: 'desk-r3', type: 'student-desk', x: 1210, y: 865, width: 150, height: 85, collision: true, visible: true },
  { id: 'desk-r4', type: 'student-desk', x: 1450, y: 865, width: 150, height: 85, collision: true, visible: true },

  // ==========================================
  // WEST SIDE (Left Wall): Library & Storage
  // ==========================================
  { id: 'shelf-w1', type: 'bookshelf', x: 45, y: 150, width: 120, height: 130, collision: true, visible: true },
  { id: 'shelf-w2', type: 'bookshelf-alt', x: 45, y: 310, width: 120, height: 130, collision: true, visible: true },
  { id: 'clock-w', type: 'clock', x: 80, y: 470, width: 36, height: 74, collision: false, visible: true },
  { id: 'shelf-w3', type: 'bookshelf', x: 45, y: 560, width: 120, height: 130, collision: true, visible: true },
  { id: 'plant-w', type: 'plant', x: 65, y: 980, width: 56, height: 64, collision: true, visible: true },

  // ==========================================
  // EAST SIDE (Right Wall): Library & Notices
  // ==========================================
  { id: 'shelf-e1', type: 'bookshelf', x: 1635, y: 150, width: 120, height: 130, collision: true, visible: true },
  { id: 'shelf-e2', type: 'bookshelf-alt', x: 1635, y: 310, width: 120, height: 130, collision: true, visible: true },
  { id: 'noticeboard-e', type: 'noticeboard', x: 1660, y: 470, width: 64, height: 64, collision: false, visible: true },
  { id: 'shelf-e3', type: 'bookshelf', x: 1635, y: 560, width: 120, height: 130, collision: true, visible: true },
  { id: 'plant-e', type: 'plant', x: 1660, y: 980, width: 56, height: 64, collision: true, visible: true },

  // ==========================================
  // BACK (South Entrance)
  // ==========================================
  { id: 'door-main', type: 'door', x: 852, y: 1104, width: 96, height: 96, collision: false, visible: true },
  { id: 'plant-door-l', type: 'plant', x: 770, y: 1110, width: 56, height: 64, collision: true, visible: true },
  { id: 'plant-door-r', type: 'plant', x: 970, y: 1110, width: 56, height: 64, collision: true, visible: true },
];

export const DECORATIVE_ASSETS = [
  // Stardew Valley Persian/Rustic Carpet Runner under presentation & teacher stage
  { id: 'stage-carpet-bg', type: 'rug', x: 520, y: 440, width: 760, height: 340, zIndex: 2 },
];

export const NPC_COLLIDERS = [
  { id: 'npc-qeebos', name: 'Qeebos', x: 730, y: 530 },
  { id: 'npc-imanuel', name: 'Imanuel', x: 95, y: 800 },
  { id: 'npc-krisna', name: 'Krisna', x: 1715, y: 720 },
  { id: 'npc-dzakih', name: 'Dzakih', x: 1250, y: 955 },
];

export const ASSET_PATHS = {
  CHARACTERS: '/assets/RPG Maker MZ (48x48)/characters',
  TILESETS: '/assets/New folder/tilesets',
};

export const GAME_CONFIG = {
  MAX_PLAYERS: 4,
  TILE_SIZE: 32,
  ROOM_WIDTH: 1800,
  ROOM_HEIGHT: 1200,
  PLAYER_SPEED: 230,
};

export const STORY_DURATIONS = {
  SCENE_SHORT: 3000,
  SCENE_MEDIUM: 5000,
  SCENE_LONG: 8000,
};

export const PLAYER_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
];
