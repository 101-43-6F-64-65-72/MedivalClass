import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GAME_PHASES, generateMasterPrompt } from '@/lib/gamePhases';

export function useMultiplayer(localPlayerState, username, color, options = {}) {
  const { 
    fullName = '', 
    attendanceNo = '', 
    studentClass = 'XI PPLG-B',
    roomCode = 'LOBBY1', 
    roomName: initialRoomName = '', 
    characterIndex = 1, 
    isAdmin = false,
    onRoomFull 
  } = options;

  const cleanRoomCode = (roomCode || 'LOBBY1').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const [players, setPlayers] = useState(new Map());
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [roomName, setRoomName] = useState(initialRoomName || 'Kelas Virtual');
  const [gameStarted, setGameStarted] = useState(true);

  // Spotlight & Active Class States
  const [spotlightPlayer, setSpotlightPlayer] = useState(null);
  const [activeClass, setActiveClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('virtual_active_class') || studentClass || 'XI PPLG-B';
    }
    return studentClass || 'XI PPLG-B';
  });

  // Emoticon States
  const [localEmote, setLocalEmote] = useState(null);
  const [remoteEmotes, setRemoteEmotes] = useState({});

  // In-Game Realtime Chat & Overhead Speech Bubble States
  const [chatMessages, setChatMessages] = useState([]);
  const [localChatBubble, setLocalChatBubble] = useState(null);
  const [remoteChatBubbles, setRemoteChatBubbles] = useState({});
  const [remotePets, setRemotePets] = useState({});

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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('Supabase URL not set, multiplayer running in local sandbox.');
      return;
    }

    // Shared Universe Channel: All groups inhabit the same classroom world
    const channel = supabase.channel('classroom:shared_universe', {
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
        setPlayerCount(allPresenceKeys.length);

        // Sync room name from presence if available
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
                  studentClass: data.studentClass || existing.studentClass || 'XI PPLG-B',
                  characterIndex: data.characterIndex || existing.characterIndex || 1,
                  isAdmin: !!data.isAdmin,
                  color: data.color || existing.color,
                  roomCode: data.roomCode || existing.roomCode || cleanRoomCode,
                  roomName: data.roomName || existing.roomName,
                });
              } else {
                next.set(key, {
                  id: key,
                  username: data.username || 'Student',
                  fullName: data.fullName || '',
                  attendanceNo: data.attendanceNo || '',
                  studentClass: data.studentClass || 'XI PPLG-B',
                  characterIndex: data.characterIndex || 1,
                  isAdmin: !!data.isAdmin,
                  color: data.color || '#3b82f6',
                  roomCode: data.roomCode || cleanRoomCode,
                  roomName: data.roomName || 'Kelas Virtual',
                  x: data.x != null ? data.x : 900,
                  y: data.y != null ? data.y : 1010,
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
        setRemoteEmotes((prev) => {
          const next = { ...prev };
          delete next[key];
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
      .on('broadcast', { event: 'spotlightChange' }, ({ payload }) => {
        setSpotlightPlayer(payload ? payload.spotlight : null);
      })
      .on('broadcast', { event: 'activeClassChange' }, ({ payload }) => {
        if (payload && payload.activeClass) {
          setActiveClass(payload.activeClass);
          try {
            localStorage.setItem('virtual_active_class', payload.activeClass);
          } catch (e) {}
        }
      })
      .on('broadcast', { event: 'emote' }, ({ payload }) => {
        if (!payload || payload.playerId === myIdRef.current) return;
        setRemoteEmotes((prev) => ({
          ...prev,
          [payload.playerId]: { id: payload.emoteId, time: payload.timestamp || Date.now() },
        }));
      })
      .on('broadcast', { event: 'chatMessage' }, ({ payload }) => {
        if (!payload || payload.senderId === myIdRef.current) return;
        setChatMessages((prev) => [...prev.slice(-49), payload]);
        setRemoteChatBubbles((prev) => ({
          ...prev,
          [payload.senderId]: {
            id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            text: payload.text,
            time: payload.timestamp || Date.now(),
          },
        }));
      })
      .on('broadcast', { event: 'petUpdate' }, ({ payload }) => {
        if (!payload || payload.playerId === myIdRef.current) return;
        setRemotePets((prev) => ({
          ...prev,
          [payload.playerId]: payload.petBreed,
        }));
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
            studentClass: payload.studentClass || (existing ? existing.studentClass : 'XI PPLG-B'),
            characterIndex: payload.characterIndex || (existing ? existing.characterIndex : 1),
            isAdmin: typeof payload.isAdmin !== 'undefined' ? !!payload.isAdmin : (existing ? !!existing.isAdmin : false),
            color: payload.color || (existing ? existing.color : '#3b82f6'),
            roomCode: payload.roomCode || (existing ? existing.roomCode : cleanRoomCode),
            roomName: payload.roomName || (existing ? existing.roomName : ''),
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
            fullName,
            attendanceNo,
            studentClass: studentClass || activeClass,
            characterIndex,
            isAdmin,
            gameStarted,
            color,
            roomCode: cleanRoomCode,
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
  }, [username, color, cleanRoomCode, fullName, attendanceNo, isAdmin]);

  // Function to broadcast an emoticon reaction
  const sendEmote = (emoteId) => {
    const emotePayload = { id: emoteId, time: Date.now() };
    setLocalEmote(emotePayload);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'emote',
        payload: {
          playerId: myIdRef.current,
          emoteId,
          timestamp: Date.now(),
        },
      });
    }
  };

  // Function to send in-game chat messages
  const sendMessage = (text, isTeamOnly = false) => {
    if (!text || !text.trim()) return;
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: myIdRef.current,
      senderName: username,
      attendanceNo,
      senderRoomCode: cleanRoomCode,
      text: text.trim(),
      isTeamOnly,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev.slice(-49), msg]);
    setLocalChatBubble({ id: msg.id, text: msg.text, time: msg.timestamp });

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chatMessage',
        payload: msg,
      });
    }
  };

  // Broadcast pet adoption or dismissal to other students
  const updatePet = (breedId) => {
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'petUpdate',
        payload: {
          playerId: myIdRef.current,
          petBreed: breedId,
          timestamp: Date.now(),
        },
      });
    }
  };

  const startGame = async () => {
    setGameStarted(true);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
        roomCode: cleanRoomCode,
        roomName,
        x: currentState.x,
        y: currentState.y,
        direction: currentState.direction,
        isMoving: currentState.isMoving,
      });

      channelRef.current.send({
        type: 'broadcast',
        event: 'gameStart',
        payload: { startedAt: new Date().toISOString() },
      });
    }
  };

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

  const updateRoomName = (newName) => {
    setRoomName(newName);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
        roomCode: cleanRoomCode,
        roomName: newName,
        x: currentState.x,
        y: currentState.y,
        direction: currentState.direction,
        isMoving: currentState.isMoving,
      });

      channelRef.current.send({
        type: 'broadcast',
        event: 'roomNameUpdate',
        payload: { roomName: newName },
      });
    }
  };

  // Broadcast movement
  useEffect(() => {
    if (!channelRef.current || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    if (!localPlayerState.isMoving && lastBroadcastRef.current === -1) return;

    const now = Date.now();
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
          studentClass: studentClass || activeClass,
          characterIndex,
          isAdmin,
          color,
          roomCode: cleanRoomCode,
          roomName
        },
      });
      lastBroadcastRef.current = localPlayerState.isMoving ? now : -1;
    }
  }, [localPlayerState.x, localPlayerState.y, localPlayerState.direction, localPlayerState.isMoving, isAdmin, cleanRoomCode, studentClass, activeClass]);

  // Spotlight functions
  const setSpotlight = (targetPlayerOrNull) => {
    setSpotlightPlayer(targetPlayerOrNull);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'spotlightChange',
        payload: { spotlight: targetPlayerOrNull },
      });
    }
  };

  // Change active class function
  const changeActiveClass = (newClass) => {
    setActiveClass(newClass);
    try {
      localStorage.setItem('virtual_active_class', newClass);
    } catch (e) {}
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'activeClassChange',
        payload: { activeClass: newClass },
      });
    }
  };

  const playerList = Array.from(players.values());
  const hasAdminOnline = isAdmin || playerList.some((p) => p.isAdmin);
  // Count how many players belong to my specific room/group
  const myGroupCount = 1 + playerList.filter(
    (p) => p.roomCode && p.roomCode.trim().toUpperCase() === cleanRoomCode
  ).length;

  return {
    players: playerList,
    myId: myIdRef.current,
    connected: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    isRoomFull: false,
    playerCount,
    myGroupCount,
    roomName,
    updateRoomName,
    gameStarted,
    hasAdminOnline,
    startGame,
    // Admin & Spotlight
    spotlightPlayer,
    setSpotlight,
    activeClass,
    changeActiveClass,
    // Emote system
    localEmote,
    remoteEmotes,
    sendEmote,
    // Realtime in-game chat system
    chatMessages,
    localChatBubble,
    remoteChatBubbles,
    sendMessage,
    // Pet companion system
    remotePets,
    updatePet,
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
