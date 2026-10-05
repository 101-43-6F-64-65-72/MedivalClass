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
    groupNumber = null,
    characterIndex = 1, 
    isAdmin = false,
    isCreator = false,
    serverId = null,
    sessionId = null,
    myPlayerId = null,
    onRoomFull,
    onKicked,
    onJoinRequestReceived,
  } = options;

  const cleanRoomCode = (roomCode || 'LOBBY1').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const [players, setPlayers] = useState(new Map());
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [roomName, setRoomName] = useState(initialRoomName || 'Kelas Virtual');
  const [gameStarted, setGameStarted] = useState(true);
  const [currentUsername, setCurrentUsername] = useState(username || 'Siswa');
  const [currentFullName, setCurrentFullName] = useState(fullName || username || 'Siswa');
  const currentUsernameRef = useRef(currentUsername);
  currentUsernameRef.current = currentUsername;
  const currentFullNameRef = useRef(currentFullName);
  currentFullNameRef.current = currentFullName;

  // Pending room join requests awaiting host / creator approval
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);

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
  // Ping map: { [playerId]: latencyMs }
  const [pingMap, setPingMap] = useState({});
  // Team Shared Prompt Materials & Credentials
  const [teamSharedPrompts, setTeamSharedPrompts] = useState([]);

  // Group Dev Checklist Synchronization & Completion State
  const [groupDevTodos, setGroupDevTodos] = useState({
    dev1: false,
    dev2: false,
    dev3: false,
    dev4: false,
  });
  const [completedGroups, setCompletedGroups] = useState(new Set());

  // Admin Custom Aura State (subtle, customizable: 'biasa', 'love', 'bintang', 'none')
  const [adminAura, setAdminAura] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin_aura_config');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return { type: 'biasa', color: '#f59e0b' };
  });
  const adminAuraRef = useRef(adminAura);
  adminAuraRef.current = adminAura;

  // GAME PHASE STATE
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.WAITING);
  const [storyPhase, setStoryPhase] = useState(null);
  const [playerRoles, setPlayerRoles] = useState({});
  const [masterPromptData, setMasterPromptData] = useState(null);

  const channelRef = useRef(null);
  const myIdRef = useRef(myPlayerId || (typeof window !== 'undefined' ? sessionStorage.getItem('virtual_player_id') : null) || `player-${Math.random().toString(36).substring(2, 9)}`);
  if (myPlayerId && myIdRef.current !== myPlayerId) {
    myIdRef.current = myPlayerId;
  }
  
  // Throttle broadcast & RAF batching
  const lastBroadcastRef = useRef(0);
  const lastBroadcastPosRef = useRef({ x: 0, y: 0, isMoving: false });
  const localPlayerStateRef = useRef(localPlayerState);
  const pendingMovementUpdatesRef = useRef(new Map());
  const movementRafRef = useRef(null);

  useEffect(() => {
    localPlayerStateRef.current = localPlayerState;
  }, [localPlayerState]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('Supabase URL not set, multiplayer running in local sandbox.');
      return;
    }

    // Channel name is namespaced by server so parallel servers are isolated
    const channelName = serverId
      ? `classroom:server:${serverId}`
      : 'classroom:shared_universe';

    const channel = supabase.channel(channelName, {
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
          const seenAttendance = new Set();
          const seenUsernames = new Set();

          for (const [key, presenceData] of Object.entries(newState)) {
            if (key === myIdRef.current) continue; // Skip self

            if (presenceData && presenceData.length > 0) {
              const data = presenceData[0];

              // Skip diri sendiri jika attendanceNo sama atau id sama (mencegah bug kembar 2 diri sendiri)
              if (!isAdmin && attendanceNo && String(data.attendanceNo) === String(attendanceNo)) {
                continue;
              }
              if (!isAdmin && (data.id === myIdRef.current || (myPlayerId && data.id === myPlayerId))) {
                continue;
              }

              // Deduplikasi: hanya izinkan 1 siswa per nomor absen / username (kecuali admin)
              if (!data.isAdmin) {
                const attKey = data.attendanceNo ? String(data.attendanceNo).trim() : null;
                if (attKey && seenAttendance.has(attKey)) {
                  continue; // Lewati duplikat ghost
                }
                if (attKey) seenAttendance.add(attKey);

                const uKey = (data.username || '').toLowerCase().trim();
                if (uKey && seenUsernames.has(uKey)) {
                  continue; // Lewati duplikat ghost
                }
                if (uKey) seenUsernames.add(uKey);
              }

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
                  aura: data.aura || existing.aura || (data.isAdmin ? { type: 'biasa', color: '#f59e0b' } : null),
                  color: data.color || existing.color,
                  groupNumber: data.groupNumber || existing.groupNumber || null,
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
                  aura: data.aura || (data.isAdmin ? { type: 'biasa', color: '#f59e0b' } : null),
                  color: data.color || '#3b82f6',
                  groupNumber: data.groupNumber || null,
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
      .on('broadcast', { event: 'player-name-update' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setPlayers((prev) => {
          const next = new Map(prev);
          const p = next.get(payload.id);
          if (p) {
            next.set(payload.id, {
              ...p,
              username: payload.username || p.username,
              fullName: payload.fullName || p.fullName,
            });
          }
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
        // Group isolation: team-only messages are only received by same group members or Admin
        if (payload.isTeamOnly) {
          const isSameGroup = payload.senderRoomCode && cleanRoomCode && 
            payload.senderRoomCode.trim().toUpperCase() === cleanRoomCode.trim().toUpperCase();
          if (!isSameGroup && !isAdmin) return;
        }

        setChatMessages((prev) => [...prev.slice(-99), payload]);
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
      .on('broadcast', { event: 'ping-report' }, ({ payload }) => {
        if (!payload || payload.playerId === myIdRef.current) return;
        setPingMap((prev) => ({ ...prev, [payload.playerId]: payload.ping }));
      })
      .on('broadcast', { event: 'teamSharedPrompt' }, ({ payload }) => {
        if (!payload) return;
        // Strict group scoping: only members of the same group receive this
        if (payload.roomCode && cleanRoomCode && payload.roomCode.trim().toUpperCase() === cleanRoomCode.trim().toUpperCase()) {
          setTeamSharedPrompts((prev) => {
            const filtered = prev.filter((item) => item.id !== payload.id);
            return [payload, ...filtered];
          });
        }
      })
      .on('broadcast', { event: 'teamDeleteSharedPrompt' }, ({ payload }) => {
        if (!payload) return;
        if (payload.roomCode && cleanRoomCode && payload.roomCode.trim().toUpperCase() === cleanRoomCode.trim().toUpperCase()) {
          setTeamSharedPrompts((prev) => prev.filter((item) => item.id !== payload.id));
        }
      })
      .on('broadcast', { event: 'groupDevTodoChange' }, ({ payload }) => {
        if (!payload || !payload.roomCode) return;
        const targetCode = payload.roomCode.trim().toUpperCase();

        if (cleanRoomCode && targetCode === cleanRoomCode) {
          if (payload.todos) {
            setGroupDevTodos(payload.todos);
          }
        }

        if (payload.isAllCompleted) {
          setCompletedGroups((prev) => new Set(prev).add(targetCode));
        } else {
          setCompletedGroups((prev) => {
            const next = new Set(prev);
            next.delete(targetCode);
            return next;
          });
        }
      })
      .on('broadcast', { event: 'adminAuraChange' }, ({ payload }) => {
        if (!payload || !payload.aura) return;
        setPlayers((prev) => {
          const next = new Map(prev);
          next.forEach((p, id) => {
            if (p.isAdmin || (payload.adminId && id === payload.adminId)) {
              next.set(id, { ...p, aura: payload.aura });
            }
          });
          return next;
        });
      })
      .on('broadcast', { event: 'member-kicked' }, ({ payload }) => {
        if (!payload) return;
        // If this player was kicked, call onKicked callback
        const ownId = myPlayerId || myIdRef.current;
        if (payload.kickedPlayerId === ownId && typeof onKicked === 'function') {
          onKicked();
        }
      })
      .on('broadcast', { event: 'join-room-request' }, ({ payload }) => {
        if (!payload || !payload.sessionId) return;
        if (sessionId && payload.sessionId === sessionId) {
          if (typeof onJoinRequestReceived === 'function') {
            onJoinRequestReceived(payload);
          }
        }
      })
      .on('broadcast', { event: 'movement' }, ({ payload }) => {
        if (!payload || payload.id === myIdRef.current) return;
        if (!isAdmin && attendanceNo && String(payload.attendanceNo) === String(attendanceNo)) return;
        if (!isAdmin && myPlayerId && payload.id === myPlayerId) return;

        // Buffer incoming updates per player ID to prevent high-frequency state churn
        pendingMovementUpdatesRef.current.set(payload.id, payload);

        if (!movementRafRef.current) {
          movementRafRef.current = requestAnimationFrame(() => {
            movementRafRef.current = null;
            const updates = pendingMovementUpdatesRef.current;
            if (updates.size === 0) return;

            setPlayers((prev) => {
              const next = new Map(prev);
              updates.forEach((data, id) => {
                const existing = next.get(id);
                next.set(id, {
                  id,
                  username: data.username || (existing ? existing.username : 'Student'),
                  fullName: data.fullName || (existing ? existing.fullName : ''),
                  attendanceNo: data.attendanceNo || (existing ? existing.attendanceNo : ''),
                  studentClass: data.studentClass || (existing ? existing.studentClass : 'XI PPLG-B'),
                  characterIndex: data.characterIndex || (existing ? existing.characterIndex : 1),
                  isAdmin: typeof data.isAdmin !== 'undefined' ? !!data.isAdmin : (existing ? !!existing.isAdmin : false),
                  aura: data.aura || (existing ? existing.aura : (data.isAdmin ? { type: 'biasa', color: '#f59e0b' } : null)),
                  color: data.color || (existing ? existing.color : '#3b82f6'),
                  roomCode: data.roomCode || (existing ? existing.roomCode : cleanRoomCode),
                  roomName: data.roomName || (existing ? existing.roomName : ''),
                  x: data.x,
                  y: data.y,
                  direction: data.direction || (existing ? existing.direction : 'down'),
                  isMoving: !!data.isMoving,
                });
              });
              return next;
            });

            updates.clear();
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const currentState = localPlayerStateRef.current;
          const gSlot = groupNumber || (cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i) ? Number(cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i)[1]) : null);

          await channel.track({
            id: myIdRef.current,
            username: currentUsernameRef.current,
            fullName: currentFullNameRef.current,
            attendanceNo,
            studentClass: studentClass || activeClass,
            characterIndex,
            isAdmin,
            aura: isAdmin ? adminAuraRef.current : null,
            isCreator: !!isCreator,
            groupNumber: gSlot,
            groupSlot: gSlot,
            serverId: serverId || null,
            sessionId: sessionId || null,
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
      if (movementRafRef.current) {
        cancelAnimationFrame(movementRafRef.current);
        movementRafRef.current = null;
      }
      pendingMovementUpdatesRef.current.clear();
      try {
        channel.untrack();
      } catch (_) {}
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [username, color, cleanRoomCode, fullName, attendanceNo, isAdmin, serverId]);

  // Synchronize Group Dev Checklist progress from Supabase
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    supabase
      .from('team_dev_progress')
      .select('room_code, is_all_completed, dev1, dev2, dev3, dev4')
      .then(({ data, error }) => {
        if (!error && Array.isArray(data)) {
          const completedSet = new Set();
          data.forEach((row) => {
            if (row.is_all_completed && row.room_code) {
              completedSet.add(row.room_code.trim().toUpperCase());
            }
          });
          setCompletedGroups(completedSet);

          if (cleanRoomCode) {
            const current = data.find(
              (r) => r.room_code && r.room_code.trim().toUpperCase() === cleanRoomCode
            );
            if (current) {
              setGroupDevTodos({
                dev1: !!current.dev1,
                dev2: !!current.dev2,
                dev3: !!current.dev3,
                dev4: !!current.dev4,
              });
            }
          }
        }
      });
  }, [cleanRoomCode]);

  // Function to toggle group dev checklist item and sync to everyone in group
  const toggleGroupDevTodo = async (todoId) => {
    if (!todoId) return;
    const currentVal = !!groupDevTodos[todoId];
    const nextTodos = {
      ...groupDevTodos,
      [todoId]: !currentVal,
    };

    const isNowAllDone = Boolean(
      nextTodos.dev1 && nextTodos.dev2 && nextTodos.dev3 && nextTodos.dev4
    );

    // Optimistic update
    setGroupDevTodos(nextTodos);
    setCompletedGroups((prev) => {
      const next = new Set(prev);
      if (isNowAllDone) {
        next.add(cleanRoomCode);
      } else {
        next.delete(cleanRoomCode);
      }
      return next;
    });

    // Realtime broadcast to group in universe
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'groupDevTodoChange',
        payload: {
          roomCode: cleanRoomCode,
          todos: nextTodos,
          isAllCompleted: isNowAllDone,
          updatedBy: currentFullNameRef.current || currentUsernameRef.current || 'Anggota Tim',
          timestamp: Date.now(),
        },
      });
    }

    // Persist to database
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await supabase
          .from('team_dev_progress')
          .upsert({
            room_code: cleanRoomCode,
            dev1: nextTodos.dev1,
            dev2: nextTodos.dev2,
            dev3: nextTodos.dev3,
            dev4: nextTodos.dev4,
            is_all_completed: isNowAllDone,
            completed_at: isNowAllDone ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            updated_by: currentFullNameRef.current || currentUsernameRef.current || 'Anggota Tim',
          }, { onConflict: 'room_code' });
      }
    } catch (err) {
      console.warn('Gagal menyimpan progres dev kelompok:', err);
    }
  };

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
      senderName: currentUsernameRef.current || username,
      attendanceNo,
      senderRoomCode: cleanRoomCode,
      isAdmin: Boolean(isAdmin),
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

  const updatePlayerName = (newName) => {
    const clean = (newName || '').trim();
    if (!clean) return;
    setCurrentUsername(clean);
    setCurrentFullName(clean);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const currentState = localPlayerStateRef.current;
      channelRef.current.track({
        id: myIdRef.current,
        username: clean,
        fullName: clean,
        attendanceNo,
        studentClass: studentClass || activeClass,
        characterIndex,
        isAdmin,
        isCreator: !!isCreator,
        groupNumber: groupNumber || (cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i) ? Number(cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i)[1]) : null),
        gameStarted,
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
        event: 'player-name-update',
        payload: { id: myIdRef.current, username: clean, fullName: clean },
      });
    }

    try {
      const saved = localStorage.getItem('virtual_student_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.username = clean;
        parsed.fullName = clean;
        localStorage.setItem('virtual_student_session', JSON.stringify(parsed));
      }
      const adminSaved = localStorage.getItem('virtual_admin_session');
      if (adminSaved) {
        const parsed = JSON.parse(adminSaved);
        parsed.username = clean;
        parsed.fullName = clean;
        localStorage.setItem('virtual_admin_session', JSON.stringify(parsed));
      }
    } catch (_) {}
  };

  // Broadcast movement with deadband and frame throttling
  useEffect(() => {
    if (!channelRef.current || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    if (!localPlayerState.isMoving && lastBroadcastRef.current === -1) return;

    const now = Date.now();
    const lastPos = lastBroadcastPosRef.current;
    const distMoved = Math.hypot(localPlayerState.x - lastPos.x, localPlayerState.y - lastPos.y);

    // Broadcast when:
    // 1. Moving state changed (just started or just stopped moving)
    // 2. OR moving, at least 60ms elapsed, and moved at least 1.5px
    const stateChanged = localPlayerState.isMoving !== lastPos.isMoving;
    const timeElapsed = now - lastBroadcastRef.current >= 60;
    const movedEnough = distMoved >= 1.5;

    if (stateChanged || (localPlayerState.isMoving && timeElapsed && movedEnough)) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'movement',
        payload: {
          id: myIdRef.current,
          x: Math.round(localPlayerState.x * 10) / 10,
          y: Math.round(localPlayerState.y * 10) / 10,
          direction: localPlayerState.direction,
          isMoving: localPlayerState.isMoving,
          username,
          fullName,
          attendanceNo,
          studentClass: studentClass || activeClass,
          characterIndex,
          isAdmin,
          aura: isAdmin ? adminAuraRef.current : null,
          color,
          roomCode: cleanRoomCode,
          roomName
        },
      });
      lastBroadcastRef.current = localPlayerState.isMoving ? now : -1;
      lastBroadcastPosRef.current = {
        x: localPlayerState.x,
        y: localPlayerState.y,
        isMoving: localPlayerState.isMoving,
      };
    }
  }, [
    localPlayerState.x, 
    localPlayerState.y, 
    localPlayerState.direction, 
    localPlayerState.isMoving, 
    isAdmin, 
    cleanRoomCode, 
    studentClass, 
    activeClass,
    username,
    fullName,
    attendanceNo,
    characterIndex,
    color,
    roomName
  ]);

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

  // Handle room creator approving a join request
  const handleApproveJoin = (requestId) => {
    const req = pendingJoinRequests.find((r) => r.requestId === requestId);
    if (!req) return;

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'join-room-response',
        payload: {
          requestId,
          roomCode: cleanRoomCode,
          roomName: roomName || initialRoomName || 'Kelompok Belajar',
          status: 'ACCEPTED',
          hostName: fullName || username || 'Ketua Kelompok',
        },
      });
    }

    setPendingJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  // Handle room creator rejecting a join request
  const handleRejectJoin = (requestId, reason = 'Permintaan bergabung ditolak oleh pembuat kelompok.') => {
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'join-room-response',
        payload: {
          requestId,
          roomCode: cleanRoomCode,
          status: 'REJECTED',
          reason,
        },
      });
    }

    setPendingJoinRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  // Load team shared prompts from Supabase when room code is active
  useEffect(() => {
    if (!cleanRoomCode || !process.env.NEXT_PUBLIC_SUPABASE_URL || !supabase.from) return;

    let isMounted = true;
    const loadTeamPrompts = async () => {
      try {
        const { data, error } = await supabase
          .from('team_shared_prompts')
          .select('*')
          .eq('room_code', cleanRoomCode)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && isMounted) {
          const formatted = data.map((d) => ({
            id: d.id,
            roomCode: d.room_code,
            senderName: d.sender_name,
            attendanceNo: d.attendance_no,
            itemType: d.item_type,
            data: d.data,
            created_at: d.created_at,
            timestamp: new Date(d.created_at).getTime(),
          }));
          setTeamSharedPrompts(formatted);
        }
      } catch (e) {
        console.warn('Error loading team prompts:', e);
      }
    };

    loadTeamPrompts();
    return () => { isMounted = false; };
  }, [cleanRoomCode]);

  // Share prompt data / credentials with same group
  const sharePromptData = async ({ itemType, data, summary = '' }) => {
    if (!cleanRoomCode) return;

    const newItem = {
      id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomCode: cleanRoomCode,
      senderName: currentUsernameRef.current || username || 'Anggota Tim',
      attendanceNo: attendanceNo || '',
      itemType: itemType || 'general',
      data: data || {},
      summary: summary || '',
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
    };

    // Optimistically update local team state
    setTeamSharedPrompts((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);

    // Broadcast in real-time to group members
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'teamSharedPrompt',
        payload: newItem,
      });
    }

    // Persist to Supabase team_shared_prompts table
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabase.from) {
        await supabase.from('team_shared_prompts').insert([{
          room_code: cleanRoomCode,
          sender_name: newItem.senderName,
          attendance_no: newItem.attendanceNo,
          item_type: newItem.itemType,
          data: newItem.data,
        }]);
      }
    } catch (err) {
      console.warn('Persist team shared prompt error:', err);
    }
  };

  // Delete shared prompt item from team
  const deleteSharedPrompt = async (itemId) => {
    setTeamSharedPrompts((prev) => prev.filter((i) => i.id !== itemId));
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'teamDeleteSharedPrompt',
        payload: { id: itemId, roomCode: cleanRoomCode },
      });
    }
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && supabase.from) {
        await supabase.from('team_shared_prompts').delete().eq('id', itemId);
      }
    } catch (_) {}
  };

  // Update & broadcast admin custom aura
  const updateAdminAura = (newAura) => {
    setAdminAura(newAura);
    adminAuraRef.current = newAura;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('admin_aura_config', JSON.stringify(newAura));
      } catch (_) {}
    }
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'adminAuraChange',
        payload: { aura: newAura, adminId: myIdRef.current },
      });
      const currentState = localPlayerStateRef.current;
      channelRef.current.track({
        id: myIdRef.current,
        username: currentUsernameRef.current,
        fullName: currentFullNameRef.current,
        attendanceNo,
        studentClass: studentClass || activeClass,
        characterIndex,
        isAdmin,
        aura: newAura,
        isCreator: !!isCreator,
        groupNumber: groupNumber || (cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i) ? Number(cleanRoomCode.match(/^KEL(?:OMPOK)?([1-9])$/i)[1]) : null),
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
    currentUsername,
    currentFullName,
    updatePlayerName,
    gameStarted,
    hasAdminOnline,
    startGame,
    // Room join approval system
    pendingJoinRequests,
    handleApproveJoin,
    handleRejectJoin,
    isCreator,
    // Admin & Spotlight
    spotlightPlayer,
    setSpotlight,
    activeClass,
    changeActiveClass,
    // Admin Aura System
    adminAura,
    updateAdminAura,
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
    // Ping map (admin monitoring)
    pingMap,
    // Phase and story states & controls
    gamePhase,
    storyPhase,
    playerRoles,
    masterPromptData,
    startStory,
    advancePhase,
    assignRoles,
    commitMasterPrompt,
    // Team Shared Prompts & Credentials
    teamSharedPrompts,
    sharePromptData,
    deleteSharedPrompt,
    // Group Dev Checklist & Completion
    groupDevTodos,
    toggleGroupDevTodo,
    completedGroups,
    isMyGroupDevCompleted: completedGroups.has(cleanRoomCode),
    // Generic broadcast sender
    broadcastMessage: (event, payload) => {
      if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        });
      }
    },
  };
}
