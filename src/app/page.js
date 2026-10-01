"use client";

import { useState, useEffect, useRef } from 'react';
import VirtualRoom from '@/components/room/VirtualRoom';
import { AVAILABLE_CLASSES, DEFAULT_ACTIVE_CLASS, getStudentsByClass } from '@/lib/studentsData';
import { supabase } from '@/lib/supabaseClient';

const CHARACTERS = [
  { id: 1, name: 'Siswa Magenta', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_001.png' },
  { id: 2, name: 'Siswa Silver', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_002.png' },
  { id: 3, name: 'Siswa Bronze', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_003.png' },
  { id: 4, name: 'Siswa Hitam', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_004.png' },
  { id: 5, name: 'Siswa Hijau', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_005.png' },
  { id: 6, name: 'Siswa Merah', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_006.png' },
];

export default function Home() {
  // Step 1: 'REGISTER', Step 2: 'LOBBY', Step 3: 'GAME'
  const [step, setStep] = useState('REGISTER');

  // Active Class State (strictly Class XI)
  const [activeClass, setActiveClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('virtual_active_class') || DEFAULT_ACTIVE_CLASS;
    }
    return DEFAULT_ACTIVE_CLASS;
  });

  const classStudents = getStudentsByClass(activeClass);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorage = () => {
        const saved = localStorage.getItem('virtual_active_class');
        if (saved) setActiveClass(saved);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  // Form Absensi state
  const [fullName, setFullName] = useState('');
  const [attendanceNo, setAttendanceNo] = useState('');
  const [username, setUsername] = useState('');
  const [characterIndex, setCharacterIndex] = useState(1);
  const [color, setColor] = useState('#3b82f6'); // default blue
  const [rotStep, setRotStep] = useState(0);

  // Rotation showcase ticker (850ms per direction - calm & clear preview)
  useEffect(() => {
    const timer = setInterval(() => {
      setRotStep((prev) => (prev + 1) % 4);
    }, 850);
    return () => clearInterval(timer);
  }, []);

  // Room / Lobby state
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomName, setCreatedRoomName] = useState('Kelompok 1');
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  // Room Join Confirmation States
  const [joinStatus, setJoinStatus] = useState(null); // null | 'WAITING' | 'ACCEPTED' | 'REJECTED'
  const [waitingHostName, setWaitingHostName] = useState('');
  const [activePresenceMap, setActivePresenceMap] = useState(new Map());
  const lobbyChannelRef = useRef(null);
  const currentRequestIdRef = useRef(null);

  // Active Group Names in Universe (Prevents duplicate room names)
  const [activeGroupNames, setActiveGroupNames] = useState(new Set());
  const [createRoomError, setCreateRoomError] = useState('');

  // Listen to active rooms in shared universe to prevent duplicate room names & handle join responses
  useEffect(() => {
    if (step !== 'LOBBY' || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channel = supabase.channel('classroom:shared_universe', {
      config: { broadcast: { ack: false, self: false } },
    });
    lobbyChannelRef.current = channel;

    const updateNames = () => {
      const state = channel.presenceState();
      const names = new Set();
      const pMap = new Map();
      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const p = presences[0];
          pMap.set(key, p);
          if (p.roomName && p.roomName.trim()) {
            names.add(p.roomName.trim().toLowerCase());
          }
        }
      });
      setActiveGroupNames(names);
      setActivePresenceMap(pMap);
    };

    channel
      .on('presence', { event: 'sync' }, updateNames)
      .on('broadcast', { event: 'join-room-response' }, ({ payload }) => {
        if (!payload || payload.requestId !== currentRequestIdRef.current) return;

        if (payload.status === 'ACCEPTED') {
          setJoinStatus('ACCEPTED');
          setIsCreator(false);
          saveStudentSession(payload.roomCode, payload.roomName, false);
          setTimeout(() => {
            setRoomCode(payload.roomCode);
            setCreatedRoomName(payload.roomName);
            setStep('GAME');
            setJoinStatus(null);
          }, 800);
        } else if (payload.status === 'REJECTED') {
          setJoinStatus('REJECTED');
          setJoinError(payload.reason || 'Permintaan bergabung ditolak oleh pembuat kelompok.');
          setTimeout(() => {
            setJoinStatus(null);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      lobbyChannelRef.current = null;
    };
  }, [step]);

  // Propose next available unique default room name
  useEffect(() => {
    if (step === 'LOBBY') {
      let idx = 1;
      while (activeGroupNames.has(`kelompok ${idx}`)) {
        idx++;
      }
      setCreatedRoomName(`Kelompok ${idx}`);
    }
  }, [step, activeGroupNames]);

  const isFormValid = 
    fullName.trim() !== '' && 
    attendanceNo.trim() !== '' && 
    username.trim() !== '';

  // Generate 6-character random uppercase code (e.g., MCDV12)
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Restore student session on page refresh so user does not repeat login
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
          if (session.activeClass) setActiveClass(session.activeClass);
          setRoomCode(session.roomCode);
          setCreatedRoomName(session.createdRoomName || 'Kelompok 1');
          if (session.isCreator) setIsCreator(true);
          setStep('GAME');
        }
      }
    } catch (err) {
      console.warn('Gagal memulihkan sesi siswa:', err);
    }
  }, []);

  const saveStudentSession = (targetRoomCode, targetRoomName, creatorFlag = false) => {
    try {
      const session = {
        fullName,
        attendanceNo,
        username,
        characterIndex,
        color,
        activeClass,
        roomCode: targetRoomCode,
        createdRoomName: targetRoomName,
        isCreator: !!creatorFlag,
        step: 'GAME',
        savedAt: Date.now(),
      };
      localStorage.setItem('virtual_student_session', JSON.stringify(session));
    } catch (e) {}
  };

  const handleCreateRoom = () => {
    const clean = createdRoomName.trim();
    if (!clean) {
      setCreateRoomError('Nama kelompok tidak boleh kosong!');
      return;
    }
    if (activeGroupNames.has(clean.toLowerCase())) {
      setCreateRoomError(`Nama kelompok "${clean}" sudah digunakan! Silakan gunakan nama kelompok lain.`);
      return;
    }
    setCreateRoomError('');
    const newCode = generateRoomCode();
    setRoomCode(newCode);
    setIsCreator(true);
    saveStudentSession(newCode, clean, true);
    setStep('GAME');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setJoinError('Masukkan Kode Team terlebih dahulu!');
      return;
    }
    if (clean.length < 4) {
      setJoinError('Kode Team minimal 4 karakter!');
      return;
    }

    // Find if the room is active in the shared universe
    const allPresences = Array.from(activePresenceMap.values());
    const targetPlayers = allPresences.filter(
      (p) => p.roomCode && p.roomCode.trim().toUpperCase() === clean
    );

    if (targetPlayers.length === 0) {
      setJoinError(`Kode Team "${clean}" tidak ditemukan atau pembuat kelompok sedang offline!`);
      return;
    }

    // Find host/creator player in the group
    const hostPlayer = targetPlayers.find((p) => p.isCreator) || targetPlayers[0];
    const hostName = hostPlayer.fullName || hostPlayer.username || 'Ketua Kelompok';

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = requestId;
    setWaitingHostName(hostName);
    setJoinStatus('WAITING');
    setJoinError('');

    if (lobbyChannelRef.current) {
      lobbyChannelRef.current.send({
        type: 'broadcast',
        event: 'join-room-request',
        payload: {
          requestId,
          roomCode: clean,
          applicant: {
            username,
            fullName,
            attendanceNo,
            studentClass: activeClass,
            characterIndex,
            color,
          },
        },
      });
    }

    // Timeout: if no response after 35 seconds
    setTimeout(() => {
      if (currentRequestIdRef.current === requestId) {
        setJoinStatus((prev) => {
          if (prev === 'WAITING') {
            setJoinError(`Pembuat kelompok (${hostName}) belum merespons. Silakan hubungi langsung atau coba lagi.`);
            return null;
          }
          return prev;
        });
      }
    }, 35000);
  };

  const handleLeaveGame = () => {
    try {
      localStorage.removeItem('virtual_student_session');
    } catch (e) {}
    setStep('REGISTER');
  };

  // STEP 1: FORM ABSENSI (Tanpa Input Room Name Manual)
  if (step === 'REGISTER') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4 relative">
        <div className="max-w-md w-full pixel-panel-wood p-6 sm:p-7 relative select-none">
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_castle.png"
                alt="Castle"
                className="w-6 h-6 image-pixelated"
              />
              <h1 className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow">Virtual Classroom</h1>
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_castle.png"
                alt="Castle"
                className="w-6 h-6 image-pixelated"
              />
            </div>
            <p className="text-[11px] text-amber-200/80">Langkah 1 dari 2: Form Absensi Siswa</p>
            {/* Active Class Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 pixel-box-inset px-2.5 py-1 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Kelas Aktif:</span>
              <strong className="text-white font-mono">{activeClass}</strong>
            </div>
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isFormValid) setStep('LOBBY');
            }} 
            className="space-y-3.5"
          >
            {/* Quick Pick from Active Class Roster */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Pilih Siswa ({activeClass})
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {classStudents.length} Terdaftar
                </span>
              </div>
              <select
                value={attendanceNo && fullName ? `${attendanceNo}|||${fullName}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [no, sName] = val.split('|||');
                  setAttendanceNo(no);
                  setFullName(sName);
                  const firstWord = sName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                  setUsername(firstWord || 'siswa');
                }}
                className="w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 bg-[#1f0d03] focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Pilih dari Daftar Siswa {activeClass} --</option>
                {classStudents.map((s) => (
                  <option key={s.nis} value={`${s.no}|||${s.name}`}>
                    #{s.no} - {s.name} ({s.nis})
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-amber-400/60 mt-1">
                Atau Anda juga dapat mengisi kolom nama di bawah secara manual.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-300 mb-1 uppercase tracking-wider">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full pixel-box-inset px-3.5 py-2 text-sm text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1 uppercase tracking-wider">
                  No. Absen <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={attendanceNo}
                  onChange={(e) => setAttendanceNo(e.target.value)}
                  placeholder="Contoh: 12"
                  className="w-full pixel-box-inset px-3.5 py-2 text-sm text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1 uppercase tracking-wider">
                  Username <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: budi123"
                  className="w-full pixel-box-inset px-3.5 py-2 text-sm text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Pilih Karakter Siswa
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {CHARACTERS.find(c => c.id === characterIndex)?.name}
                </span>
              </div>

              {/* SHOWCASE PEDESTAL */}
              <div className="pixel-box-inset p-3 mb-2.5 flex items-center justify-center gap-5 bg-[#140802]">
                <div className="relative w-20 h-20 flex items-center justify-center bg-amber-950/40 rounded-full border border-amber-600/40 shadow-inner">
                  {/* Rotating character sprite */}
                  {(() => {
                    const current = CHARACTERS.find(c => c.id === characterIndex) || CHARACTERS[0];
                    if (current.type === 'rpgmaker') {
                      // 4 direction rows: 0 = Down, 2 = Right, 3 = Up, 1 = Left
                      const dirOrder = [0, 2, 3, 1];
                      const row = dirOrder[rotStep % 4];
                      return (
                        <div
                          className="w-14 h-14 image-pixelated"
                          style={{
                            backgroundImage: `url('${current.sprite}')`,
                            backgroundPosition: `-56px ${-row * 56}px`,
                            backgroundSize: '168px 224px',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      );
                    } else {
                      // Tiny RPG Soldier or Orc (100x100 scaled up & centered so character is heroic and visible)
                      const frame = rotStep % current.frames;
                      const flip = rotStep % 4 >= 2;
                      return (
                        <div
                          className="w-14 h-14 image-pixelated overflow-hidden"
                          style={{
                            backgroundImage: `url('${current.idle}')`,
                            backgroundPosition: `${-frame * 170 - 57}px -57px`,
                            backgroundSize: `${current.frames * 170}px 170px`,
                            backgroundRepeat: 'no-repeat',
                            transform: flip ? 'scaleX(-1)' : 'scaleX(1)',
                            transformOrigin: 'center center',
                          }}
                        />
                      );
                    }
                  })()}
                  {/* Subtle pedestal shadow */}
                  <div className="absolute bottom-1 w-12 h-2.5 bg-black/70 rounded-full blur-[1px] pointer-events-none" />
                </div>
                <div className="text-left space-y-0.5">
                  <div className="text-sm font-bold text-amber-200">
                    {CHARACTERS.find(c => c.id === characterIndex)?.name}
                  </div>
                  <div className="text-xs text-amber-400/80">
                    {characterIndex >= 7 ? 'Tiny RPG Asset Pack' : 'RPG Maker MZ Series'}
                  </div>
                  <div className="text-[10px] text-amber-500 font-mono">
                    ID Karakter: #{characterIndex}
                  </div>
                </div>
              </div>

              {/* 8-CHARACTER GRID SELECTION */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pixel-box-inset p-2">
                {CHARACTERS.map(c => {
                  const isSelected = characterIndex === c.id;
                  const dirOrder = [0, 2, 3, 1];
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCharacterIndex(c.id)}
                      title={c.name}
                      className={`flex flex-col items-center justify-center p-1.5 rounded border-2 transition-all min-h-[58px] ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-900/60 scale-105 shadow-md ring-1 ring-amber-400' 
                          : 'border-transparent opacity-75 hover:opacity-100 hover:bg-amber-950/40'
                      }`}
                    >
                      <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
                        {c.type === 'rpgmaker' ? (
                          <div 
                            className="w-10 h-10 image-pixelated"
                            style={{
                              backgroundImage: `url('${c.sprite}')`,
                              backgroundPosition: isSelected 
                                ? `-40px ${-dirOrder[rotStep % 4] * 40}px` 
                                : '-40px 0px', // Center facing front
                              backgroundSize: '120px 160px',
                              backgroundRepeat: 'no-repeat',
                            }}
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 image-pixelated overflow-hidden"
                            style={{
                              backgroundImage: `url('${c.idle}')`,
                              backgroundPosition: isSelected 
                                ? `${-(rotStep % c.frames) * 120 - 40}px -40px` 
                                : '-40px -40px',
                              backgroundSize: `${c.frames * 120}px 120px`,
                              backgroundRepeat: 'no-repeat',
                              transform: isSelected && (rotStep % 4 >= 2) ? 'scaleX(-1)' : 'scaleX(1)',
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-amber-300 truncate max-w-[42px] mt-0.5">
                        #{c.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!isFormValid}
              className="w-full mt-5 py-3 pixel-btn-gold text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Pilihan Kelompok</span>
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_right.png"
                alt="Next"
                className="w-4 h-4 image-pixelated"
              />
            </button>

          </form>
        </div>
      </main>
    );
  }

  // STEP 2: IN-GAME LOBBY MENU (Buat Room vs Join Kode Team)
  if (step === 'LOBBY') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4">
        <div className="max-w-md w-full pixel-panel-wood p-6 sm:p-7 space-y-5 select-none">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_flag.png"
                alt="Lobby"
                className="w-5 h-5 image-pixelated"
              />
              <h1 className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow">Pilih / Buat Kelompok</h1>
            </div>
            <div className="pixel-box-inset px-3 py-1 inline-block mt-1">
              <span className="text-xs text-amber-200">
                Siswa: <strong className="text-amber-300 font-bold">#{attendanceNo} {username}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Opsi 1: Buat Room Baru */}
            <div className="pixel-box-inset p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/fantasy_pixelart_ui/icons/gold_castle.png"
                  alt="Host"
                  className="w-4 h-4 image-pixelated"
                />
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider">Buat Kelompok Baru (Host)</h3>
              </div>
              <p className="text-[11px] text-amber-200/70">Tentukan nama kelompok dan dapatkan Kode Kelompok acak.</p>

              <div>
                <label className="block text-[10px] font-bold text-amber-300/80 mb-1 uppercase">
                  Nama Kelompok / Tim
                </label>
                <input
                  type="text"
                  value={createdRoomName}
                  onChange={(e) => {
                    setCreatedRoomName(e.target.value);
                    setCreateRoomError('');
                  }}
                  placeholder="Contoh: Kelompok Alpha / Tim 1"
                  className="w-full pixel-box-inset px-3 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                />
                {createRoomError && (
                  <p className="text-[11px] text-red-400 font-bold mt-1 leading-snug">{createRoomError}</p>
                )}
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-2.5 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <span>Buat & Masuk Kelompok</span>
                <img
                  src="/assets/fantasy_pixelart_ui/icons/gold_star.png"
                  alt="Star"
                  className="w-3.5 h-3.5 image-pixelated"
                />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-0.5 bg-[#5a3012]"></div>
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_sword.png"
                alt="Divider"
                className="w-3.5 h-3.5 image-pixelated opacity-70"
              />
              <span className="text-[10px] text-amber-300 uppercase font-bold tracking-widest">ATAU</span>
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_sword.png"
                alt="Divider"
                className="w-3.5 h-3.5 image-pixelated opacity-70 rotate-180"
              />
              <div className="flex-1 h-0.5 bg-[#5a3012]"></div>
            </div>

            {/* Opsi 2: Join via Kode Team */}
            <div className="pixel-box-inset p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/fantasy_pixelart_ui/icons/gold_flag.png"
                  alt="Join"
                  className="w-4 h-4 image-pixelated"
                />
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider">Masuk via Kode Kelompok</h3>
              </div>

              {joinStatus === 'WAITING' ? (
                <div className="p-3 bg-[#180a03] border border-amber-600/70 rounded text-center space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span>Menunggu Konfirmasi Ketua Kelompok...</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    Permintaan telah dikirim ke <strong>{waitingHostName}</strong>. Mohon tunggu ketua menyetujui izin masuk Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setJoinStatus(null);
                      currentRequestIdRef.current = null;
                    }}
                    className="pixel-btn-silver text-[10px] px-3 py-1 font-bold text-amber-200"
                  >
                    Batalkan Permintaan
                  </button>
                </div>
              ) : joinStatus === 'ACCEPTED' ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded text-center space-y-1 animate-in zoom-in-95">
                  <div className="text-xs font-bold text-emerald-300">
                    Izin Diterima!
                  </div>
                  <p className="text-[10px] text-emerald-200">
                    Memasuki ruang kelas bersama kelompok...
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-amber-200/70">Masukkan 6 karakter Kode Kelompok yang dibagikan ketua atau temanmu.</p>
                  
                  <form onSubmit={handleJoinRoom} className="space-y-2.5">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase());
                        setJoinError('');
                      }}
                      placeholder="Contoh: MCDV12"
                      maxLength={10}
                      className="w-full pixel-box-inset px-4 py-2 text-center text-base font-mono font-black tracking-widest text-amber-300 placeholder-amber-800/60 uppercase focus:outline-none focus:border-amber-400"
                    />
                    
                    {joinError && (
                      <p className="text-xs text-red-400 font-bold text-center leading-snug">{joinError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 pixel-btn-wood text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <span>Minta Izin Bergabung</span>
                      <img
                        src="/assets/fantasy_pixelart_ui/icons/gold_right.png"
                        alt="Join"
                        className="w-3.5 h-3.5 image-pixelated"
                      />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep('REGISTER')}
            className="w-full py-2 pixel-btn-silver text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <img
              src="/assets/fantasy_pixelart_ui/icons/silver_left.png"
              alt="Back"
              className="w-3.5 h-3.5 image-pixelated"
            />
            <span>Kembali ke Form Absensi</span>
          </button>
        </div>
      </main>
    );
  }

  // STEP 3: VIRTUAL ROOM GAME
  return (
    <main className="w-full h-full min-h-screen">
      <VirtualRoom 
        fullName={fullName}
        attendanceNo={attendanceNo}
        studentClass={activeClass}
        username={username}
        roomCode={roomCode}
        initialRoomName={createdRoomName || 'Kelompok 1'}
        characterIndex={characterIndex}
        color={color} 
        isAdmin={false}
        isCreator={isCreator}
        onLeave={handleLeaveGame}
      />
    </main>
  );
}


