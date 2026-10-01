"use client";

import { useState, useEffect } from 'react';
import VirtualRoom from '@/components/room/VirtualRoom';

const CHARACTERS = [
  { id: 1, name: 'Siswa Magenta', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_001.png' },
  { id: 2, name: 'Siswa Silver', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_002.png' },
  { id: 3, name: 'Siswa Bronze', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_003.png' },
  { id: 4, name: 'Siswa Hitam', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_004.png' },
  { id: 5, name: 'Siswa Hijau', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_005.png' },
  { id: 6, name: 'Siswa Merah', type: 'rpgmaker', sprite: '/assets/RPG Maker MZ (48x48)/characters/$Char_006.png' },
  { 
    id: 7, 
    name: 'Prajurit Knight', 
    type: 'tinyrpg', 
    idle: '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Soldier/Soldier with shadows/Soldier_Idle.png',
    frames: 6
  },
  { 
    id: 8, 
    name: 'Prajurit Orc', 
    type: 'tinyrpg', 
    idle: '/assets/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc/Characters(100x100 split)/Orc/Orc with shadows/Orc_Idle.png',
    frames: 6
  },
];

export default function Home() {
  // Step 1: 'REGISTER', Step 2: 'LOBBY', Step 3: 'GAME'
  const [step, setStep] = useState('REGISTER');

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

  const isAdmin = String(attendanceNo).trim() === '99499';

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

  const handleCreateRoom = () => {
    const newCode = generateRoomCode();
    setRoomCode(newCode);
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
    setRoomCode(clean);
    setJoinError('');
    setStep('GAME');
  };

  const handleLeaveGame = () => {
    setStep('LOBBY');
  };

  // STEP 1: FORM ABSENSI (Tanpa Input Room Name Manual)
  if (step === 'REGISTER') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4 relative">
        <div className="max-w-md w-full pixel-panel-wood p-6 sm:p-7 relative select-none">
          {isAdmin && (
            <div className="mb-4 bg-amber-900/60 border border-amber-500 text-amber-200 px-3 py-1 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg animate-pulse">
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_star.png"
                alt="Admin"
                className="w-4 h-4 image-pixelated"
              />
              <span>MODE INSTRUKTUR / GURU</span>
            </div>
          )}
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
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isFormValid) setStep('LOBBY');
            }} 
            className="space-y-3.5"
          >
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
                  onChange={(e) => setCreatedRoomName(e.target.value)}
                  placeholder="Contoh: Kelompok Alpha / Tim 1"
                  className="w-full pixel-box-inset px-3 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400"
                />
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
                  <p className="text-xs text-red-400 font-bold text-center">{joinError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 pixel-btn-wood text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>Gabung Kelompok</span>
                  <img
                    src="/assets/fantasy_pixelart_ui/icons/gold_right.png"
                    alt="Join"
                    className="w-3.5 h-3.5 image-pixelated"
                  />
                </button>
              </form>
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
        username={username}
        roomCode={roomCode}
        initialRoomName={createdRoomName || 'Kelompok 1'}
        characterIndex={characterIndex}
        color={color} 
        isAdmin={isAdmin}
        onLeave={handleLeaveGame}
      />
    </main>
  );
}


