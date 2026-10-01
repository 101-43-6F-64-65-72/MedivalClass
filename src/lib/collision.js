import { MAP_OBJECTS, ROOM_WIDTH, ROOM_HEIGHT, NPC_COLLIDERS } from './constants';

/**
 * Returns the exact physical collision box for an obstacle on the classroom floor.
 * In 2.5D perspective, only the physical base footprint touching the floor blocks movement,
 * allowing characters to stand right at tables and depth-sort cleanly.
 */
export function getObjectCollider(obj) {
  if (obj.collider) {
    return {
      x: obj.x + (obj.collider.offsetX || 0),
      y: obj.y + (obj.collider.offsetY || 0),
      width: obj.collider.width || obj.width,
      height: obj.collider.height || obj.height,
    };
  }

  switch (obj.type) {
    case 'student-desk':
    case 'desk':
      // 150x85 student desk:
      // - Upper 24px allows student to stand/sit behind desk (y: obj.y + 4 to +24)
      // - Physical desk body & legs occupy y: obj.y + 24 to obj.y + 80
      return {
        x: obj.x + 6,
        y: obj.y + 24,
        width: Math.max(10, obj.width - 12),
        height: 56, // ends at obj.y + 80
      };

    case 'teacher-desk':
      // 200x95 teacher executive desk:
      // - Armchair area allows standing behind desk at y: obj.y + 28
      // - Solid desk drawers and base occupy y: obj.y + 28 to obj.y + 88
      return {
        x: obj.x + 6,
        y: obj.y + 28,
        width: Math.max(10, obj.width - 12),
        height: 60, // ends at obj.y + 88
      };

    case 'bookshelf':
    case 'bookshelf-alt':
    case 'bookshelf-narrow':
    case 'cabinet':
      // Oak bookcases against wall: solid structure from y: obj.y + 20 to obj.y + obj.height - 4
      return {
        x: obj.x + 4,
        y: obj.y + 20,
        width: Math.max(10, obj.width - 8),
        height: Math.max(10, obj.height - 24),
      };

    case 'plant':
      // Terracotta pot base on floor
      return {
        x: obj.x + 10,
        y: obj.y + 32,
        width: Math.max(10, obj.width - 20),
        height: Math.max(10, obj.height - 36),
      };

    case 'globe':
      // Wooden spindle pedestal base on floor
      return {
        x: obj.x + 8,
        y: obj.y + 30,
        width: Math.max(10, obj.width - 16),
        height: Math.max(10, obj.height - 34),
      };

    case 'screen':
      // Front presentation screen hangs against front wall down to y = obj.y + obj.height (440)
      // Solid collision from top wall down to bottom whiteboard frame at y = 440
      return {
        x: obj.x,
        y: 0,
        width: obj.width,
        height: obj.y + obj.height,
      };

    case 'wall':
      if (obj.id === 'wall-top') {
        return {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: 110, // Right at wall baseboard
        };
      }
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };

    default:
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };
  }
}

/**
 * Precise 2.5D collision detection
 * Coordinates (x, y) represent the center-bottom of the character's feet:
 * - x: horizontal center of sprite (48px sprite spans [x - 24, x + 24])
 * - y: bottom ground contact line of shoes (sprite spans [y - 48, y])
 */
export function checkCollision(x, y) {
  // Shoe contact area hitbox: 20px wide centered at x, 12px tall anchored at feet y
  const hitboxWidth = 20;
  const hitboxHeight = 12;
  const hitboxX = x - hitboxWidth / 2; // [x - 10, x + 10]
  const hitboxY = y - hitboxHeight;     // [y - 12, y]

  // 1. Room boundary walls check
  if (
    hitboxX < 45 || 
    hitboxY < 110 || 
    hitboxX + hitboxWidth > ROOM_WIDTH - 45 || 
    hitboxY + hitboxHeight > ROOM_HEIGHT - 45
  ) {
    return true;
  }

  // 2. Map objects obstacle check
  for (const obj of MAP_OBJECTS) {
    if (!obj.collision) continue;

    const col = getObjectCollider(obj);

    if (
      hitboxX < col.x + col.width &&
      hitboxX + hitboxWidth > col.x &&
      hitboxY < col.y + col.height &&
      hitboxY + hitboxHeight > col.y
    ) {
      return true; // Collision detected
    }
  }

  // 3. NPC solid obstacle check (Players bump into NPCs and cannot walk through or stack on them)
  if (Array.isArray(NPC_COLLIDERS)) {
    for (const npc of NPC_COLLIDERS) {
      const npcWidth = 30;
      const npcHeight = 22;
      const npcX = npc.x - npcWidth / 2; // [npc.x - 15, npc.x + 15]
      const npcY = npc.y - 18;           // [npc.y - 18, npc.y + 4]

      if (
        hitboxX < npcX + npcWidth &&
        hitboxX + hitboxWidth > npcX &&
        hitboxY < npcY + npcHeight &&
        hitboxY + hitboxHeight > npcY
      ) {
        return true; // Bumped into NPC
      }
    }
  }

  return false;
}

/**
 * Generate a safe spawn position in the central classroom entrance aisle
 */
export function getSafeSpawnPosition() {
  const baseArea = { minX: 870, maxX: 930, minY: 980, maxY: 1040 };
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const randomX = baseArea.minX + Math.floor(Math.random() * (baseArea.maxX - baseArea.minX));
    const randomY = baseArea.minY + Math.floor(Math.random() * (baseArea.maxY - baseArea.minY));

    if (!checkCollision(randomX, randomY)) {
      return { x: randomX, y: randomY };
    }
  }

  // Fallback safe entrance coordinate in the main classroom aisle
  return { x: 900, y: 1010 };
}
