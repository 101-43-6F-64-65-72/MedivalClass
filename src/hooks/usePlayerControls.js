import { useState, useEffect, useRef } from 'react';
import { PLAYER_SPEED, ROOM_WIDTH, ROOM_HEIGHT } from '@/lib/constants';
import { checkCollision, getSafeSpawnPosition } from '@/lib/collision';

export function usePlayerControls(initialX, initialY, isControlsEnabled = true) {
  const [playerState, setPlayerState] = useState(() => {
    if (initialX != null && initialY != null) {
      return { x: initialX, y: initialY, direction: 'up', isMoving: false };
    }
    const safeSpawn = getSafeSpawnPosition();
    return { x: safeSpawn.x, y: safeSpawn.y, direction: 'up', isMoving: false };
  });

  const keysRef = useRef({
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  });

  const stateRef = useRef(playerState);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(null);
  const isEnabledRef = useRef(isControlsEnabled);

  useEffect(() => {
    isEnabledRef.current = isControlsEnabled;
    if (!isControlsEnabled) {
      // Reset all keys when controls are disabled (e.g. presentation focused)
      Object.keys(keysRef.current).forEach((k) => {
        keysRef.current[k] = false;
      });
      setPlayerState((prev) => (prev.isMoving ? { ...prev, isMoving: false } : prev));
    }
  }, [isControlsEnabled]);

  // Define player size for collision
  const playerWidth = 32;
  const playerHeight = 48;

  useEffect(() => {
    stateRef.current = playerState;
  }, [playerState]);

  const isTypingInField = () => {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEnabledRef.current || isTypingInField()) return;
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

    // When user clicks into chat or an input field, immediately stop any running movement
    const handleFocusIn = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        Object.keys(keysRef.current).forEach((k) => {
          keysRef.current[k] = false;
        });
        setPlayerState((prev) => (prev.isMoving ? { ...prev, isMoving: false } : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('focusin', handleFocusIn);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('focusin', handleFocusIn);
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

    // Immediately stop moving if controls are disabled or user is typing in chat/input
    if (!isEnabledRef.current || isTypingInField()) {
      if (stateRef.current.isMoving) {
        setPlayerState((prev) => (prev.isMoving ? { ...prev, isMoving: false } : prev));
      }
      requestRef.current = requestAnimationFrame(updatePosition);
      return;
    }

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

      const canMoveX = !checkCollision(newX, stateRef.current.y);
      const canMoveY = !checkCollision(stateRef.current.x, newY);

      if (canMoveX) finalX = newX;
      if (canMoveY) finalY = newY;

      // Check diagonal corner case
      if (canMoveX && canMoveY && checkCollision(finalX, finalY)) {
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
