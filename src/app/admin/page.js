'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VirtualRoom from '@/components/room/VirtualRoom';
import { DEFAULT_ACTIVE_CLASS } from '@/lib/studentsData';
import { ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

const ADMIN_PIN = '6769';

export default function AdminPortalPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState('AUTH'); // 'AUTH' | 'LOBBY' | 'GAME'

  const [activeClass, setActiveClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('virtual_active_class') || DEFAULT_ACTIVE_CLASS;
    }
    return DEFAULT_ACTIVE_CLASS;
  });

  const [roomCode, setRoomCode] = useState('ADMIN_ROOM');
  const [roomName, setRoomName] = useState('Ruang Kendali Admin');
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Restore admin session on page refresh so admin does not have to re-login
  useEffect(() => {
    try {
      const saved = localStorage.getItem('virtual_admin_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.isAuthenticated) {
          setIsAuthenticated(true);
          if (session.roomCode) setRoomCode(session.roomCode);
          if (session.roomName) setRoomName(session.roomName);
          setStep(session.step || 'GAME');
        }
      }
    } catch (err) {
      console.warn('Gagal memulihkan sesi admin:', err);
    }
  }, []);

  const saveAdminSession = (code, name, targetStep = 'GAME') => {
    try {
      const session = {
        isAuthenticated: true,
        step: targetStep,
        roomCode: code,
        roomName: name,
        savedAt: Date.now(),
      };
      localStorage.setItem('virtual_admin_session', JSON.stringify(session));
    } catch (e) {}
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      setError('');
      saveAdminSession(roomCode, roomName, 'LOBBY');
      setStep('LOBBY');
    } else {
      setError('PIN Pengajar salah! Silakan periksa kembali.');
    }
  };

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
    saveAdminSession(newCode, roomName, 'GAME');
    setStep('GAME');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setJoinError('Masukkan Kode Kelompok terlebih dahulu!');
      return;
    }
    setRoomCode(clean);
    setJoinError('');
    saveAdminSession(clean, roomName, 'GAME');
    setStep('GAME');
  };

  const handleLogoutAdmin = () => {
    try {
      localStorage.removeItem('virtual_admin_session');
    } catch (e) {}
    setIsAuthenticated(false);
    setPin('');
    setStep('AUTH');
  };

  // STEP 1: AUTH WITH PIN 6769
  if (step === 'AUTH') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4 relative select-none">
        <div className="max-w-sm w-full pixel-panel-wood p-6 sm:p-7 space-y-4 text-center animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img
              src="/assets/fantasy_pixelart_ui/icons/gold_star.png"
              alt="Admin"
              className="w-6 h-6 image-pixelated animate-pulse"
            />
            <h1 className="text-lg font-black text-amber-300 drop-shadow uppercase tracking-wider">
              Portal Admin
            </h1>
            <img
              src="/assets/fantasy_pixelart_ui/icons/gold_star.png"
              alt="Admin"
              className="w-6 h-6 image-pixelated animate-pulse"
            />
          </div>

          <p className="text-xs text-amber-200/80 leading-relaxed">
            Halaman ini khusus untuk Admin. Silakan masukkan PIN keamanan untuk mengakses ruang kendali kelas virtual.
          </p>

          <form onSubmit={handleVerify} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-amber-300 mb-1.5 uppercase tracking-wider">
                PIN Pengajar
              </label>
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full pixel-box-inset px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-amber-300 placeholder-amber-800/60 focus:outline-none focus:border-amber-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-bold">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi & Masuk Admin</span>
            </button>
          </form>

          <div className="pt-3 border-t border-[#5c3416]">
            <Link
              href="/"
              className="text-xs text-amber-400/70 hover:text-amber-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Siswa</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // STEP 2: LOBBY SELECTION FOR ADMIN
  if (step === 'LOBBY') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4 select-none">
        <div className="max-w-md w-full pixel-panel-wood p-6 sm:p-7 space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="/assets/fantasy_pixelart_ui/icons/gold_star.png"
                alt="Admin"
                className="w-5 h-5 image-pixelated"
              />
              <h2 className="text-lg font-black text-amber-300">Ruang Kontrol Admin</h2>
            </div>
            <span className="pixel-box-inset px-3 py-1 text-xs text-amber-300 inline-block">
              Terverifikasi sebagai <strong>Pengajar / Admin</strong>
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Opsi 1: Masuk ke Kelas Utama / Default */}
            <div className="pixel-box-inset p-3.5 space-y-2">
              <h3 className="text-xs font-bold text-amber-200 uppercase">
                Masuk Langsung ke Kelas Utama (Semua Kelompok)
              </h3>
              <p className="text-[11px] text-amber-400/80">
                Memantau seluruh kelompok siswa yang sedang berjalan di kelas virtual.
              </p>
              <button
                onClick={() => {
                  setRoomCode('LOBBY1');
                  setStep('GAME');
                }}
                className="w-full py-2.5 pixel-btn-gold text-xs font-bold uppercase tracking-wider"
              >
                Masuk ke Kelas Virtual
              </button>
            </div>

            {/* Opsi 2: Buat Room Kelompok Khusus */}
            <div className="pixel-box-inset p-3.5 space-y-2">
              <h3 className="text-xs font-bold text-amber-200 uppercase">
                Buat Ruang Kelompok Baru
              </h3>
              <button
                onClick={handleCreateRoom}
                className="w-full py-2 pixel-btn-wood text-xs font-bold uppercase tracking-wider"
              >
                Buat Kode Ruang Acak
              </button>
            </div>

            {/* Opsi 3: Gabung ke Kelompok Tertentu */}
            <div className="pixel-box-inset p-3.5 space-y-2">
              <h3 className="text-xs font-bold text-amber-200 uppercase">
                Masuk ke Kode Kelompok Tertentu
              </h3>
              <form onSubmit={handleJoinRoom} className="space-y-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Kode Kelompok (misal: MCDV12)"
                  className="w-full pixel-box-inset px-3 py-1.5 text-xs text-center font-mono font-bold text-amber-300 uppercase focus:outline-none"
                />
                {joinError && <p className="text-[10px] text-red-400 font-bold">{joinError}</p>}
                <button
                  type="submit"
                  className="w-full py-2 pixel-btn-wood text-xs font-bold uppercase tracking-wider"
                >
                  Gabung ke Kode Ini
                </button>
              </form>
            </div>
          </div>

          <div className="pt-2 border-t border-[#5c3416] text-center">
            <button
              onClick={handleLogoutAdmin}
              className="text-xs text-amber-400/70 hover:text-amber-200"
            >
              Keluar dari Sesi Admin
            </button>
          </div>
        </div>
      </main>
    );
  }

  // STEP 3: VIRTUAL ROOM IN ADMIN MODE
  return (
    <main className="w-full h-full min-h-screen">
      <VirtualRoom
        fullName="Instruktur Admin"
        attendanceNo=""
        studentClass={activeClass}
        username="Admin"
        roomCode={roomCode}
        initialRoomName={roomName}
        characterIndex={1}
        color="#fbbf24"
        isAdmin={true}
        onLeave={() => {
          saveAdminSession(roomCode, roomName, 'LOBBY');
          setStep('LOBBY');
        }}
      />
    </main>
  );
}
