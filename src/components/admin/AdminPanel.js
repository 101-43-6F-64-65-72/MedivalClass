'use client';

import React, { useState, useMemo } from 'react';
import { 
  AVAILABLE_CLASSES, 
  getStudentsByClass 
} from '@/lib/studentsData';
import { 
  Users, 
  Sparkles, 
  Search, 
  X, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Sliders,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function AdminPanel({
  isOpen,
  onClose,
  activeClass = 'XI PPLG-B',
  onSelectClass,
  players = [],
  localPlayerInfo = {},
  spotlightPlayer = null,
  onSetSpotlight,
}) {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'students' | 'classes'
  const [searchQuery, setSearchQuery] = useState('');

  // Combine local player (if in room) and remote players to form total universe players
  const allOnlinePlayers = useMemo(() => {
    const list = [...players];
    if (localPlayerInfo && localPlayerInfo.id) {
      const exists = list.some((p) => p.id === localPlayerInfo.id);
      if (!exists) {
        list.push({
          id: localPlayerInfo.id,
          username: localPlayerInfo.username,
          fullName: localPlayerInfo.fullName,
          attendanceNo: localPlayerInfo.attendanceNo,
          studentClass: localPlayerInfo.studentClass || activeClass,
          roomCode: localPlayerInfo.roomCode,
          roomName: localPlayerInfo.roomName,
          characterIndex: localPlayerInfo.characterIndex || 1,
          isAdmin: !!localPlayerInfo.isAdmin,
        });
      }
    }
    return list;
  }, [players, localPlayerInfo, activeClass]);

  // Aggregate active groups & their members
  const activeGroups = useMemo(() => {
    const groupsMap = new Map();
    allOnlinePlayers.forEach((p) => {
      const code = (p.roomCode || 'LOBBY1').trim().toUpperCase();
      if (!groupsMap.has(code)) {
        groupsMap.set(code, {
          roomCode: code,
          roomName: p.roomName || `Kelompok ${code}`,
          members: [],
        });
      }
      groupsMap.get(code).members.push(p);
    });
    return Array.from(groupsMap.values());
  }, [allOnlinePlayers]);

  // Get master student list for the currently active class only
  const classStudents = useMemo(() => {
    return getStudentsByClass(activeClass);
  }, [activeClass]);

  // Match online status for students in the active class
  const studentRosterWithStatus = useMemo(() => {
    return classStudents.map((student) => {
      const onlineMatch = allOnlinePlayers.find((p) => {
        // Match by attendance number or full name
        const matchNo = p.attendanceNo && String(p.attendanceNo).trim() === String(student.no);
        const matchName = p.fullName && p.fullName.trim().toLowerCase() === student.name.trim().toLowerCase();
        return matchNo || matchName;
      });

      return {
        ...student,
        isOnline: Boolean(onlineMatch),
        onlineData: onlineMatch || null,
      };
    });
  }, [classStudents, allOnlinePlayers]);

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentRosterWithStatus;
    const q = searchQuery.trim().toLowerCase();
    return studentRosterWithStatus.filter(
      (s) => s.name.toLowerCase().includes(q) || String(s.nis).includes(q) || String(s.no).includes(q)
    );
  }, [studentRosterWithStatus, searchQuery]);

  const onlineCount = studentRosterWithStatus.filter((s) => s.isOnline).length;
  const totalCount = studentRosterWithStatus.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 select-none">
      <div className="max-w-4xl w-full h-[88vh] pixel-panel-wood flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-4 py-3 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/fantasy_pixelart_ui/icons/gold_star.png" 
              alt="Admin" 
              className="w-5 h-5 image-rendering-pixelated" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide">
                  Panel Guru / Admin Kelas
                </h2>
                <span className="pixel-btn-gold text-[10px] px-2 py-0.5 font-bold font-mono">
                  {activeClass}
                </span>
              </div>
              <p className="text-[10px] text-amber-400/80">
                Kelola kelompok aktif, pantau presensi siswa, spotlight, dan ganti kelas aktif.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="pixel-btn-gold text-xs px-2.5 py-1 flex items-center gap-1 font-bold"
            title="Tutup Panel Admin"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Spotlight Status Notification Banner (if any) */}
        {spotlightPlayer && (
          <div className="bg-amber-950/90 border-b border-amber-600/70 px-4 py-2 flex items-center justify-between text-xs text-amber-200 animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Spotlight Aktif:</strong> {spotlightPlayer.username || spotlightPlayer.fullName} 
                {spotlightPlayer.attendanceNo ? ` (Absen #${spotlightPlayer.attendanceNo})` : ''} 
                di Kelompok <strong className="font-mono text-amber-300">{spotlightPlayer.roomCode}</strong>
              </span>
            </div>
            <button
              onClick={() => onSetSpotlight(null)}
              className="pixel-btn-wood text-[10px] px-2 py-0.5 text-amber-300 font-bold hover:text-white"
            >
              Matikan Spotlight
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-2.5 bg-[#1f0d03] border-b border-[#5c3416]">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all ${
              activeTab === 'groups'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kelompok Aktif ({activeGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all ${
              activeTab === 'students'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Siswa {activeClass} ({onlineCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all ${
              activeTab === 'classes'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pilih Kelas Aktif</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#140802]">
          
          {/* ========================================================
              TAB 1: KELOMPOK AKTIF & ANGGOTANYA
             ======================================================== */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-200">Daftar Kelompok yang Sedang Aktif</h3>
                  <p className="text-[11px] text-amber-400/70">
                    Siswa terbagi dalam beberapa room kode kelompok di dalam kelas virtual.
                  </p>
                </div>
                <div className="pixel-box-inset px-2.5 py-1 text-xs text-amber-300 font-mono">
                  {allOnlinePlayers.length} Siswa Terhubung
                </div>
              </div>

              {activeGroups.length === 0 ? (
                <div className="pixel-box-inset p-8 text-center text-amber-400/60 text-xs">
                  Belum ada kelompok atau siswa yang terhubung ke kelas saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeGroups.map((group) => {
                    return (
                      <div key={group.roomCode} className="pixel-box-inset p-3.5 flex flex-col justify-between">
                        <div>
                          {/* Group Header */}
                          <div className="flex items-center justify-between border-b border-[#5c3416] pb-2 mb-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" 
                                alt="Flag" 
                                className="w-4 h-4 image-rendering-pixelated shrink-0" 
                              />
                              <div className="truncate">
                                <h4 className="text-xs font-bold text-amber-200 truncate">
                                  {group.roomName}
                                </h4>
                                <span className="text-[10px] font-mono text-amber-400/80">
                                  Kode Team: <strong className="text-amber-300 font-bold">{group.roomCode}</strong>
                                </span>
                              </div>
                            </div>
                            <span className="pixel-btn-wood text-[10px] px-2 py-0.5 font-bold font-mono shrink-0">
                              {group.members.length} Anggota
                            </span>
                          </div>

                          {/* Member List */}
                          <div className="space-y-1.5">
                            {group.members.map((member) => {
                              const isSpotlighted = spotlightPlayer && (spotlightPlayer.id === member.id);
                              return (
                                <div
                                  key={member.id}
                                  className={`flex items-center justify-between p-1.5 rounded transition-all ${
                                    isSpotlighted 
                                      ? 'bg-amber-900/60 border border-amber-400 ring-1 ring-amber-400' 
                                      : 'bg-black/40 hover:bg-black/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                    <span className="text-[10px] font-mono text-amber-300 font-bold shrink-0">
                                      #{member.attendanceNo || '-'}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-xs font-bold text-slate-100 truncate">
                                          {member.fullName || member.username || 'Siswa'}
                                        </span>
                                        {member.username && member.fullName && member.username !== member.fullName && (
                                          <span className="text-[10px] text-amber-400/70 font-mono">
                                            (@{member.username})
                                          </span>
                                        )}
                                        {member.isAdmin && (
                                          <span className="text-[8px] bg-amber-950 text-amber-400 px-1 rounded font-bold border border-amber-800">
                                            Admin
                                          </span>
                                        )}
                                      </div>
                                      {member.studentClass && (
                                        <span className="text-[9px] text-amber-400/60 font-mono">
                                          Kelas: {member.studentClass}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      onClick={() => {
                                        if (isSpotlighted) {
                                          onSetSpotlight(null);
                                        } else {
                                          onSetSpotlight({
                                            id: member.id,
                                            username: member.username,
                                            fullName: member.fullName,
                                            attendanceNo: member.attendanceNo,
                                            roomCode: group.roomCode,
                                          });
                                        }
                                      }}
                                      className={`text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 ${
                                        isSpotlighted 
                                          ? 'pixel-btn-wood text-amber-300' 
                                          : 'pixel-btn-gold text-amber-950'
                                      }`}
                                      title={isSpotlighted ? 'Matikan Sorotan' : 'Sorot Siswa Ini'}
                                    >
                                      {isSpotlighted ? (
                                        <>
                                          <EyeOff className="w-3 h-3" />
                                          <span>Unspotlight</span>
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3 h-3" />
                                          <span>Spotlight</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 2: DATA SISWA KELAS AKTIF & PRESENSI
             ======================================================== */}
          {activeTab === 'students' && (
            <div className="space-y-3.5">
              {/* Header stats & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="pixel-box-inset px-2.5 py-1 text-xs">
                    <span className="text-amber-400/80">Kelas: </span>
                    <strong className="text-amber-200">{activeClass}</strong>
                  </div>
                  <div className="pixel-box-inset px-2.5 py-1 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-amber-200 font-bold">{onlineCount} Hadir</span>
                    <span className="text-amber-500">•</span>
                    <span className="text-amber-400/70">{totalCount - onlineCount} Belum Masuk</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-amber-400/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / NIS / no absen..."
                    className="w-full pixel-box-inset pl-8 pr-3 py-1.5 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Student Table */}
              <div className="pixel-box-inset overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#241004] border-b border-[#5c3416] text-[10px] text-amber-300 uppercase tracking-wider">
                      <th className="py-2 px-3 text-center w-12">No</th>
                      <th className="py-2 px-3 w-28">NIS</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3 w-28 text-center">Status</th>
                      <th className="py-2 px-3 w-28 text-center">Kelompok</th>
                      <th className="py-2 px-3 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d1e08]">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-amber-400/60 text-xs">
                          Tidak ada siswa yang cocok dengan pencarian "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const isSpotlighted = 
                          spotlightPlayer && 
                          (spotlightPlayer.attendanceNo === String(student.no) || 
                           (student.onlineData && spotlightPlayer.id === student.onlineData.id));

                        return (
                          <tr 
                            key={student.nis} 
                            className={`transition-colors ${
                              isSpotlighted 
                                ? 'bg-amber-950/70 border-l-4 border-amber-400' 
                                : student.isOnline 
                                ? 'bg-emerald-950/20 hover:bg-amber-950/30' 
                                : 'hover:bg-amber-950/20'
                            }`}
                          >
                            <td className="py-2 px-3 text-center font-mono font-bold text-amber-300">
                              {student.no}
                            </td>
                            <td className="py-2 px-3 font-mono text-amber-400/80 text-[11px]">
                              {student.nis}
                            </td>
                            <td className="py-2 px-3 font-bold text-amber-100">
                              {student.name}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {student.isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>Hadir</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] text-slate-400 bg-slate-900 border border-slate-700/50">
                                  <span>Offline</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[11px]">
                              {student.isOnline && student.onlineData?.roomCode ? (
                                <span className="font-bold text-amber-300">
                                  {student.onlineData.roomCode}
                                </span>
                              ) : (
                                <span className="text-amber-700/60">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {student.isOnline ? (
                                <button
                                  onClick={() => {
                                    if (isSpotlighted) {
                                      onSetSpotlight(null);
                                    } else {
                                      onSetSpotlight({
                                        id: student.onlineData?.id,
                                        username: student.name,
                                        fullName: student.name,
                                        attendanceNo: String(student.no),
                                        roomCode: student.onlineData?.roomCode || 'LOBBY1',
                                      });
                                    }
                                  }}
                                  className={`text-[9px] px-2 py-0.5 font-bold ${
                                    isSpotlighted 
                                      ? 'pixel-btn-wood text-amber-300' 
                                      : 'pixel-btn-gold text-amber-950'
                                  }`}
                                >
                                  {isSpotlighted ? 'Unspotlight' : 'Spotlight'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-800/50">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: PILIH KELAS AKTIF
             ======================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-amber-200">Pengaturan Kelas Aktif</h3>
                <p className="text-[11px] text-amber-400/70">
                  Pilih kelas yang sedang Anda ampu saat ini. Seluruh tampilan data presensi siswa dan formulir pendaftaran akan langsung menyesuaikan ke kelas yang dipilih.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_CLASSES.map((cls) => {
                  const isSelected = activeClass === cls;
                  const count = getStudentsByClass(cls).length;

                  return (
                    <button
                      key={cls}
                      onClick={() => {
                        onSelectClass(cls);
                      }}
                      className={`pixel-box-inset p-3.5 text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-950/60 ring-1 ring-amber-400' 
                          : 'hover:border-amber-600/60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                          <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-amber-700'}`} />
                          <span>{cls}</span>
                        </div>
                        <div className="text-[10px] text-amber-400/70 font-mono mt-0.5">
                          {count} Siswa Terdaftar
                        </div>
                      </div>

                      {isSelected && (
                        <span className="pixel-btn-gold text-[9px] px-2 py-0.5 font-bold">
                          Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pixel-box-inset p-3 bg-amber-950/30 text-[11px] text-amber-200/80 space-y-1">
                <div className="font-bold text-amber-300">Catatan Penting:</div>
                <p>
                  Mengubah kelas aktif (misal dari <strong>XI PPLG-A</strong> ke <strong>XI PPLG-B</strong>) akan menyiarkan informasi kelas baru secara real-time ke semua peserta, sehingga hanya data siswa kelas tersebut yang akan tampil di absensi dan panel admin.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#1f0d03] border-t border-[#5c3416] flex items-center justify-between text-xs text-amber-300/70">
          <span>Mode Pengajar / Instruktur Virtual</span>
          <span className="font-mono text-[10px] text-amber-400">
            Kelas Aktif: <strong className="text-amber-200">{activeClass}</strong>
          </span>
        </div>

      </div>
    </div>
  );
}
