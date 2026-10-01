import { MAP_OBJECTS, ROOM_WIDTH, ROOM_HEIGHT } from './constants';

/**
 * Returns the exact physical obstacle collision box for an object.
 * In 2.5D / semi-isometric perspective (like Stardew Valley), collision only
 * applies to the physical base/legs footprint, allowing characters to walk
 * behind chairs, stand close to tables, and depth-sort cleanly.
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
      // The upper 26px contains the student chairs (walkeable behind desk)
      // Physical table body & legs occupy y + 26 with 8px margin on sides
      return {
        x: obj.x + 8,
        y: obj.y + 26,
        width: Math.max(10, obj.width - 16),
        height: Math.max(10, obj.height - 32),
      };

    case 'teacher-desk':
      // Upper 30px is armchair space (walkeable behind desk)
      return {
        x: obj.x + 10,
        y: obj.y + 30,
        width: Math.max(10, obj.width - 20),
        height: Math.max(10, obj.height - 35),
      };

    case 'bookshelf':
    case 'bookshelf-alt':
    case 'bookshelf-narrow':
    case 'cabinet':
      // Physical plinth base (lower 46px) blocks walking
      return {
        x: obj.x + 6,
        y: obj.y + Math.max(0, obj.height - 46),
        width: Math.max(10, obj.width - 12),
        height: 44,
      };

    case 'plant':
      // Only the terracotta pot base blocks walking
      return {
        x: obj.x + 14,
        y: obj.y + 36,
        width: 28,
        height: 24,
      };

    case 'globe':
      // Wooden spindle pedestal base
      return {
        x: obj.x + 12,
        y: obj.y + 34,
        width: 24,
        height: 20,
      };

    case 'screen':
      // Front presentation screen boundary
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: Math.min(380, obj.height - 25),
      };

    case 'wall':
      if (obj.id === 'wall-top') {
        return {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: 104, // Right at the baseboard line
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
 * Hitbox is anchored strictly to the player's feet (shoes/ground contact),
 * allowing nimble movement through aisles and seamless corner-sliding.
 */
export function checkCollision(x, y, width = 32, height = 48) {
  // Hitbox focused on shoe contact area
  const hitboxWidth = 16;
  const hitboxHeight = 10;
  const hitboxX = x + (width - hitboxWidth) / 2;
  const hitboxY = y + height - hitboxHeight - 2;

  // 1. Room boundary walls check
  if (
    hitboxX < 45 || 
    hitboxY < 105 || 
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

    if (!checkCollision(randomX, randomY, 32, 48)) {
      return { x: randomX, y: randomY };
    }
  }

  // Fallback safe entrance coordinate in the main classroom aisle
  return { x: 900, y: 1010 };
}
