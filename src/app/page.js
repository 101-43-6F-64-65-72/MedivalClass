"use client";

import { useState } from 'react';
import VirtualRoom from '@/components/room/VirtualRoom';

export default function Home() {
  // Step 1: 'REGISTER', Step 2: 'LOBBY', Step 3: 'GAME'
  const [step, setStep] = useState('REGISTER');

  // Form Absensi state
  const [fullName, setFullName] = useState('');
  const [attendanceNo, setAttendanceNo] = useState('');
  const [username, setUsername] = useState('');
  const [characterIndex, setCharacterIndex] = useState(1);
  const [color, setColor] = useState('#3b82f6'); // default blue

  // Room / Lobby state
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomName, setCreatedRoomName] = useState('Kelas Virtual');
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
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full relative overflow-hidden">
          {isAdmin && (
            <div className="mb-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg animate-pulse">
              <span>⭐ MODE INSTRUKTUR / GURU</span>
            </div>
          )}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-emerald-400">Multiplayer Virtual Classroom</h1>
            <p className="text-xs text-slate-400 mt-1">Langkah 1 dari 2: Form Absensi Siswa</p>
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isFormValid) setStep('LOBBY');
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  No. Absen <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={attendanceNo}
                  onChange={(e) => setAttendanceNo(e.target.value)}
                  placeholder="Contoh: 12"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Username <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: budi123"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Pilih Karakter Siswa
              </label>
              <div className="grid grid-cols-6 gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setCharacterIndex(idx)}
                    className={`flex items-center justify-center p-1 rounded-lg border-2 transition-all ${
                      characterIndex === idx ? 'border-emerald-400 bg-emerald-950/40 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div 
                      className="w-8 h-8"
                      style={{
                        backgroundImage: `url('/assets/RPG Maker MZ (48x48)/characters/$Char_${String(idx).padStart(3, '0')}.png')`,
                        backgroundPosition: '0px 0px',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!isFormValid}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-950/50"
            >
              Lanjut ke Pilihan Kelas &rarr;
            </button>
          </form>
        </div>
      </main>
    );
  }

  // STEP 2: IN-GAME LOBBY MENU (Buat Room vs Join Kode Team)
  if (step === 'LOBBY') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-amber-400">Pilih / Buat Kelas Virtual</h1>
            <p className="text-xs text-slate-400 mt-1">
              Selamat datang, <strong className="text-slate-200">#{attendanceNo} {username}</strong>!
            </p>
          </div>

          <div className="space-y-4">
            {/* Opsi 1: Buat Room Baru */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition space-y-3">
              <div>
                <h3 className="font-bold text-sm text-emerald-400 mb-1">🏫 Buat Kelas Baru (Host)</h3>
                <p className="text-xs text-slate-400">Tentukan nama kelas dan dapatkan Kode Kelas acak.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Kelas / Sesi
                </label>
                <input
                  type="text"
                  value={createdRoomName}
                  onChange={(e) => setCreatedRoomName(e.target.value)}
                  placeholder="Contoh: Kelas Kolaborasi A"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md"
              >
                Buat & Masuk Kelas
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">atau</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Opsi 2: Join via Kode Team */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition">
              <h3 className="font-bold text-sm text-indigo-400 mb-1">🔑 Masuk via Kode Kelas</h3>
              <p className="text-xs text-slate-400 mb-3">Masukkan 6 karakter Kode Kelas yang dibagikan guru atau temanmu.</p>
              
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="Contoh: MCDV12"
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-base font-mono font-bold tracking-widest text-amber-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase transition"
                />
                
                {joinError && (
                  <p className="text-xs text-red-400 font-medium text-center">{joinError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md"
                >
                  Gabung Kelas
                </button>
              </form>
            </div>
          </div>

          <button
            onClick={() => setStep('REGISTER')}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition text-center"
          >
            &larr; Kembali ke Form Absensi
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
        initialRoomName={createdRoomName || 'Kelas Virtual'}
        characterIndex={characterIndex}
        color={color} 
        isAdmin={isAdmin}
        onLeave={handleLeaveGame}
      />
    </main>
  );
}


