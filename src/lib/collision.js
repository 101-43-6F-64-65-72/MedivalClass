import { MAP_OBJECTS, ROOM_WIDTH, ROOM_HEIGHT } from './constants';

// Precise collision detection for 2.5D / semi-isometric perspective
// Hitbox is focused on player's feet (bottom portion) so upper body can naturally overlap/depth-sort with furniture
export function checkCollision(x, y, width = 32, height = 48) {
  // Hitbox focused on feet area with optimal maneuverability
  const hitboxWidth = 20;
  const hitboxHeight = 14;
  const hitboxX = x + (width - hitboxWidth) / 2;
  const hitboxY = y + (height - hitboxHeight);

  for (const obj of MAP_OBJECTS) {
    if (!obj.collision) continue;

    if (
      hitboxX < obj.x + obj.width &&
      hitboxX + hitboxWidth > obj.x &&
      hitboxY < obj.y + obj.height &&
      hitboxY + hitboxHeight > obj.y
    ) {
      return true; // Collision detected
    }
  }

  // Room boundary walls check
  if (
    hitboxX < 50 || 
    hitboxY < 70 || 
    hitboxX + hitboxWidth > ROOM_WIDTH - 50 || 
    hitboxY + hitboxHeight > ROOM_HEIGHT - 50
  ) {
    return true;
  }

  return false;
}

// Generate a safe spawn position in the classroom entrance aisle
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

