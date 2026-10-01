/**
 * RPG Maker Tile System
 * Setiap tile adalah 48x48px (berdasarkan RPG Maker MZ 48x48)
 * Room adalah grid dari tiles yang dapat di-compose
 */

// TILE CATEGORIES
export const TILE_CATEGORIES = {
  TERRAIN: 'terrain',
  BUILDING: 'building',
  FURNITURE: 'furniture',
  DECORATION: 'decoration',
  COLLISION: 'collision',
  SPAWN: 'spawn', // Player spawn point
};

// INDIVIDUAL TILES - Harbor themed
export const HARBOR_TILES = {
  // TERRAIN
  GRASS_1: {
    id: 'grass_1',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Rumput 1',
    spriteFrame: [0, 0],
    passable: true,
    collision: false,
  },
  GRASS_2: {
    id: 'grass_2',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Rumput 2',
    spriteFrame: [1, 0],
    passable: true,
    collision: false,
  },
  WATER_SHALLOW: {
    id: 'water_shallow',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Air Dangkal',
    spriteFrame: [0, 10],
    passable: false,
    collision: true,
  },
  WATER_DEEP: {
    id: 'water_deep',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Air Dalam',
    spriteFrame: [1, 10],
    passable: false,
    collision: true,
  },
  SAND: {
    id: 'sand',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Pasir Pantai',
    spriteFrame: [0, 5],
    passable: true,
    collision: false,
  },
  DOCK_WOOD: {
    id: 'dock_wood',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Dok Kayu',
    spriteFrame: [5, 0],
    passable: true,
    collision: false,
  },
  STONE_PATH: {
    id: 'stone_path',
    category: TILE_CATEGORIES.TERRAIN,
    name: 'Jalan Batu',
    spriteFrame: [3, 5],
    passable: true,
    collision: false,
  },

  // BUILDINGS
  WAREHOUSE_CORNER: {
    id: 'warehouse_corner',
    category: TILE_CATEGORIES.BUILDING,
    name: 'Gudang Sudut',
    spriteFrame: [0, 20],
    width: 2, // 2 tiles wide
    height: 2, // 2 tiles tall
    passable: false,
    collision: true,
    zIndex: 10,
  },
  WAREHOUSE_SIDE: {
    id: 'warehouse_side',
    category: TILE_CATEGORIES.BUILDING,
    name: 'Gudang Samping',
    spriteFrame: [2, 20],
    width: 2,
    height: 2,
    passable: false,
    collision: true,
    zIndex: 10,
  },
  HOUSE_SMALL: {
    id: 'house_small',
    category: TILE_CATEGORIES.BUILDING,
    name: 'Rumah Kecil',
    spriteFrame: [4, 20],
    width: 2,
    height: 2,
    passable: false,
    collision: true,
    zIndex: 10,
  },
  DOCK_STRUCTURE: {
    id: 'dock_structure',
    category: TILE_CATEGORIES.BUILDING,
    name: 'Struktur Dok',
    spriteFrame: [6, 20],
    width: 2,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 10,
  },

  // FURNITURE
  BARREL: {
    id: 'barrel',
    category: TILE_CATEGORIES.FURNITURE,
    name: 'Tong Barang',
    spriteFrame: [0, 30],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 5,
  },
  BOX: {
    id: 'box',
    category: TILE_CATEGORIES.FURNITURE,
    name: 'Kotak',
    spriteFrame: [1, 30],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 5,
  },
  CRATE: {
    id: 'crate',
    category: TILE_CATEGORIES.FURNITURE,
    name: 'Peti Kayu',
    spriteFrame: [2, 30],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 5,
  },
  ROPE_COIL: {
    id: 'rope_coil',
    category: TILE_CATEGORIES.FURNITURE,
    name: 'Gulungan Tali',
    spriteFrame: [3, 30],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 5,
  },
  ANCHOR: {
    id: 'anchor',
    category: TILE_CATEGORIES.FURNITURE,
    name: 'Jangkar',
    spriteFrame: [4, 30],
    width: 1,
    height: 1,
    passable: false,
    collision: false,
    zIndex: 3,
  },

  // DECORATION
  TREE: {
    id: 'tree',
    category: TILE_CATEGORIES.DECORATION,
    name: 'Pohon',
    spriteFrame: [0, 35],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 8,
  },
  BUSH: {
    id: 'bush',
    category: TILE_CATEGORIES.DECORATION,
    name: 'Semak',
    spriteFrame: [1, 35],
    width: 1,
    height: 1,
    passable: false,
    collision: true,
    zIndex: 4,
  },
  LANTERN: {
    id: 'lantern',
    category: TILE_CATEGORIES.DECORATION,
    name: 'Lentera',
    spriteFrame: [2, 35],
    width: 1,
    height: 1,
    passable: false,
    collision: false,
    zIndex: 5,
  },
  FLAG: {
    id: 'flag',
    category: TILE_CATEGORIES.DECORATION,
    name: 'Bendera',
    spriteFrame: [3, 35],
    width: 1,
    height: 1,
    passable: false,
    collision: false,
    zIndex: 6,
  },

  // SPAWN POINTS
  SPAWN_1: {
    id: 'spawn_1',
    category: TILE_CATEGORIES.SPAWN,
    name: 'Spawn Point 1',
    spriteFrame: null, // Invisible
    passable: true,
    collision: false,
    spawnIndex: 0,
  },
  SPAWN_2: {
    id: 'spawn_2',
    category: TILE_CATEGORIES.SPAWN,
    name: 'Spawn Point 2',
    spriteFrame: null,
    passable: true,
    collision: false,
    spawnIndex: 1,
  },
  SPAWN_3: {
    id: 'spawn_3',
    category: TILE_CATEGORIES.SPAWN,
    name: 'Spawn Point 3',
    spriteFrame: null,
    passable: true,
    collision: false,
    spawnIndex: 2,
  },
  SPAWN_4: {
    id: 'spawn_4',
    category: TILE_CATEGORIES.SPAWN,
    name: 'Spawn Point 4',
    spriteFrame: null,
    passable: true,
    collision: false,
    spawnIndex: 3,
  },
};

// PRESET ROOM LAYOUTS - AI bisa generate dari ini
export const PRESET_LAYOUTS = {
  HARBOR_SIMPLE: {
    id: 'harbor_simple',
    name: 'Pelabuhan Sederhana',
    width: 20,
    height: 15,
    tileSize: 48,
    description: 'Simple harbor dengan warehouse & dock',
    tiles: [
      // Contoh: [x, y, tileId]
      [0, 0, 'grass_1'],
      [1, 0, 'grass_2'],
    ]
  },
  
  HARBOR_COMPLEX: {
    id: 'harbor_complex',
    name: 'Pelabuhan Kompleks',
    width: 30,
    height: 20,
    tileSize: 48,
    description: 'Harbor dengan multiple building & interaksi',
    tiles: []
  },
};

/**
 * Function: Generate room layout dari tile data
 * AI nanti bisa pakai ini untuk dynamically create room
 */
export const generateRoomLayout = (roomConfig = {}) => {
  const { width = 20, height = 15, tileSize = 48 } = roomConfig;
  const tiles = [];
  
  // Initialize with grass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        tileId: Math.random() > 0.5 ? 'grass_1' : 'grass_2',
        tileData: HARBOR_TILES.GRASS_1
      });
    }
  }
  
  return {
    id: `generated_${Date.now()}`,
    name: 'Generated Harbor',
    width,
    height,
    tileSize,
    tiles
  };
};
