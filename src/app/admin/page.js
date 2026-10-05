'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import VirtualRoom from '@/components/room/VirtualRoom';
import { DEFAULT_ACTIVE_CLASS, AVAILABLE_CLASSES, STUDENTS_DATA } from '@/lib/studentsData';
import { ShieldCheck, ArrowLeft, Plus, Trash2, Edit3, Server, Users, ToggleLeft, ToggleRight, RefreshCw, Settings, Lock, Unlock } from 'lucide-react';
import {
  fetchAllServers,
  createServer,
  updateServer,
  deleteServer,
  fetchGroupSessions,
  deleteGroupSession,
  removeMemberFromSession,
} from '@/lib/serverService';

const ADMIN_PIN = '6769';

// Semua kelas yang tersedia
const ALL_CLASSES = Array.from(new Set(AVAILABLE_CLASSES));

export default function AdminPortalPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('AUTH'); // 'AUTH' | 'DASHBOARD' | 'GAME'

  const [activeClass, setActiveClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('virtual_active_class') || DEFAULT_ACTIVE_CLASS;
    }
    return DEFAULT_ACTIVE_CLASS;
  });

  // Server state
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [groupSessions, setGroupSessions] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Server form state
  const [showServerForm, setShowServerForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [serverFormName, setServerFormName] = useState('');
  const [serverFormDesc, setServerFormDesc] = useState('');
  const [serverFormMode, setServerFormMode] = useState('class');
  const [serverFormClass, setServerFormClass] = useState(DEFAULT_ACTIVE_CLASS);
  const [serverFormUsePin, setServerFormUsePin] = useState(false);
  const [serverFormPin, setServerFormPin] = useState('');
  const [serverFormError, setServerFormError] = useState('');
  const [serverFormLoading, setServerFormLoading] = useState(false);

  // Game state (when admin enters a room)
  const [roomCode, setRoomCode] = useState('LOBBY1');
  const [roomName, setRoomName] = useState('Ruang Kendali Admin');

  // Active tab in dashboard
  const [activeTab, setActiveTab] = useState('servers'); // 'servers' | 'groups'

  // Restore admin session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('virtual_admin_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.isAuthenticated) {
          if (session.serverId) setSelectedServerId(session.serverId);
          if (session.step === 'GAME') {
            if (session.roomCode) setRoomCode(session.roomCode);
            if (session.roomName) setRoomName(session.roomName);
            setStep('GAME');
          } else {
            setStep('DASHBOARD');
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memulihkan sesi admin:', err);
    }
  }, []);

  const saveAdminSession = (code, name, targetStep = 'GAME', srvId = selectedServerId) => {
    try {
      localStorage.setItem('virtual_admin_session', JSON.stringify({
        isAuthenticated: true,
        step: targetStep,
        roomCode: code,
        roomName: name,
        serverId: srvId,
        savedAt: Date.now(),
      }));
    } catch (e) {}
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setError('');
      saveAdminSession(roomCode, roomName, 'DASHBOARD');
      setStep('DASHBOARD');
    } else {
      setError('PIN Pengajar salah! Silakan periksa kembali.');
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem('virtual_admin_session'); } catch (_) {}
    setStep('AUTH');
    setPin('');
    setServers([]);
    setGroupSessions([]);
  };

  // Load servers
  const loadServers = useCallback(async () => {
    setLoadingServers(true);
    const data = await fetchAllServers();
    setServers(data);
    setLoadingServers(false);
    if (data.length > 0 && !selectedServerId) {
      setSelectedServerId(data[0].id);
    }
  }, [selectedServerId]);

  useEffect(() => {
    if (step === 'DASHBOARD') {
      loadServers();
    }
  }, [step]);

  // Load group sessions when server selected
  useEffect(() => {
    if (!selectedServerId) return;
    setLoadingGroups(true);
    fetchGroupSessions(selectedServerId).then((data) => {
      setGroupSessions(data);
      setLoadingGroups(false);
    });
  }, [selectedServerId]);

  // Submit server form
  const handleServerFormSubmit = async (e) => {
    e.preventDefault();
    if (!serverFormName.trim()) {
      setServerFormError('Nama server wajib diisi!');
      return;
    }
    setServerFormLoading(true);
    setServerFormError('');
    if (serverFormUsePin && !serverFormPin.trim()) {
      setServerFormError('PIN server wajib diisi jika opsi PIN diaktifkan!');
      setServerFormLoading(false);
      return;
    }
    const payload = {
      name: serverFormName.trim(),
      description: serverFormDesc.trim(),
      mode: serverFormMode,
      active_class: serverFormMode === 'class' ? serverFormClass : null,
      pin: serverFormUsePin && serverFormPin.trim() ? serverFormPin.trim() : null,
    };

    let result;
    if (editingServer) {
      result = await updateServer(editingServer.id, payload);
    } else {
      result = await createServer(payload);
    }

    setServerFormLoading(false);
    if (result.ok) {
      setShowServerForm(false);
      setEditingServer(null);
      setServerFormName('');
      setServerFormDesc('');
      setServerFormMode('class');
      setServerFormClass(DEFAULT_ACTIVE_CLASS);
      setServerFormUsePin(false);
      setServerFormPin('');
      loadServers();
    } else {
      setServerFormError(result.error || 'Gagal menyimpan server.');
    }
  };

  const openEditServer = (srv) => {
    setEditingServer(srv);
    setServerFormName(srv.name);
    setServerFormDesc(srv.description || '');
    setServerFormMode(srv.mode || 'class');
    setServerFormClass(srv.active_class || DEFAULT_ACTIVE_CLASS);
    setServerFormUsePin(Boolean(srv.pin));
    setServerFormPin(srv.pin || '');
    setServerFormError('');
    setShowServerForm(true);
  };

  const handleToggleServer = async (srv) => {
    await updateServer(srv.id, { is_active: !srv.is_active });
    loadServers();
  };

  const handleDeleteServer = async (srv) => {
    if (!confirm(`Hapus server "${srv.name}"? Semua kelompok di server ini akan dihapus.`)) return;
    await deleteServer(srv.id);
    if (selectedServerId === srv.id) {
      setSelectedServerId(null);
      setGroupSessions([]);
    }
    loadServers();
  };

  const handleDeleteGroup = async (session) => {
    if (!confirm(`Hapus kelompok "${session.room_name}"?`)) return;
    await deleteGroupSession(session.id);
    setGroupSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  const handleKickMember = async (session, member) => {
    if (!confirm(`Kick "${member.full_name || member.username}" dari ${session.room_name}?`)) return;
    await removeMemberFromSession(session.id, member.player_id);
    // Reload groups
    const data = await fetchGroupSessions(selectedServerId);
    setGroupSessions(data);
  };

  const handleEnterRoom = (roomCodeVal, roomNameVal, targetServerId = null) => {
    const sId = targetServerId || selectedServerId || (servers[0]?.id || null);
    setSelectedServerId(sId);
    setRoomCode(roomCodeVal);
    setRoomName(roomNameVal);
    saveAdminSession(roomCodeVal, roomNameVal, 'GAME', sId);
    setStep('GAME');
  };

  // ─── STEP 1: AUTH ────────────────────────────────────────────────────────
  if (step === 'AUTH') {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-[#0d0703] text-amber-100 p-4 relative select-none">
        <div className="max-w-sm w-full pixel-panel-wood p-6 sm:p-7 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/assets/fantasy_pixelart_ui/icons/gold_star.png" alt="Admin" className="w-6 h-6 image-pixelated animate-pulse" />
            <h1 className="text-lg font-black text-amber-300 drop-shadow uppercase tracking-wider">Portal Admin</h1>
            <img src="/assets/fantasy_pixelart_ui/icons/gold_star.png" alt="Admin" className="w-6 h-6 image-pixelated animate-pulse" />
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Halaman khusus Admin. Masukkan PIN keamanan untuk mengakses dasbor pengelolaan server dan kelas virtual.
          </p>
          <form onSubmit={handleVerify} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-amber-300 mb-1.5 uppercase tracking-wider">PIN Pengajar</label>
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="••••"
                className="w-full pixel-box-inset px-4 py-2.5 text-center text-2xl font-mono tracking-widest text-amber-300 placeholder-amber-800/60 focus:outline-none focus:border-amber-400"
              />
            </div>
            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
            <button type="submit" className="w-full py-3 pixel-btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi & Masuk Admin</span>
            </button>
          </form>
          <div className="pt-3 border-t border-[#5c3416]">
            <Link href="/" className="text-xs text-amber-400/70 hover:text-amber-200 inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Siswa</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── STEP 2: DASHBOARD ───────────────────────────────────────────────────
  if (step === 'DASHBOARD') {
    const selectedServer = servers.find((s) => s.id === selectedServerId);

    return (
      <main className="w-full min-h-screen bg-[#0d0703] text-amber-100 p-3 sm:p-5">
        {/* Header */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4 pixel-panel-wood p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <img src="/assets/fantasy_pixelart_ui/icons/gold_star.png" alt="Admin" className="w-5 h-5 image-pixelated" />
              <div>
                <h1 className="text-sm font-black text-amber-300 uppercase tracking-wider">Dasbor Admin</h1>
                <p className="text-[10px] text-amber-400/80">Virtual Classroom Control Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {servers.length > 0 && (
                <select
                  value={selectedServerId || ''}
                  onChange={(e) => setSelectedServerId(e.target.value)}
                  className="pixel-box-inset px-2 py-1 text-xs text-amber-200 bg-[#1f0d03] focus:outline-none"
                  title="Pilih server yang ingin dimonitor"
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>Server: {s.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleEnterRoom('LOBBY1', 'Ruang Monitor Admin', selectedServerId || servers[0]?.id)}
                className="pixel-btn-gold py-1.5 px-3 text-[11px] font-bold uppercase flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                Monitor Kelas
              </button>
              <button
                onClick={handleLogout}
                className="pixel-btn-silver py-1.5 px-3 text-[11px] font-bold uppercase flex items-center gap-1"
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === 'servers' ? 'pixel-btn-gold' : 'pixel-btn-silver opacity-70'}`}
            >
              <Server className="w-3.5 h-3.5" />
              Kelola Server
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === 'groups' ? 'pixel-btn-gold' : 'pixel-btn-silver opacity-70'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Kelompok & Member
            </button>
          </div>

          {/* ── TAB: SERVERS ── */}
          {activeTab === 'servers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  Daftar Server ({servers.length})
                </h2>
                <div className="flex gap-2">
                  <button onClick={loadServers} disabled={loadingServers} className="pixel-btn-silver py-1 px-2 text-[10px] flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loadingServers ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setEditingServer(null);
                      setServerFormName('');
                      setServerFormDesc('');
                      setServerFormMode('class');
                      setServerFormClass(DEFAULT_ACTIVE_CLASS);
                      setServerFormUsePin(false);
                      setServerFormPin('');
                      setServerFormError('');
                      setShowServerForm(true);
                    }}
                    className="pixel-btn-gold py-1 px-2 text-[10px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Server
                  </button>
                </div>
              </div>

              {/* Server Form Modal */}
              {showServerForm && (
                <div className="pixel-panel-wood p-4 space-y-3">
                  <h3 className="text-xs font-bold text-amber-200 uppercase">
                    {editingServer ? 'Edit Server' : 'Buat Server Baru'}
                  </h3>
                  <form onSubmit={handleServerFormSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase">Nama Server *</label>
                      <input
                        type="text"
                        value={serverFormName}
                        onChange={(e) => setServerFormName(e.target.value)}
                        placeholder="Contoh: Server Kelas XI TJKT 1"
                        className="w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase">Deskripsi</label>
                      <input
                        type="text"
                        value={serverFormDesc}
                        onChange={(e) => setServerFormDesc(e.target.value)}
                        placeholder="Keterangan singkat server..."
                        className="w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase">Mode Profil Siswa</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setServerFormMode('class')}
                          className={`p-2 text-xs font-bold rounded border-2 transition-all ${serverFormMode === 'class' ? 'border-amber-400 bg-amber-900/50 text-amber-200' : 'border-amber-800/40 text-amber-500 hover:border-amber-600'}`}
                        >
                          Kelas (Pilih dari Daftar)
                        </button>
                        <button
                          type="button"
                          onClick={() => setServerFormMode('free')}
                          className={`p-2 text-xs font-bold rounded border-2 transition-all ${serverFormMode === 'free' ? 'border-amber-400 bg-amber-900/50 text-amber-200' : 'border-amber-800/40 text-amber-500 hover:border-amber-600'}`}
                        >
                          Bebas (Input Manual)
                        </button>
                      </div>
                    </div>

                    {serverFormMode === 'class' && (
                      <div>
                        <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase">Kelas Aktif</label>
                        <select
                          value={serverFormClass}
                          onChange={(e) => setServerFormClass(e.target.value)}
                          className="w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 bg-[#1f0d03] focus:outline-none"
                        >
                          {ALL_CLASSES.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-amber-500 mt-1">
                          Siswa akan memilih nama dari daftar resmi kelas ini.
                        </p>
                      </div>
                    )}

                    {serverFormMode === 'free' && (
                      <div className="pixel-box-inset p-2 text-[10px] text-amber-400/80">
                        Mode Bebas: Siswa mengisi nama, username, dan nomor absen secara manual tanpa terpaku daftar kelas.
                      </div>
                    )}

                    {/* Opsi PIN Server */}
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase">Keamanan Akses Siswa</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => { setServerFormUsePin(false); setServerFormPin(''); }}
                          className={`p-2 text-xs font-bold rounded border-2 transition-all flex items-center justify-center gap-1.5 ${!serverFormUsePin ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300' : 'border-amber-800/40 text-amber-500 hover:border-amber-600'}`}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Tanpa PIN (Bebas)
                        </button>
                        <button
                          type="button"
                          onClick={() => setServerFormUsePin(true)}
                          className={`p-2 text-xs font-bold rounded border-2 transition-all flex items-center justify-center gap-1.5 ${serverFormUsePin ? 'border-amber-400 bg-amber-900/50 text-amber-200' : 'border-amber-800/40 text-amber-500 hover:border-amber-600'}`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Pakai PIN Server
                        </button>
                      </div>
                      {serverFormUsePin && (
                        <div>
                          <input
                            type="text"
                            maxLength={12}
                            value={serverFormPin}
                            onChange={(e) => setServerFormPin(e.target.value)}
                            placeholder="Ketik PIN server (misal: 1234 atau KELASXI)"
                            className="w-full pixel-box-inset px-3 py-2 text-xs font-mono tracking-wider text-amber-200 placeholder-amber-700/60 focus:outline-none"
                          />
                          <p className="text-[9px] text-amber-400/80 mt-1">
                            Siswa wajib memasukkan PIN ini sebelum bisa memilih kelas/profil dan masuk ke server.
                          </p>
                        </div>
                      )}
                    </div>

                    {serverFormError && <p className="text-[11px] text-red-400 font-bold">{serverFormError}</p>}

                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={serverFormLoading} className="flex-1 pixel-btn-gold py-2 text-xs font-bold uppercase">
                        {serverFormLoading ? 'Menyimpan...' : editingServer ? 'Simpan Perubahan' : 'Buat Server'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowServerForm(false); setEditingServer(null); }}
                        className="pixel-btn-silver py-2 px-4 text-xs font-bold uppercase"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Server List */}
              {loadingServers ? (
                <div className="text-center text-amber-500 text-xs py-8">Memuat server...</div>
              ) : servers.length === 0 ? (
                <div className="pixel-box-inset p-6 text-center">
                  <p className="text-amber-500 text-xs">Belum ada server. Buat server pertama!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {servers.map((srv) => (
                    <div key={srv.id} className={`pixel-box-inset p-3 flex items-center justify-between gap-3 ${!srv.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${srv.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
                          <span className="text-xs font-bold text-amber-200 truncate">{srv.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border flex-shrink-0 ${srv.mode === 'class' ? 'bg-blue-950/60 text-blue-300 border-blue-800/50' : 'bg-purple-950/60 text-purple-300 border-purple-800/50'}`}>
                            {srv.mode === 'class' ? `Kelas: ${srv.active_class || '-'}` : 'Mode Bebas'}
                          </span>
                          {srv.pin ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border flex-shrink-0 bg-amber-950/70 text-amber-300 border-amber-600/60 flex items-center gap-1" title={`PIN: ${srv.pin}`}>
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              PIN: {srv.pin}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border flex-shrink-0 bg-stone-900/60 text-stone-400 border-stone-700/50 flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5 text-stone-500" />
                              Tanpa PIN
                            </span>
                          )}
                        </div>
                        {srv.description && (
                          <p className="text-[10px] text-amber-400/70 mt-0.5 ml-4 truncate">{srv.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => { setSelectedServerId(srv.id); setActiveTab('groups'); }}
                          className="pixel-btn-wood py-1 px-2 text-[10px] flex items-center gap-0.5"
                          title="Lihat kelompok"
                        >
                          <Users className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEnterRoom('LOBBY1', `Ruang Monitor - ${srv.name}`, srv.id)}
                          className="pixel-btn-gold py-1 px-2 text-[10px]"
                          title="Masuk ke server ini"
                        >
                          Masuk
                        </button>
                        <button onClick={() => openEditServer(srv)} className="pixel-btn-silver py-1 px-1.5 text-[10px]" title="Edit">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleToggleServer(srv)} className="pixel-btn-silver py-1 px-1.5 text-[10px]" title={srv.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {srv.is_active ? <ToggleRight className="w-3 h-3 text-emerald-400" /> : <ToggleLeft className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleDeleteServer(srv)} className="py-1 px-1.5 text-[10px] border border-red-900/60 text-red-400 hover:bg-red-950/40 rounded" title="Hapus">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: GROUPS ── */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Kelompok di Server
                </h2>
                {/* Server selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedServerId || ''}
                    onChange={(e) => setSelectedServerId(e.target.value)}
                    className="pixel-box-inset px-2 py-1 text-xs text-amber-200 bg-[#1f0d03] focus:outline-none"
                  >
                    <option value="">-- Pilih Server --</option>
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => selectedServerId && fetchGroupSessions(selectedServerId).then(setGroupSessions)}
                    className="pixel-btn-silver py-1 px-2 text-[10px] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {!selectedServerId ? (
                <div className="pixel-box-inset p-6 text-center text-amber-500 text-xs">
                  Pilih server untuk melihat kelompok.
                </div>
              ) : loadingGroups ? (
                <div className="text-center text-amber-500 text-xs py-8">Memuat kelompok...</div>
              ) : groupSessions.length === 0 ? (
                <div className="pixel-box-inset p-6 text-center text-amber-500 text-xs">
                  Belum ada kelompok aktif di server ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupSessions.map((session) => {
                    const members = session.group_members || [];
                    const approvedMembers = members.filter((m) => m.status === 'approved');
                    const pendingMembers = members.filter((m) => m.status === 'pending');
                    return (
                      <div key={session.id} className="pixel-box-inset p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-200">Kelompok {session.slot}: {session.room_name}</span>
                              <span className="text-[9px] font-mono text-amber-500 border border-amber-800/40 px-1 rounded">{session.room_code}</span>
                            </div>
                            <p className="text-[10px] text-amber-400/70 mt-0.5">
                              Owner: {session.owner_name || session.owner_id} | {approvedMembers.length}/4 anggota
                              {pendingMembers.length > 0 && (
                                <span className="text-yellow-400 ml-1">({pendingMembers.length} menunggu)</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEnterRoom(session.room_code, session.room_name, selectedServerId)}
                              className="pixel-btn-gold py-1 px-2 text-[10px]"
                            >
                              Masuk
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(session)}
                              className="py-1 px-1.5 text-[10px] border border-red-900/60 text-red-400 hover:bg-red-950/40 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Members list */}
                        {members.length > 0 && (
                          <div className="space-y-1">
                            {members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between bg-[#140802] px-2 py-1 rounded text-[10px]">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'approved' ? 'bg-emerald-400' : m.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                                  <span className="text-amber-200">{m.full_name || m.username}</span>
                                  {m.attendance_no && <span className="text-amber-500 font-mono">#{m.attendance_no}</span>}
                                  <span className={`text-[9px] px-1 rounded font-mono ${m.status === 'approved' ? 'text-emerald-400' : m.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {m.status}
                                  </span>
                                </div>
                                {m.status === 'approved' && (
                                  <button
                                    onClick={() => handleKickMember(session, m)}
                                    className="text-[9px] text-red-400 hover:text-red-300 border border-red-900/50 px-1.5 py-0.5 rounded"
                                  >
                                    Kick
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ─── STEP 3: VIRTUAL ROOM IN ADMIN MODE ──────────────────────────────────
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
        serverId={selectedServerId || (servers[0]?.id || null)}
        onLeave={() => {
          saveAdminSession(roomCode, roomName, 'DASHBOARD', selectedServerId);
          setStep('DASHBOARD');
        }}
      />
    </main>
  );
}
