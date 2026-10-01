import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GAME_PHASES, generateMasterPrompt } from '@/lib/gamePhases';

export function useMultiplayer(localPlayerState, username, color, options = {}) {
  const { 
    fullName = '', 
    attendanceNo = '', 
    roomCode = 'LOBBY1', 
    roomName: initialRoomName = '', 
    characterIndex = 1, 
    isAdmin = false,
    onRoomFull 
  } = options;
  const [players, setPlayers] = useState(new Map());
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [roomName, setRoomName] = useState(initialRoomName || 'Kelas Virtual');
  const [gameStarted, setGameStarted] = useState(true);

  // GAME PHASE STATE
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.WAITING);
  const [storyPhase, setStoryPhase] = useState(null);
  const [playerRoles, setPlayerRoles] = useState({});
  const [masterPromptData, setMasterPromptData] = useState(null);

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

    const cleanRoomCode = (roomCode || 'LOBBY1').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const channel = supabase.channel(`room:${cleanRoomCode}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: myIdRef.current },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const allPresenceKeys = Object.keys(newState);
        const totalCount = allPresenceKeys.length;
        setPlayerCount(totalCount);

        // Limit 4 players check: If total players > 4 and local player is not in presence state yet or room capacity exceeded
        const isSelfPresent = allPresenceKeys.includes(myIdRef.current);
        if (totalCount > 4 && !isSelfPresent) {
          setIsRoomFull(true);
          if (onRoomFull) onRoomFull();
          return;
        }

        // Sync synced room name & gameStarted if available from any player
        for (const [, presenceData] of Object.entries(newState)) {
          if (presenceData && presenceData.length > 0) {
            if (presenceData[0].roomName) {
              setRoomName(presenceData[0].roomName);
            }
            if (presenceData[0].gameStarted) {
              setGameStarted(true);
            }
          }
        }

        setPlayers((prev) => {
          const next = new Map();
          for (const [key, presenceData] of Object.entries(newState)) {
            if (key === myIdRef.current) continue; // Skip self

            if (presenceData && presenceData.length > 0) {
              const data = presenceData[0];
              const existing = prev.get(key);

              if (existing) {
                next.set(key, {
                  ...existing,
                  username: data.username || existing.username,
                  fullName: data.fullName || existing.fullName,
                  attendanceNo: data.attendanceNo || existing.attendanceNo,
                  characterIndex: data.characterIndex || existing.characterIndex || 1,
                  isAdmin: !!data.isAdmin,
                  color: data.color || existing.color,
                });
              } else {
                next.set(key, {
                  id: key,
                  username: data.username || 'Student',
                  fullName: data.fullName || '',
                  attendanceNo: data.attendanceNo || '',
                  characterIndex: data.characterIndex || 1,
                  isAdmin: !!data.isAdmin,
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
      .on('broadcast', { event: 'gameStart' }, () => {
        setGameStarted(true);
      })
      .on('broadcast', { event: 'phaseChange' }, ({ payload }) => {
        if (!payload) return;
        if (payload.phase) setGamePhase(payload.phase);
        if (typeof payload.storyPhase !== 'undefined') setStoryPhase(payload.storyPhase);
        if (payload.phase !== GAME_PHASES.WAITING) setGameStarted(true);
      })
      .on('broadcast', { event: 'roleAssignment' }, ({ payload }) => {
        if (!payload) return;
        setPlayerRoles(payload.roles || {});
        // Update roles in players map
        if (payload.roles) {
          setPlayers((prev) => {
            const next = new Map(prev);
            for (const [id, role] of Object.entries(payload.roles)) {
              if (next.has(id)) {
                next.set(id, { ...next.get(id), role });
              }
            }
            return next;
          });
        }
      })
      .on('broadcast', { event: 'masterPromptCommitted' }, ({ payload }) => {
        if (!payload) return;
        setMasterPromptData(payload.data || null);
      })
      .on('broadcast', { event: 'roomNameUpdate' }, ({ payload }) => {
        if (payload && payload.roomName) {
          setRoomName(payload.roomName);
        }
      })
      .on('broadcast', { event: 'movement' }, ({ payload }) => {
        if (!payload || payload.id === myIdRef.current) return;

        setPlayers((prev) => {
          const next = new Map(prev);
          const existing = next.get(payload.id);

          next.set(payload.id, {
            id: payload.id,
            username: payload.username || (existing ? existing.username : 'Student'),
            fullName: payload.fullName || (existing ? existing.fullName : ''),
            attendanceNo: payload.attendanceNo || (existing ? existing.attendanceNo : ''),
            characterIndex: payload.characterIndex || (existing ? existing.characterIndex : 1),
            isAdmin: typeof payload.isAdmin !== 'undefined' ? !!payload.isAdmin : (existing ? !!existing.isAdmin : false),
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
          
          // Check current presence before tracking if room is full
          const currentPresence = channel.presenceState();
          const activeKeys = Object.keys(currentPresence);
          if (activeKeys.length >= 4 && !activeKeys.includes(myIdRef.current)) {
            setIsRoomFull(true);
            if (onRoomFull) onRoomFull();
            return;
          }

          await channel.track({
            id: myIdRef.current,
            username,
            fullName,
            attendanceNo,
            characterIndex,
            isAdmin,
            gameStarted,
            color,
            roomName: roomName || initialRoomName || 'Kelas Virtual',
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
  }, [username, color, roomCode, fullName, attendanceNo, isAdmin]);

  // Function untuk admin memulai game
  const startGame = async () => {
    setGameStarted(true);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Re-track presence with gameStarted: true
      const currentState = localPlayerStateRef.current;
      channelRef.current.track({
        id: myIdRef.current,
        username,
        fullName,
        attendanceNo,
        characterIndex,
        isAdmin,
        gameStarted: true,
        color,
        roomName,
        x: currentState.x,
        y: currentState.y,
        direction: currentState.direction,
        isMoving: currentState.isMoving,
      });

      // Broadcast gameStart event ke semua player
      channelRef.current.send({
        type: 'broadcast',
        event: 'gameStart',
        payload: { startedAt: new Date().toISOString() },
      });
    }
  };

  // Function to start the narrative story
  const startStory = async () => {
    setGamePhase(GAME_PHASES.PHASE_1);
    setStoryPhase('phase_1');
    setGameStarted(true);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'phaseChange',
        payload: {
          phase: GAME_PHASES.PHASE_1,
          storyPhase: 'phase_1',
          startedAt: new Date().toISOString()
        }
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'gameStart',
        payload: { startedAt: new Date().toISOString() }
      });
    }
  };

  // Function to transition game phase
  const advancePhase = async (nextPhase, nextStoryPhase) => {
    setGamePhase(nextPhase);
    setStoryPhase(nextStoryPhase || null);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'phaseChange',
        payload: {
          phase: nextPhase,
          storyPhase: nextStoryPhase || null,
          advancedAt: new Date().toISOString()
        }
      });
    }
  };

  // Function to assign player roles
  const assignRoles = async (roleAssignment) => {
    setPlayerRoles(roleAssignment);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'roleAssignment',
        payload: { roles: roleAssignment }
      });
    }
  };

  // Function to commit master prompt
  const commitMasterPrompt = async (promptData) => {
    setMasterPromptData(promptData);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabase.from) {
        const { error } = await supabase
          .from('master_prompts')
          .insert([{
            game_name: promptData.gameName || 'Untitled Game',
            genre: promptData.genre || '',
            target_user: promptData.targetUser || '',
            game_goal: promptData.gameGoal || '',
            core_gameplay: promptData.coreGameplay || '',
            target_duration: promptData.targetDuration || '',
            dev_level: promptData.devLevel || '',
            device_condition: promptData.deviceCondition || '',
            full_prompt: generateMasterPrompt(promptData),
            created_at: new Date().toISOString(),
            created_by: username
          }]);
        if (error) {
          console.warn('Could not insert to master_prompts table:', error.message);
        }
      }
    } catch (err) {
      console.warn('Master prompt save error:', err);
    }

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'masterPromptCommitted',
        payload: { data: promptData }
      });
    }
  };

  // Function to dynamically update room name for everyone
  const updateRoomName = (newName) => {
    setRoomName(newName);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Re-track presence with updated roomName
      const currentState = localPlayerStateRef.current;
      channelRef.current.track({
        id: myIdRef.current,
        username,
        fullName,
        attendanceNo,
        characterIndex,
        isAdmin,
        gameStarted,
        color,
        roomName: newName,
        x: currentState.x,
        y: currentState.y,
        direction: currentState.direction,
        isMoving: currentState.isMoving,
      });

      // Broadcast room name change immediately
      channelRef.current.send({
        type: 'broadcast',
        event: 'roomNameUpdate',
        payload: { roomName: newName },
      });
    }
  };

  // Broadcast movement when local state changes
  useEffect(() => {
    if (!channelRef.current || !process.env.NEXT_PUBLIC_SUPABASE_URL || isRoomFull) return;
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
          fullName,
          attendanceNo,
          characterIndex,
          isAdmin,
          color
        },
      });
      lastBroadcastRef.current = localPlayerState.isMoving ? now : -1;
    }
  }, [localPlayerState.x, localPlayerState.y, localPlayerState.direction, localPlayerState.isMoving, isRoomFull, isAdmin]);

  const playerList = Array.from(players.values());
  const hasAdminOnline = isAdmin || playerList.some(p => p.isAdmin);

  return {
    players: playerList,
    myId: myIdRef.current,
    connected: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    isRoomFull,
    playerCount,
    roomName,
    updateRoomName,
    gameStarted,
    hasAdminOnline,
    startGame,
    // Phase and story states & controls
    gamePhase,
    storyPhase,
    playerRoles,
    masterPromptData,
    startStory,
    advancePhase,
    assignRoles,
    commitMasterPrompt,
  };
}
