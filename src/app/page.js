"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import VirtualRoom from '@/components/room/VirtualRoom';
import { DEFAULT_ACTIVE_CLASS, getStudentsByClass } from '@/lib/studentsData';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Unlock } from 'lucide-react';
import {
  fetchActiveServers,
  fetchGroupSessions,
  getOrCreateGroupSession,
  upsertGroupMember,
  updateMemberStatus,
  removeMemberFromSession,
} from '@/lib/serverService';

const CHARACTERS = [
  { id: 1, name: 'Siswa Magenta', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_001.png' },
  { id: 2, name: 'Siswa Silver', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_002.png' },
  { id: 3, name: 'Siswa Bronze', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_003.png' },
  { id: 4, name: 'Siswa Hitam', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_004.png' },
  { id: 5, name: 'Siswa Hijau', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_005.png' },
  { id: 6, name: 'Siswa Merah', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_006.png' },
];

// Unique player ID (persisted per server + student profile to avoid cross-profile pollution)
function getMyPlayerId(serverId = null, attendanceNo = null, username = null) {
  if (typeof window === 'undefined') return 'player-unknown';
  const cleanServer = serverId || 'srv';
  const cleanAtt = attendanceNo ? String(attendanceNo).trim() : '';
  const cleanUser = username ? String(username).toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';

  if (cleanAtt || cleanUser) {
    const key = `virtual_player_id_${cleanServer}_${cleanAtt ? `att_${cleanAtt}` : `usr_${cleanUser}`}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `player-${cleanServer}-${cleanAtt ? `no${cleanAtt}` : cleanUser}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem(key, id);
    }
    sessionStorage.setItem('virtual_player_id', id);
    return id;
  }

  let id = sessionStorage.getItem('virtual_player_id');
  if (!id) {
    id = `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('virtual_player_id', id);
  }
  return id;
}

export default function Home() {
  // Steps: 'SERVER_SELECT' | 'REGISTER' | 'LOBBY' | 'WAITING_APPROVAL' | 'GAME'
  const [step, setStep] = useState('SERVER_SELECT');

  // Server state
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null);
  const [pinTargetServer, setPinTargetServer] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active class from selected server
  const [activeClass, setActiveClass] = useState(DEFAULT_ACTIVE_CLASS);
  const [serverMode, setServerMode] = useState('class'); // 'class' | 'free'
  const classStudents = getStudentsByClass(activeClass);

  // Form Absensi state
  const [fullName, setFullName] = useState('');
  const [attendanceNo, setAttendanceNo] = useState('');
  const [username, setUsername] = useState('');
  const [characterIndex, setCharacterIndex] = useState(1);
  const [color, setColor] = useState('#3b82f6');
  const [rotStep, setRotStep] = useState(0);

  // Room / Lobby state
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomName, setCreatedRoomName] = useState('Kelompok 1');
  const [selectedGroup, setSelectedGroup] = useState(1);
  const [groupNameInput, setGroupNameInput] = useState('Kelompok 1');
  const [joinError, setJoinError] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [createRoomError, setCreateRoomError] = useState('');

  // DB group sessions for selected server
  const [dbGroupSessions, setDbGroupSessions] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Current group session ID (from DB)
  const [mySessionId, setMySessionId] = useState(null);

  // Join approval state
  const [joinStatus, setJoinStatus] = useState(null); // null | 'WAITING' | 'ACCEPTED' | 'REJECTED'
  const [waitingHostName, setWaitingHostName] = useState('');

  // Pending join requests (for owner's approval tab)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showApprovalTab, setShowApprovalTab] = useState(false);

  // Members list (for owner to manage)
  const [myGroupMembers, setMyGroupMembers] = useState([]);

  // Form validation / duplicate prevention error
  const [registerError, setRegisterError] = useState('');

  // Realtime presence for group visibility
  const [activePresenceMap, setActivePresenceMap] = useState(new Map());
  const lobbyChannelRef = useRef(null);
  const currentRequestIdRef = useRef(null);
  const myPlayerIdRef = useRef(null);

  // Inisialisasi Player ID persisten
  useEffect(() => {
    myPlayerIdRef.current = getMyPlayerId();
  }, []);

  // Load servers on mount
  useEffect(() => {
    fetchActiveServers().then((data) => {
      setServers(data);
      setLoadingServers(false);
    });
  }, []);

  // Character rotation showcase
  useEffect(() => {
    const timer = setInterval(() => setRotStep((prev) => (prev + 1) % 4), 850);
    return () => clearInterval(timer);
  }, []);

  // Update active class when server changes
  useEffect(() => {
    if (selectedServer) {
      const mode = selectedServer.mode || 'class';
      setServerMode(mode);
      if (mode === 'class' && selectedServer.active_class) {
        setActiveClass(selectedServer.active_class);
        try { localStorage.setItem('virtual_active_class', selectedServer.active_class); } catch (_) {}
      }
    }
  }, [selectedServer]);

  // Restore session on page refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem('virtual_student_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.fullName && session.username && session.roomCode) {
          setFullName(session.fullName);
          setAttendanceNo(session.attendanceNo || '');
          setUsername(session.username);
          setCharacterIndex(session.characterIndex || 1);
          setColor(session.color || '#3b82f6');
          setActiveClass(session.activeClass || DEFAULT_ACTIVE_CLASS);
          setServerMode(session.serverMode || 'class');
          setRoomCode(session.roomCode);
          setCreatedRoomName(session.createdRoomName || 'Kelompok 1');
          if (session.groupNumber) setSelectedGroup(Number(session.groupNumber));
          if (session.isCreator) setIsCreator(true);
          if (session.mySessionId) setMySessionId(session.mySessionId);
          if (session.selectedServer) setSelectedServer(session.selectedServer);
          setStep('GAME');
        }
      }
    } catch (err) {
      console.warn('Gagal memulihkan sesi siswa:', err);
    }
  }, []);

  const saveStudentSession = (
    targetRoomCode = roomCode,
    targetRoomName = createdRoomName,
    creatorFlag = isCreator,
    groupSlot = selectedGroup,
    sessionId = mySessionId,
    targetStep = 'GAME',
    srv = selectedServer
  ) => {
    try {
      localStorage.setItem('virtual_student_session', JSON.stringify({
        fullName, attendanceNo, username, characterIndex, color,
        activeClass, serverMode,
        roomCode: targetRoomCode,
        createdRoomName: targetRoomName,
        groupNumber: groupSlot,
        isCreator: !!creatorFlag,
        mySessionId: sessionId,
        selectedServer: srv,
        step: targetStep,
        savedAt: Date.now(),
      }));
    } catch (e) {}
  };

  // Load DB group sessions for selected server
  const loadGroupSessions = useCallback(async () => {
    if (!selectedServer) return;
    setLoadingGroups(true);
    const data = await fetchGroupSessions(selectedServer.id);
    setDbGroupSessions(data);
    setLoadingGroups(false);
  }, [selectedServer]);

  useEffect(() => {
    if ((step === 'LOBBY' || step === 'REGISTER') && selectedServer) {
      loadGroupSessions();
    }
  }, [step, selectedServer, loadGroupSessions]);

  // Listen to shared universe presence & join-room events
  useEffect(() => {
    if ((step !== 'LOBBY' && step !== 'REGISTER') || !process.env.NEXT_PUBLIC_SUPABASE_URL || !selectedServer) return;

    const serverId = selectedServer.id;
    const channelName = `classroom:server:${serverId}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false, self: false } },
    });
    lobbyChannelRef.current = channel;

    const updatePresence = () => {
      const state = channel.presenceState();
      const pMap = new Map();
      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          pMap.set(key, presences[0]);
        }
      });
      setActivePresenceMap(pMap);
    };

    channel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence)
      .on('broadcast', { event: 'join-room-request' }, ({ payload }) => {
        if (!payload || !payload.sessionId) return;
        if (mySessionId && payload.sessionId === mySessionId) {
          supabase
            .from('group_members')
            .select('*')
            .eq('session_id', mySessionId)
            .eq('status', 'pending')
            .order('joined_at', { ascending: true })
            .then(({ data }) => {
              if (data) setPendingRequests(data);
            });
        }
      })
      .on('broadcast', { event: 'join-room-response' }, ({ payload }) => {
        if (!payload) return;
        const myPId = myPlayerIdRef.current || getMyPlayerId();
        const isMatch =
          (payload.targetPlayerId && payload.targetPlayerId === myPId) ||
          (payload.requestId && payload.requestId === currentRequestIdRef.current);
        if (!isMatch) return;

        if (payload.status === 'ACCEPTED') {
          setJoinStatus('ACCEPTED');
          setIsCreator(false);
          saveStudentSession(payload.roomCode, payload.roomName, false, selectedGroup, payload.sessionId);
          setTimeout(() => {
            setRoomCode(payload.roomCode);
            setCreatedRoomName(payload.roomName);
            setMySessionId(payload.sessionId);
            setStep('GAME');
            setJoinStatus(null);
          }, 800);
        } else if (payload.status === 'REJECTED') {
          setJoinStatus('REJECTED');
          setJoinError(payload.reason || 'Permintaan bergabung ditolak.');
          setTimeout(() => setJoinStatus(null), 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      lobbyChannelRef.current = null;
    };
  }, [step, selectedServer, selectedGroup, mySessionId]);

  // Tracking profil & nomor absen yang sedang aktif digunakan browser lain
  const activeStudentProfileMap = useMemo(() => {
    const currentMyId = myPlayerIdRef.current || getMyPlayerId();
    const usedAttendance = new Set();
    const usedFullNames = new Set();
    const usedUsernames = new Set();
    const profileStatusInfo = new Map();

    // 1. Dari Presence Realtime (siswa yang sedang online di server ini)
    activePresenceMap.forEach((presence, pId) => {
      if (!presence) return;
      if (pId === currentMyId || presence.id === currentMyId) return; // Skip browser ini sendiri
      if (presence.isAdmin) return;

      if (presence.attendanceNo) {
        const attStr = String(presence.attendanceNo).trim();
        usedAttendance.add(attStr);
        profileStatusInfo.set(attStr, {
          name: presence.fullName || presence.username || `Siswa #${attStr}`,
          isOnline: true,
        });
      }
      if (presence.fullName) {
        usedFullNames.add(presence.fullName.toLowerCase().trim());
      }
      if (presence.username) {
        usedUsernames.add(presence.username.toLowerCase().trim());
      }
    });

    // 2. Dari Database Group Members (siswa yang sudah terdaftar di kelompok server ini)
    if (Array.isArray(dbGroupSessions)) {
      dbGroupSessions.forEach((sess) => {
        if (!sess || !Array.isArray(sess.group_members)) return;
        sess.group_members.forEach((m) => {
          if (!m || m.player_id === currentMyId) return;
          if (m.status !== 'approved' && m.status !== 'pending') return;

          if (m.attendance_no) {
            const attStr = String(m.attendance_no).trim();
            usedAttendance.add(attStr);
            if (!profileStatusInfo.has(attStr)) {
              profileStatusInfo.set(attStr, {
                name: m.full_name || m.username || `Siswa #${attStr}`,
                isOnline: false,
                groupName: sess.room_name || `Kelompok ${sess.slot}`,
              });
            }
          }
          if (m.full_name) {
            usedFullNames.add(m.full_name.toLowerCase().trim());
          }
          if (m.username) {
            usedUsernames.add(m.username.toLowerCase().trim());
          }
        });
      });
    }

    return { usedAttendance, usedFullNames, usedUsernames, profileStatusInfo };
  }, [activePresenceMap, dbGroupSessions]);

  // Poll pending requests (for owner, when in LOBBY step)
  useEffect(() => {
    if (step !== 'LOBBY' || !mySessionId || !isCreator) return;
    let interval;
    const loadPending = async () => {
      const { data } = await supabase
        .from('group_members')
        .select('*')
        .eq('session_id', mySessionId)
        .eq('status', 'pending')
        .order('joined_at', { ascending: true });
      setPendingRequests(data || []);
    };
    loadPending();
    interval = setInterval(loadPending, 3000);
    return () => clearInterval(interval);
  }, [step, mySessionId, isCreator]);

  // Poll approved members for owner to manage (kick)
  useEffect(() => {
    if (step !== 'LOBBY' || !mySessionId || !isCreator) return;
    const loadMembers = async () => {
      const { data } = await supabase
        .from('group_members')
        .select('*')
        .eq('session_id', mySessionId)
        .neq('status', 'kicked')
        .order('joined_at', { ascending: true });
      setMyGroupMembers(data || []);
    };
    loadMembers();
    const interval = setInterval(loadMembers, 5000);
    return () => clearInterval(interval);
  }, [step, mySessionId, isCreator]);

  // Build groups data from DB sessions + realtime presence
  const groupsData = useMemo(() => {
    const list = [];
    const myPId = myPlayerIdRef.current || getMyPlayerId(selectedServer?.id, attendanceNo, username);

    for (let n = 1; n <= 9; n++) {
      const dbSession = dbGroupSessions.find((s) => s.slot === n);
      const presenceMembers = Array.from(activePresenceMap.values()).filter(
        (p) => !p.isAdmin && p.groupSlot === n
      );
      const dbMembers = dbSession?.group_members?.filter((m) => m.status === 'approved') || [];
      const count = Math.max(presenceMembers.length, dbMembers.length);
      const isFull = count >= 4;

      // Verifikasi identitas siswa AKTIF di kelompok ini:
      // Siswa hanya dianggap anggota jika profil aktifnya (absen/nama) cocok dengan anggota di dbMembers
      const matchedMember = dbMembers.find((m) => {
        if (!m) return false;
        if (attendanceNo && m.attendance_no) {
          return String(m.attendance_no).trim() === String(attendanceNo).trim();
        }
        if (myPId && m.player_id && m.player_id === myPId) {
          if (fullName && m.full_name) {
            return m.full_name.toLowerCase().trim() === fullName.toLowerCase().trim();
          }
          return true;
        }
        if (fullName && m.full_name) {
          return m.full_name.toLowerCase().trim() === fullName.toLowerCase().trim();
        }
        return false;
      });

      // Siswa HANYA approved member jika terbukti cocok dengan data anggota di database
      const isApprovedMember = Boolean(matchedMember);

      // Siswa HANYA owner jika dia adalah approved member DAN merupakan owner kelompok tersebut
      const isOwner = Boolean(
        isApprovedMember && (
          (dbSession?.owner_id && matchedMember?.player_id === dbSession.owner_id) ||
          (dbSession?.owner_name && (
            (attendanceNo && dbSession.owner_name.includes(String(attendanceNo))) ||
            (fullName && dbSession.owner_name.toLowerCase().trim() === fullName.toLowerCase().trim())
          )) ||
          (isCreator && mySessionId && dbSession?.id === mySessionId)
        )
      );

      list.push({
        slot: n,
        label: `Kelompok ${n}`,
        exists: !!dbSession,
        isFull,
        count,
        max: 4,
        roomName: dbSession?.room_name || `Kelompok ${n}`,
        roomCode: dbSession?.room_code || `KEL${n}`,
        sessionId: dbSession?.id || null,
        ownerId: dbSession?.owner_id || null,
        ownerName: dbSession?.owner_name || '',
        dbMembers,
        isOwner,
        isApprovedMember,
      });
    }
    return list;
  }, [dbGroupSessions, activePresenceMap, mySessionId, isCreator, attendanceNo, fullName, username, selectedServer]);

  const currentSelectedGroupData = groupsData.find((g) => g.slot === selectedGroup) || groupsData[0] || {
    slot: 1, label: 'Kelompok 1', exists: false, isFull: false, count: 0, max: 4,
    roomName: 'Kelompok 1', roomCode: 'KEL1', sessionId: null, ownerId: null, ownerName: '', dbMembers: [],
    isOwner: false, isApprovedMember: false,
  };

  const handleEnterMyGroup = (groupData) => {
    if (!groupData.isApprovedMember && !groupData.isOwner) {
      alert('Anda belum terdaftar sebagai anggota kelompok ini.');
      return;
    }
    const ownerFlag = Boolean(groupData.isOwner);
    setRoomCode(groupData.roomCode);
    setCreatedRoomName(groupData.roomName);
    setSelectedGroup(groupData.slot);
    setIsCreator(ownerFlag);
    setMySessionId(groupData.sessionId);
    saveStudentSession(groupData.roomCode, groupData.roomName, ownerFlag, groupData.slot, groupData.sessionId, 'GAME');
    setStep('GAME');
  };

  const isFormValid = fullName.trim() !== '' && username.trim() !== '' &&
    (serverMode === 'free' || attendanceNo.trim() !== '');

  const handleSelectServer = (srv) => {
    setRegisterError('');
    if (srv.pin && String(srv.pin).trim() !== '') {
      setPinTargetServer(srv);
      setPinInput('');
      setPinError('');
      return;
    }
    if (!selectedServer || selectedServer.id !== srv.id) {
      setRoomCode('');
      setCreatedRoomName('Kelompok 1');
      setSelectedGroup(1);
      setIsCreator(false);
      setMySessionId(null);
    }
    setSelectedServer(srv);
    setStep('REGISTER');
  };

  const handleConfirmPin = (e) => {
    if (e) e.preventDefault();
    if (!pinTargetServer) return;
    if (pinInput.trim() !== String(pinTargetServer.pin).trim()) {
      setPinError('PIN Server salah! Silakan tanyakan PIN ke pengajar.');
      return;
    }
    const target = pinTargetServer;
    setPinTargetServer(null);
    setPinInput('');
    setPinError('');
    setRegisterError('');
    if (!selectedServer || selectedServer.id !== target.id) {
      setRoomCode('');
      setCreatedRoomName('Kelompok 1');
      setSelectedGroup(1);
      setIsCreator(false);
      setMySessionId(null);
    }
    setSelectedServer(target);
    setStep('REGISTER');
  };

  const handleCreateGroupRoom = async (slot, customName) => {
    const clean = (customName || `Kelompok ${slot}`).trim();
    if (!clean) { setCreateRoomError('Nama kelompok tidak boleh kosong!'); return; }

    const current = groupsData.find((g) => g.slot === slot);
    if (current && current.exists) {
      setCreateRoomError(`Kelompok ${slot} sudah dibuat!`);
      return;
    }

    setCreateRoomError('');
    const newCode = `KEL${slot}`;
    const playerId = myPlayerIdRef.current || getMyPlayerId();
    myPlayerIdRef.current = playerId;

    // Create/get DB session
    const result = await getOrCreateGroupSession({
      serverId: selectedServer.id,
      slot,
      roomCode: newCode,
      roomName: clean,
      ownerId: playerId,
      ownerName: fullName || username,
    });

    if (!result) { setCreateRoomError('Gagal membuat kelompok. Coba lagi.'); return; }

    const sessionId = result.session.id;

    // Register owner as approved member
    await upsertGroupMember({
      sessionId,
      playerId,
      fullName: fullName || username,
      username,
      attendanceNo,
      studentClass: activeClass,
      characterIndex,
      status: 'approved',
    });

    setRoomCode(newCode);
    setCreatedRoomName(clean);
    setSelectedGroup(slot);
    setIsCreator(true);
    setMySessionId(sessionId);
    saveStudentSession(newCode, clean, true, slot, sessionId);
    setStep('GAME');
  };

  const handleJoinSelectedGroup = async (groupData) => {
    if (!groupData || !groupData.sessionId) {
      setJoinError('Kelompok ini belum aktif atau tidak ditemukan.');
      return;
    }

    const playerId = myPlayerIdRef.current || getMyPlayerId();
    myPlayerIdRef.current = playerId;

    // Jika user adalah owner atau sudah disetujui di kelompok ini, langsung masuk tanpa verifikasi diri sendiri!
    const isOwner = Boolean(
      groupData.isOwner ||
      (groupData.ownerId && groupData.ownerId === playerId) ||
      (mySessionId && groupData.sessionId === mySessionId && isCreator)
    );
    const isApproved = Boolean(
      groupData.isApprovedMember ||
      isOwner ||
      groupData.dbMembers?.some((m) => m.player_id === playerId)
    );

    if (isOwner || isApproved) {
      handleEnterMyGroup({ ...groupData, isOwner });
      return;
    }

    if (groupData.isFull) {
      setJoinError(`Kelompok ${groupData.slot} sudah penuh (4/4).`);
      return;
    }

    // Register as pending member in DB
    await upsertGroupMember({
      sessionId: groupData.sessionId,
      playerId,
      fullName: fullName || username,
      username,
      attendanceNo,
      studentClass: activeClass,
      characterIndex,
      status: 'pending',
    });

    // Send join request via realtime broadcast
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = requestId;
    setWaitingHostName(groupData.ownerName || 'Ketua Kelompok');
    setJoinStatus('WAITING');
    setJoinError('');

    if (lobbyChannelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      lobbyChannelRef.current.send({
        type: 'broadcast',
        event: 'join-room-request',
        payload: {
          requestId,
          sessionId: groupData.sessionId,
          slot: groupData.slot,
          roomCode: groupData.roomCode,
          roomName: groupData.roomName,
          requesterName: fullName || username,
          requesterId: playerId,
          attendanceNo,
        },
      });
    }

    // Fallback: if no owner responds in 15s, allow direct join
    setTimeout(async () => {
      if (joinStatus === 'WAITING') {
        // Auto-approve if owner not online
        await updateMemberStatus(groupData.sessionId, playerId, 'approved');
        setJoinStatus('ACCEPTED');
        setMySessionId(groupData.sessionId);
        saveStudentSession(groupData.roomCode, groupData.roomName, false, groupData.slot, groupData.sessionId);
        setTimeout(() => {
          setRoomCode(groupData.roomCode);
          setCreatedRoomName(groupData.roomName);
          setStep('GAME');
          setJoinStatus(null);
        }, 500);
      }
    }, 15000);
  };

  // Owner: approve join request
  const handleApproveRequest = async (req) => {
    await updateMemberStatus(mySessionId, req.player_id, 'approved');
    setPendingRequests((prev) => prev.filter((r) => r.player_id !== req.player_id));

    // Broadcast acceptance
    if (lobbyChannelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      lobbyChannelRef.current.send({
        type: 'broadcast',
        event: 'join-room-response',
        payload: {
          requestId: req.request_id || null,
          targetPlayerId: req.player_id,
          sessionId: mySessionId,
          roomCode,
          roomName: createdRoomName,
          status: 'ACCEPTED',
          hostName: fullName || username,
        },
      });
    }
  };

  // Owner: reject join request
  const handleRejectRequest = async (req) => {
    await updateMemberStatus(mySessionId, req.player_id, 'kicked');
    setPendingRequests((prev) => prev.filter((r) => r.player_id !== req.player_id));

    if (lobbyChannelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      lobbyChannelRef.current.send({
        type: 'broadcast',
        event: 'join-room-response',
        payload: {
          requestId: req.request_id || null,
          targetPlayerId: req.player_id,
          sessionId: mySessionId,
          roomCode,
          status: 'REJECTED',
          reason: 'Permintaan bergabung ditolak oleh ketua kelompok.',
        },
      });
    }
  };

  // Owner: kick member
  const handleKickMember = async (member) => {
    if (!confirm(`Kick "${member.full_name || member.username}" dari kelompok?`)) return;
    await removeMemberFromSession(mySessionId, member.player_id);
    setMyGroupMembers((prev) => prev.filter((m) => m.player_id !== member.player_id));

    if (lobbyChannelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      lobbyChannelRef.current.send({
        type: 'broadcast',
        event: 'member-kicked',
        payload: {
          kickedPlayerId: member.player_id,
          roomCode,
          kickedBy: fullName || username,
        },
      });
    }
  };

  // Keluar dari room: simpan state kelompok agar tidak perlu memilih kelompok lagi
  const handleLeaveGame = () => {
    saveStudentSession(roomCode, createdRoomName, isCreator, selectedGroup, mySessionId, 'REGISTER');
    setStep('REGISTER');
  };

  // Jika di-kick oleh owner atau admin: reset state kelompok
  const handleKicked = () => {
    try { localStorage.removeItem('virtual_student_session'); } catch (e) {}
    setRoomCode('');
    setCreatedRoomName('Kelompok 1');
    setSelectedGroup(1);
    setMySessionId(null);
    setIsCreator(false);
    setStep('REGISTER');
    alert('Anda telah dikeluarkan dari kelompok oleh ketua kelompok atau pengajar.');
  };

  // Logout / Reset Akun secara manual
  const handleResetSession = () => {
    try { localStorage.removeItem('virtual_student_session'); } catch (e) {}
    setRoomCode('');
    setCreatedRoomName('Kelompok 1');
    setSelectedGroup(1);
    setMySessionId(null);
    setIsCreator(false);
    setSelectedServer(null);
    setStep('SERVER_SELECT');
  };

  // ─── STEP 0: SERVER SELECT ────────────────────────────────────────────────
  if (step === 'SERVER_SELECT') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-3 relative font-pixel">
        <div className="max-w-[480px] w-full pixel-panel-wood p-4 sm:p-5 relative select-none max-h-[92vh] overflow-y-auto pixel-scrollbar">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <img src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" alt="Castle" className="w-4 h-4 image-pixelated" />
              <h1 className="text-lg sm:text-xl font-black text-amber-300 drop-shadow">Virtual Classroom</h1>
              <img src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" alt="Castle" className="w-4 h-4 image-pixelated" />
            </div>
            <p className="text-[10px] text-amber-200/80">Pilih server untuk bergabung</p>
          </div>

          {/* Kartu Resume Kelompok Tersimpan */}
          {roomCode && selectedServer && mySessionId && (
            <div className="mb-4 pixel-box-inset p-3 bg-amber-950/60 border border-amber-500/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px]">Kelompok Tersimpan</span>
                <span className="text-[10px] text-amber-400 font-mono">{selectedServer.name}</span>
              </div>
              <div className="text-xs text-amber-100 flex items-center justify-between">
                <span>
                  <strong>{attendanceNo ? `#${attendanceNo} ` : ''}{fullName || username}</strong>
                </span>
                <span className="text-amber-300 font-mono font-bold">{createdRoomName || `Kelompok ${selectedGroup}`}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    saveStudentSession(roomCode, createdRoomName, isCreator, selectedGroup, mySessionId, 'GAME');
                    setStep('GAME');
                  }}
                  className="flex-1 py-2 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>Masuk ke {createdRoomName || `Kelompok ${selectedGroup}`}</span>
                  <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Enter" className="w-3.5 h-3.5 image-pixelated" />
                </button>
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="px-2.5 py-2 pixel-btn-silver text-[10px] text-amber-300"
                  title="Hapus sesi"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {loadingServers ? (
            <div className="text-center py-8 text-amber-500 text-xs">Memuat server...</div>
          ) : servers.length === 0 ? (
            <div className="pixel-box-inset p-5 text-center space-y-2">
              <p className="text-amber-400 text-xs">Belum ada server aktif.</p>
              <p className="text-amber-500/70 text-[10px]">Silakan tunggu instruksi pengajar untuk mengaktifkan server.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {servers.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => handleSelectServer(srv)}
                  className="w-full pixel-box-inset p-3.5 text-left hover:border-amber-400 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-amber-200 group-hover:text-amber-100">{srv.name}</span>
                          {srv.pin ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border bg-amber-950/80 text-amber-300 border-amber-600/70 inline-flex items-center gap-1" title="Memerlukan PIN">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              <span>PIN</span>
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border bg-stone-900/60 text-stone-400 border-stone-700/50 inline-flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5 text-stone-500" />
                              <span>Bebas</span>
                            </span>
                          )}
                        </div>
                        {srv.description && (
                          <div className="text-[10px] text-amber-400/70 mt-0.5">{srv.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0 pl-2">
                      <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Enter" className="w-3.5 h-3.5 image-pixelated opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Modal Input PIN Server */}
          {pinTargetServer && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="max-w-xs w-full pixel-panel-wood p-5 space-y-3.5 border-2 border-amber-500/80">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider">PIN Server</h3>
                  </div>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Server <strong className="text-amber-100">{pinTargetServer.name}</strong> dilindungi PIN. Masukkan PIN dari pengajar untuk masuk.
                  </p>
                </div>

                <form onSubmit={handleConfirmPin} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      maxLength={12}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                      placeholder="••••"
                      className="w-full pixel-box-inset px-3 py-2 text-center text-xl font-mono tracking-widest text-amber-200 placeholder-amber-800/60 focus:outline-none"
                    />
                  </div>

                  {pinError && (
                    <p className="text-[10px] text-red-400 font-bold text-center">{pinError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setPinTargetServer(null); setPinInput(''); setPinError(''); }}
                      className="flex-1 pixel-btn-silver py-1.5 text-xs font-bold uppercase"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 pixel-btn-gold py-1.5 text-xs font-bold uppercase"
                    >
                      Masuk
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ─── STEP 1: FORM ABSENSI ────────────────────────────────────────────────
  if (step === 'REGISTER') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-3 relative font-pixel">
        <div className="max-w-[480px] w-full pixel-panel-wood p-4 sm:p-5 relative select-none max-h-[95vh] overflow-y-auto pixel-scrollbar">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <img src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" alt="Castle" className="w-4 h-4 image-pixelated" />
              <h1 className="text-lg sm:text-xl font-black text-amber-300 drop-shadow">Virtual Classroom</h1>
              <img src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" alt="Castle" className="w-4 h-4 image-pixelated" />
            </div>
            <p className="text-[10px] text-amber-200/80">Langkah 1 dari 2: Form Absensi</p>
            {selectedServer && (
              <div className="mt-1 inline-flex items-center gap-2 pixel-box-inset px-3 py-0.5 text-xs text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-amber-400/80 text-[10px]">Server:</span>
                <strong className="text-white text-xs">{selectedServer.name}</strong>
                {serverMode === 'class' && activeClass && !selectedServer.name.includes(activeClass) && (
                  <>
                    <span className="text-amber-600">|</span>
                    <strong className="text-amber-200 text-xs">{activeClass}</strong>
                  </>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRegisterError('');
              if (!isFormValid) return;

              const cleanAtt = attendanceNo ? String(attendanceNo).trim() : '';
              const cleanFull = fullName.toLowerCase().trim();
              const cleanUser = username.toLowerCase().trim();

              if (cleanAtt && activeStudentProfileMap.usedAttendance.has(cleanAtt)) {
                const info = activeStudentProfileMap.profileStatusInfo.get(cleanAtt);
                const detail = info?.isOnline
                  ? 'sedang aktif online di browser lain'
                  : `sudah terdaftar di ${info?.groupName || 'kelompok lain'}`;
                setRegisterError(`Nomor Absen #${cleanAtt} (${info?.name || fullName}) ${detail}. Profil tidak dapat dipilih oleh browser lain.`);
                return;
              }

              if (serverMode === 'free' && activeStudentProfileMap.usedFullNames.has(cleanFull)) {
                setRegisterError(`Nama "${fullName}" sudah aktif digunakan oleh pemain lain.`);
                return;
              }

              if (activeStudentProfileMap.usedUsernames.has(cleanUser)) {
                setRegisterError(`Username "${username}" sudah digunakan di server ini. Silakan pilih username lain.`);
                return;
              }

              if (roomCode && mySessionId) {
                saveStudentSession(roomCode, createdRoomName, isCreator, selectedGroup, mySessionId, 'GAME');
                setStep('GAME');
              } else {
                setStep('LOBBY');
              }
            }}
            className="space-y-2.5"
          >
            {/* Class mode: pilih dari daftar */}
            {serverMode === 'class' && (
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Pilih Siswa ({activeClass})
                  </label>
                  <span className="text-[10px] text-amber-400/80">{classStudents.length} Terdaftar</span>
                </div>
                <select
                  value={attendanceNo && fullName ? `${attendanceNo}|||${fullName}` : ''}
                  onChange={(e) => {
                    setRegisterError('');
                    const val = e.target.value;
                    if (!val) {
                      setAttendanceNo('');
                      setFullName('');
                      setRoomCode('');
                      setCreatedRoomName('Kelompok 1');
                      setSelectedGroup(1);
                      setIsCreator(false);
                      setMySessionId(null);
                      return;
                    }
                    const [no, sName] = val.split('|||');
                    setAttendanceNo(no);
                    setFullName(sName);
                    const firstWord = sName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                    setUsername(firstWord || 'siswa');

                    // Bind player ID secara spesifik ke siswa ini
                    const newPId = getMyPlayerId(selectedServer?.id, no, firstWord);
                    myPlayerIdRef.current = newPId;

                    // Periksa apakah ada sesi kelompok tersimpan untuk siswa ini
                    let hasSavedSession = false;
                    try {
                      const saved = localStorage.getItem('virtual_student_session');
                      if (saved) {
                        const session = JSON.parse(saved);
                        if (session && String(session.attendanceNo).trim() === String(no).trim()) {
                          hasSavedSession = true;
                          setRoomCode(session.roomCode || '');
                          setCreatedRoomName(session.createdRoomName || 'Kelompok 1');
                          if (session.groupNumber) setSelectedGroup(Number(session.groupNumber));
                          setIsCreator(Boolean(session.isCreator));
                          setMySessionId(session.mySessionId || null);
                        }
                      }
                    } catch (_) {}

                    // Jika siswa baru ini belum memiliki sesi tersimpan, bersihkan state kelompok lama!
                    if (!hasSavedSession) {
                      setRoomCode('');
                      setCreatedRoomName('Kelompok 1');
                      setSelectedGroup(1);
                      setIsCreator(false);
                      setMySessionId(null);
                      try { localStorage.removeItem('virtual_student_session'); } catch (_) {}
                    }
                  }}
                  className="w-full pixel-box-inset px-2.5 py-1.5 text-xs text-amber-100 bg-[#1e0e05] border border-[#6b3815] focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih dari Daftar Siswa {activeClass} --</option>
                  {classStudents.map((s) => {
                    const isUsed = activeStudentProfileMap.usedAttendance.has(String(s.no));
                    const info = isUsed ? activeStudentProfileMap.profileStatusInfo.get(String(s.no)) : null;
                    const labelStatus = isUsed
                      ? (info?.isOnline ? ' [Sedang Online]' : ' [Sudah Dipakai]')
                      : '';
                    return (
                      <option
                        key={s.nis}
                        value={`${s.no}|||${s.name}`}
                        disabled={isUsed}
                        className={isUsed ? 'text-stone-500 bg-[#140802]' : ''}
                      >
                        #{s.no} - {s.name} ({s.nis}){labelStatus}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[9px] text-amber-400/70 mt-0.5">
                  Pilih nama Anda dari daftar resmi. Profil yang aktif di browser lain terkunci otomatis.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-amber-300 mb-0.5 uppercase tracking-wider">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setRegisterError('');
                }}
                placeholder={serverMode === 'free' ? 'Ketik nama lengkap Anda' : 'Pilih siswa di atas atau ketik nama'}
                className="w-full pixel-box-inset px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 bg-[#1e0e05] border border-[#6b3815] focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-0.5 uppercase tracking-wider flex items-center justify-between">
                  <span>No. Absen {serverMode === 'class' && <span className="text-red-400">*</span>}</span>
                  {serverMode === 'class' && <span className="text-[9px] text-amber-500 font-normal">Terkunci</span>}
                </label>
                {serverMode === 'class' ? (
                  <input
                    type="text"
                    value={attendanceNo ? `#${attendanceNo}` : ''}
                    readOnly
                    placeholder="Pilih nama"
                    className="w-full pixel-box-inset px-2.5 py-1.5 text-xs text-amber-300 font-bold bg-[#140802] border border-[#52290d] cursor-not-allowed opacity-90 select-none focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={attendanceNo}
                    onChange={(e) => {
                      setAttendanceNo(e.target.value);
                      setRegisterError('');
                    }}
                    placeholder="Opsional"
                    className="w-full pixel-box-inset px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 bg-[#1e0e05] border border-[#6b3815] focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-0.5 uppercase tracking-wider">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setRegisterError('');
                  }}
                  placeholder="Contoh: budi123"
                  className="w-full pixel-box-inset px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 bg-[#1e0e05] border border-[#6b3815] focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Compact Pixel Character Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Pilih Karakter
                </label>
                <span className="text-[10px] text-amber-200 font-bold">
                  {CHARACTERS.find(c => c.id === characterIndex)?.name} (#{characterIndex})
                </span>
              </div>

              {/* 6 Character Cards in a clean, tight row */}
              <div className="grid grid-cols-6 gap-1.5 pixel-box-inset p-1.5 bg-[#140802] border border-[#5c2f0f]">
                {CHARACTERS.map(c => {
                  const isSelected = characterIndex === c.id;
                  const dirOrder = [0, 2, 3, 1];
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCharacterIndex(c.id)}
                      title={`${c.name} (#${c.id})`}
                      className={`flex flex-col items-center justify-center py-1 px-0.5 rounded border transition-all min-h-[50px] ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-900/70 scale-105 pixel-shadow-sm ring-1 ring-amber-300' 
                          : 'border-transparent opacity-75 hover:opacity-100 hover:bg-amber-950/40'
                      }`}
                    >
                      <div className="w-8 h-8 overflow-hidden flex items-center justify-center">
                        <div
                          className="w-8 h-8 image-pixelated"
                          style={{
                            backgroundImage: `url('${c.sprite}')`,
                            backgroundPosition: isSelected ? `-32px ${-dirOrder[rotStep % 4] * 32}px` : '-32px 0px',
                            backgroundSize: '96px 128px',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      </div>
                      <span className="text-[8.5px] font-bold text-amber-300 truncate max-w-[46px] mt-0.5">
                        #{c.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Kelompok Tersimpan */}
            {roomCode && mySessionId && (
              <div className="pixel-box-inset p-2.5 bg-amber-950/50 border border-amber-600/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Kelompok Tersimpan</span>
                  <span className="text-[9px] bg-amber-900/70 text-amber-200 px-1.5 py-0.2 rounded border border-amber-700/60 font-bold">
                    {roomCode}
                  </span>
                </div>
                <div className="text-xs font-bold text-amber-100">
                  {createdRoomName || `Kelompok ${selectedGroup}`}
                </div>
              </div>
            )}

            {registerError && (
              <div className="pixel-box-inset p-2.5 bg-red-950/85 border border-red-500/80 text-red-200 text-xs flex items-start gap-1.5 animate-shake">
                <span className="font-bold text-red-400 uppercase tracking-wider shrink-0 text-[10px] mt-0.5">Peringatan:</span>
                <span className="leading-relaxed text-[11px]">{registerError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full mt-1 py-2.5 pixel-btn-gold text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow"
            >
              {roomCode && mySessionId ? (
                <>
                  <span>Masuk ke {createdRoomName || `Kelompok ${selectedGroup}`}</span>
                  <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Enter" className="w-3.5 h-3.5 image-pixelated" />
                </>
              ) : (
                <>
                  <span>Lanjut ke Pilihan Kelompok</span>
                  <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Next" className="w-3.5 h-3.5 image-pixelated" />
                </>
              )}
            </button>

            {roomCode && mySessionId && (
              <button
                type="button"
                onClick={() => setStep('LOBBY')}
                className="w-full py-0.5 text-[10px] text-amber-400/80 hover:text-amber-200 underline text-center block"
              >
                Ingin pindah kelompok? Pilih Kelompok Lain
              </button>
            )}
          </form>

          <div className="flex gap-2 mt-2 pt-1 border-t border-[#54280b]/50">
            <button
              type="button"
              onClick={() => setStep('SERVER_SELECT')}
              className="flex-1 py-1.5 pixel-btn-silver text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <img src="/assets/fantasy_pixelart_ui/icons/silver_left.png" alt="Back" className="w-3 h-3 image-pixelated" />
              <span>Pilih Server</span>
            </button>
            {roomCode && (
              <button
                type="button"
                onClick={handleResetSession}
                className="px-2.5 py-1.5 pixel-btn-wood text-xs text-red-300 hover:text-red-100"
                title="Hapus sesi kelompok"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── STEP 2: LOBBY ───────────────────────────────────────────────────────
  if (step === 'LOBBY') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-3 sm:p-4 font-pixel">
        <div className="max-w-[480px] w-full pixel-panel-wood p-4 sm:p-5 space-y-3.5 select-none max-h-[92vh] overflow-y-auto pixel-scrollbar">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <img src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" alt="Lobby" className="w-4 h-4 image-pixelated" />
              <h1 className="text-lg sm:text-xl font-black text-amber-300 drop-shadow">Pilih / Buat Kelompok</h1>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
              <div className="pixel-box-inset px-3 py-1 inline-block">
                <span className="text-xs text-amber-200">
                  Siswa: <strong className="text-amber-300">{attendanceNo ? `#${attendanceNo} ` : ''}{username}</strong>
                </span>
              </div>
              {selectedServer && (
                <div className="pixel-box-inset px-3 py-1 inline-block">
                  <span className="text-xs text-amber-200">
                    Server: <strong className="text-amber-300">{selectedServer.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Owner: approval tab */}
          {isCreator && mySessionId && (
            <div className="pixel-box-inset p-3 space-y-2">
              <button
                onClick={() => setShowApprovalTab((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-amber-300"
              >
                <span>Permintaan Bergabung</span>
                <div className="flex items-center gap-2">
                  {pendingRequests.length > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full animate-pulse">
                      {pendingRequests.length}
                    </span>
                  )}
                  <span className="font-mono text-xs">{showApprovalTab ? '[-]' : '[+]'}</span>
                </div>
              </button>

              {showApprovalTab && (
                <div className="space-y-1.5 pt-1">
                  {/* Pending requests */}
                  {pendingRequests.length === 0 ? (
                    <p className="text-[10px] text-amber-500/70 text-center py-2">Tidak ada permintaan bergabung saat ini.</p>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between bg-[#1c0d05] px-2 py-1.5 rounded border border-amber-800/30">
                        <div>
                          <div className="text-[11px] font-bold text-amber-200">{req.full_name || req.username}</div>
                          {req.attendance_no && <div className="text-[9px] text-amber-500">No. Absen: #{req.attendance_no}</div>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="text-[10px] px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded font-bold hover:bg-emerald-800/60"
                          >
                            Terima
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="text-[10px] px-2 py-0.5 bg-red-950/60 text-red-300 border border-red-800/50 rounded font-bold hover:bg-red-900/60"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Approved members list with kick option */}
                  {myGroupMembers.filter((m) => m.status === 'approved' && m.player_id !== myPlayerIdRef.current).length > 0 && (
                    <div className="pt-2 border-t border-amber-900/40">
                      <p className="text-[10px] text-amber-400/70 mb-1">Anggota Kelompok:</p>
                      {myGroupMembers
                        .filter((m) => m.status === 'approved' && m.player_id !== myPlayerIdRef.current)
                        .map((m) => (
                          <div key={m.id} className="flex items-center justify-between bg-[#140802] px-2 py-1 rounded text-[10px] mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-amber-200">{m.full_name || m.username}</span>
                              {m.attendance_no && <span className="text-amber-500">#{m.attendance_no}</span>}
                            </div>
                            <button
                              onClick={() => handleKickMember(m)}
                              className="text-[9px] text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded hover:bg-red-950/40"
                            >
                              Kick
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group selection grid */}
          <div className="pixel-box-inset p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/assets/fantasy_pixelart_ui/icons/gold_castle.png" alt="Team" className="w-4 h-4 image-pixelated" />
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider">Daftar Kelompok (1-9)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-mono">Maks 4/Kelompok</span>
                <button onClick={loadGroupSessions} className="text-[10px] text-amber-500 hover:text-amber-300 font-mono">[refresh]</button>
              </div>
            </div>

            {loadingGroups ? (
              <div className="text-center text-amber-500 text-xs py-4">Memuat kelompok...</div>
            ) : (
              <>
                {/* 9-slot grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {groupsData.map((g) => {
                    const isSelected = selectedGroup === g.slot;
                    return (
                      <button
                        key={g.slot}
                        type="button"
                        onClick={() => {
                          setSelectedGroup(g.slot);
                          setCreateRoomError('');
                          setJoinError('');
                          if (!g.exists) setGroupNameInput(`Kelompok ${g.slot}`);
                        }}
                        className={`p-2 rounded text-left transition-all ${
                          isSelected
                            ? 'pixel-box-inset border-2 border-amber-300 bg-[#2f1708] pixel-shadow-sm'
                            : g.exists
                            ? 'pixel-box-inset border border-amber-900/40 bg-[#120702] opacity-75 hover:opacity-100'
                            : 'pixel-box-inset border border-amber-600/50 bg-[#1c0d05] hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={isSelected ? 'text-amber-300' : g.exists ? 'text-amber-500/70' : 'text-amber-200'}>
                            Kel. {g.slot}
                          </span>
                          <div className="flex items-center gap-1">
                            {g.isOwner && (
                              <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-amber-900/90 text-amber-300 border border-amber-500/50">
                                Owner
                              </span>
                            )}
                            {!g.isOwner && g.isApprovedMember && (
                              <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-blue-950/90 text-blue-300 border border-blue-700/50">
                                Anda
                              </span>
                            )}
                            <span className={`font-mono text-[9px] px-1 rounded ${g.isFull ? 'bg-red-950/80 text-red-300 border border-red-800/60' : g.exists ? 'bg-[#180903] text-amber-500/80 border border-amber-800/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'}`}>
                              [{g.count}/4]
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] truncate mt-0.5 text-amber-400/60 font-medium">
                          {g.exists ? g.roomName : 'Tersedia'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail & action for selected group */}
                <div className="pt-1 space-y-2">
                  {!currentSelectedGroupData.exists && (
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300/80 uppercase tracking-wider mb-1">
                        Nama Kelompok Baru
                      </label>
                      <input
                        type="text"
                        value={groupNameInput}
                        onChange={(e) => { setGroupNameInput(e.target.value); setCreateRoomError(''); }}
                        placeholder={`Contoh: Kelompok ${selectedGroup} - Tim Alpha`}
                        className="w-full pixel-box-inset px-3 py-2 text-xs bg-[#1c0d05] text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {currentSelectedGroupData.exists && (
                    <div className="pixel-box-inset p-2 text-[10px] text-amber-400/70 leading-snug">
                      Kelompok {selectedGroup} dibuat oleh <strong className="text-amber-300">{currentSelectedGroupData.ownerName || 'Ketua'}</strong>
                      {' '}({currentSelectedGroupData.count}/4 anggota).
                      {currentSelectedGroupData.dbMembers.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {currentSelectedGroupData.dbMembers.map((m) => (
                            <div key={m.id} className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              <span>{m.full_name || m.username}</span>
                              {m.attendance_no && <span className="text-amber-500">#{m.attendance_no}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {createRoomError && <p className="text-[11px] text-red-400 font-bold">{createRoomError}</p>}
                  {joinError && <p className="text-xs text-red-400 font-bold">{joinError}</p>}

                  {/* Join status overlay */}
                  {joinStatus === 'WAITING' && (
                    <div className="pixel-box-inset p-3 text-center text-xs text-amber-300 space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span>Menunggu persetujuan <strong>{waitingHostName}</strong>...</span>
                      </div>
                      <p className="text-[10px] text-amber-500">Akan bergabung otomatis dalam 15 detik jika tidak ada respons.</p>
                    </div>
                  )}

                  {joinStatus === 'ACCEPTED' && (
                    <div className="pixel-box-inset p-3 text-center text-xs text-emerald-300">
                      Diterima! Memasuki kelompok...
                    </div>
                  )}

                  {joinStatus === 'REJECTED' && (
                    <div className="pixel-box-inset p-3 text-center text-xs text-red-400">
                      Permintaan ditolak oleh ketua kelompok.
                    </div>
                  )}

                  {/* Action buttons */}
                  {!joinStatus && (
                    currentSelectedGroupData.exists ? (
                      (currentSelectedGroupData.isOwner || currentSelectedGroupData.isApprovedMember) ? (
                        <button
                          onClick={() => handleEnterMyGroup(currentSelectedGroupData)}
                          className="w-full py-2.5 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                        >
                          <img src="/assets/fantasy_pixelart_ui/icons/gold_star.png" alt="Star" className="w-3.5 h-3.5 image-pixelated" />
                          <span>
                            {currentSelectedGroupData.isOwner
                              ? `Masuk ke Kelompok ${selectedGroup} (Anda Pemilik/Owner)`
                              : `Masuk ke Kelompok ${selectedGroup} (Kelompok Anda)`}
                          </span>
                          <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Enter" className="w-3.5 h-3.5 image-pixelated" />
                        </button>
                      ) : currentSelectedGroupData.isFull ? (
                        <button disabled className="w-full py-2.5 pixel-btn-silver text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
                          Kelompok {selectedGroup} Penuh [4/4]
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinSelectedGroup(currentSelectedGroupData)}
                          className="w-full py-2.5 pixel-btn-wood text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <span>Minta Gabung Kelompok {selectedGroup}</span>
                          <img src="/assets/fantasy_pixelart_ui/icons/gold_right.png" alt="Join" className="w-3.5 h-3.5 image-pixelated" />
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleCreateGroupRoom(currentSelectedGroupData.slot, groupNameInput)}
                        className="w-full py-2.5 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <span>Buat Kelompok {selectedGroup} (Jadi Owner)</span>
                        <img src="/assets/fantasy_pixelart_ui/icons/gold_star.png" alt="Star" className="w-3.5 h-3.5 image-pixelated" />
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setStep('REGISTER')}
            className="w-full py-2 pixel-btn-silver text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <img src="/assets/fantasy_pixelart_ui/icons/silver_left.png" alt="Back" className="w-3.5 h-3.5 image-pixelated" />
            <span>Kembali ke Form Absensi</span>
          </button>
        </div>
      </main>
    );
  }

  // ─── STEP 3: GAME ────────────────────────────────────────────────────────
  return (
    <main className="w-full h-full min-h-screen">
      <VirtualRoom
        fullName={fullName}
        attendanceNo={attendanceNo}
        studentClass={activeClass}
        username={username}
        roomCode={roomCode}
        initialRoomName={createdRoomName || `Kelompok ${selectedGroup}`}
        groupNumber={selectedGroup}
        characterIndex={characterIndex}
        color={color}
        isAdmin={false}
        isCreator={isCreator}
        serverId={selectedServer?.id}
        sessionId={mySessionId}
        myPlayerId={myPlayerIdRef.current || getMyPlayerId()}
        onLeave={handleLeaveGame}
        onKicked={handleKicked}
      />
    </main>
  );
}
