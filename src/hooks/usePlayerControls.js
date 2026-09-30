import { useState, useEffect, useRef } from 'react';
import { PLAYER_SPEED, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import { checkCollision, getSafeSpawnPosition } from '@/lib/collision';

export function usePlayerControls(initialX, initialY) {
  const [playerState, setPlayerState] = useState(() => {
    if (initialX != null && initialY != null) {
      return { x: initialX, y: initialY, direction: 'down', isMoving: false };
    }
    const safeSpawn = getSafeSpawnPosition();
    return { x: safeSpawn.x, y: safeSpawn.y, direction: 'down', isMoving: false };
  });

  const keysRef = useRef({
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  });

  const stateRef = useRef(playerState);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Define player size for collision
  const playerWidth = 32;
  const playerHeight = 48;

  useEffect(() => {
    stateRef.current = playerState;
  }, [playerState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keysRef.current.hasOwnProperty(e.key) || keysRef.current.hasOwnProperty(e.key.toLowerCase())) {
        keysRef.current[e.key] = true;
        keysRef.current[e.key.toLowerCase()] = true; // Handle uppercase letters
      }
    };

    const handleKeyUp = (e) => {
      if (keysRef.current.hasOwnProperty(e.key) || keysRef.current.hasOwnProperty(e.key.toLowerCase())) {
        keysRef.current[e.key] = false;
        keysRef.current[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updatePosition = (time) => {
    if (lastTimeRef.current == null) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updatePosition);
      return;
    }

    const rawDelta = (time - lastTimeRef.current) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1); // Clamp to prevent tunneling on lag spikes
    lastTimeRef.current = time;

    const keys = keysRef.current;
    let dx = 0;
    let dy = 0;
    let newDirection = stateRef.current.direction;
    let isMoving = false;

    if (keys.w || keys.ArrowUp) { dy -= 1; newDirection = 'up'; isMoving = true; }
    if (keys.s || keys.ArrowDown) { dy += 1; newDirection = 'down'; isMoving = true; }
    if (keys.a || keys.ArrowLeft) { dx -= 1; newDirection = 'left'; isMoving = true; }
    if (keys.d || keys.ArrowRight) { dx += 1; newDirection = 'right'; isMoving = true; }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    if (isMoving) {
      const newX = stateRef.current.x + dx * PLAYER_SPEED * deltaTime;
      const newY = stateRef.current.y + dy * PLAYER_SPEED * deltaTime;

      // Try X and Y axis separately for smooth sliding along walls
      let finalX = stateRef.current.x;
      let finalY = stateRef.current.y;

      const canMoveX = !checkCollision(newX, stateRef.current.y, playerWidth, playerHeight);
      const canMoveY = !checkCollision(stateRef.current.x, newY, playerWidth, playerHeight);

      if (canMoveX) finalX = newX;
      if (canMoveY) finalY = newY;

      // Check diagonal corner case
      if (canMoveX && canMoveY && checkCollision(finalX, finalY, playerWidth, playerHeight)) {
        // If combined diagonal hits an outer corner, move only along the primary axis
        if (Math.abs(dx) >= Math.abs(dy)) {
          finalY = stateRef.current.y;
        } else {
          finalX = stateRef.current.x;
        }
      }

      setPlayerState({
        x: finalX,
        y: finalY,
        direction: newDirection,
        isMoving: true
      });
    } else if (stateRef.current.isMoving) {
      // Stop moving
      setPlayerState(prev => ({ ...prev, isMoving: false }));
    }

    requestRef.current = requestAnimationFrame(updatePosition);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return playerState;
}
