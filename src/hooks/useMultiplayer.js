import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMultiplayer(localPlayerState, username, color) {
  const [players, setPlayers] = useState(new Map());
  const channelRef = useRef(null);
  const myIdRef = useRef(`player-${Math.random().toString(36).substring(2, 9)}`);
  
  // Throttle broadcast
  const lastBroadcastRef = useRef(0);

  const localPlayerStateRef = useRef(localPlayerState);

  useEffect(() => {
    localPlayerStateRef.current = localPlayerState;
  }, [localPlayerState]);

  useEffect(() => {
    // If Supabase URL isn't set, just run locally
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('Supabase URL not set, multiplayer disabled.');
      return;
    }

    const channel = supabase.channel('learning-room', {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: myIdRef.current },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPlayers((prev) => {
          const next = new Map();
          for (const [key, presenceData] of Object.entries(newState)) {
            if (key === myIdRef.current) continue; // Skip self

            if (presenceData && presenceData.length > 0) {
              const data = presenceData[0];
              const existing = prev.get(key);

              if (existing) {
                // Keep the latest position received from real-time movement broadcast
                // Only update metadata like username and color if changed
                next.set(key, {
                  ...existing,
                  username: data.username || existing.username,
                  color: data.color || existing.color,
                });
              } else {
                // New player joined
                next.set(key, {
                  id: key,
                  username: data.username || 'Student',
                  color: data.color || '#3b82f6',
                  x: data.x != null ? data.x : 500,
                  y: data.y != null ? data.y : 410,
                  direction: data.direction || 'down',
                  isMoving: false,
                });
              }
            }
          }
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPlayers((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .on('broadcast', { event: 'movement' }, ({ payload }) => {
        if (!payload || payload.id === myIdRef.current) return;

        setPlayers((prev) => {
          const next = new Map(prev);
          const existing = next.get(payload.id);

          next.set(payload.id, {
            id: payload.id,
            username: payload.username || (existing ? existing.username : 'Student'),
            color: payload.color || (existing ? existing.color : '#3b82f6'),
            x: payload.x,
            y: payload.y,
            direction: payload.direction || (existing ? existing.direction : 'down'),
            isMoving: !!payload.isMoving,
          });

          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const currentState = localPlayerStateRef.current;
          await channel.track({
            id: myIdRef.current,
            username,
            color,
            x: currentState.x,
            y: currentState.y,
            direction: currentState.direction,
            isMoving: currentState.isMoving,
          });
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [username, color]); // Mount only once per identity

  // Broadcast movement when local state changes
  useEffect(() => {
    if (!channelRef.current || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    if (!localPlayerState.isMoving && lastBroadcastRef.current === -1) return; // Prevent spamming stop

    const now = Date.now();
    // Throttle to roughly 20fps for broadcast
    if (now - lastBroadcastRef.current > 50 || !localPlayerState.isMoving) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'movement',
        payload: {
          id: myIdRef.current,
          x: localPlayerState.x,
          y: localPlayerState.y,
          direction: localPlayerState.direction,
          isMoving: localPlayerState.isMoving,
          username,
          color
        },
      });
      lastBroadcastRef.current = localPlayerState.isMoving ? now : -1;
    }
  }, [localPlayerState.x, localPlayerState.y, localPlayerState.direction, localPlayerState.isMoving]);

  return {
    players: Array.from(players.values()),
    myId: myIdRef.current,
    connected: !!process.env.NEXT_PUBLIC_SUPABASE_URL
  };
}
