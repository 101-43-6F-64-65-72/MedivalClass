'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ShieldCheck,
  MonitorPlay,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Tv,
  Lock,
  Unlock,
  Megaphone,
  Send,
  BookOpen,
  Image as ImageIcon,
  Presentation as PresentationIcon
} from 'lucide-react';
import { usePresentation } from '@/hooks/usePresentation';
import { getGameSubmissions } from '@/lib/gameSubmissionsService';

export default function AdminPanel({
  isOpen,
  onClose,
  activeClass = 'XI PPLG-B',
  onSelectClass,
  players = [],
  localPlayerInfo = {},
  spotlightPlayer = null,
  onSetSpotlight,
  presentation: externalPresentation,
  pingMap = {},
  isAdmin = true,
  adminAura = null,
  onOpenAuraModal = null,
}) {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'students' | 'slide' | 'broadcast' | 'classes'
  const [searchQuery, setSearchQuery] = useState('');
  const adminScreenVideoRef = useRef(null);

  const resolvedIsAdmin = Boolean(isAdmin ?? localPlayerInfo?.isAdmin ?? true);

  // Canva Realtime Presentation Sync Hook
  const fallbackPresentation = usePresentation({
    isAdmin: resolvedIsAdmin,
    presenterName: resolvedIsAdmin ? `Admin ${localPlayerInfo?.fullName || localPlayerInfo?.username || ''}`.trim() : (localPlayerInfo?.fullName || localPlayerInfo?.username || 'Admin'),
    enabled: !externalPresentation,
  });

  const presentation = externalPresentation || fallbackPresentation;

  const {
    currentSlide,
    presentationUrl,
    canvaLiveCode,
    changeSlide,
    nextSlide,
    prevSlide,
    changePresentationUrl,
    changeCanvaLiveCode,
    isScreenSharing,
    screenStream,
    screenPresenterName,
    screenShareError,
    startScreenShare,
    stopScreenShare,
    // Forced Fullscreen
    isForcedFullscreen,
    toggleForceFullscreen,
    // Designated Student Presenter
    designatedPresenter,
    assignPresenter,
    revokePresenter,
    // Active Game Submission
    activeGameSubmission,
    setGameSubmission,
    // Broadcast Announcements
    activeAnnouncement,
    sendBroadcastAnnouncement,
    clearAnnouncement,
  } = presentation;

  const [inputUrl, setInputUrl] = useState('');
  const [inputLiveCode, setInputLiveCode] = useState('');
  const [copiedPanelCode, setCopiedPanelCode] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');

  // Bookshelf submissions cache for validation
  const [bookshelfSubmissions, setBookshelfSubmissions] = useState([]);
  const [presenterNotice, setPresenterNotice] = useState(null);

  // Broadcast announcement composer state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastAnimType, setBroadcastAnimType] = useState('banner'); // 'banner' | 'popup'
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [broadcastDuration, setBroadcastDuration] = useState(10);
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Fetch bookshelf submissions whenever modal is open
  useEffect(() => {
    if (isOpen) {
      getGameSubmissions().then((subs) => {
        if (Array.isArray(subs)) {
          setBookshelfSubmissions(subs);
        }
      });
    }
  }, [isOpen]);

  // Helper to match student with submitted game in bookshelf
  const findSubmissionForStudent = (student) => {
    if (!student || !bookshelfSubmissions || bookshelfSubmissions.length === 0) return null;
    const attNo = String(student.attendanceNo || student.no || '').trim();
    const name = (student.fullName || student.name || student.username || '').trim().toLowerCase();
    const room = (student.roomCode || student.onlineData?.roomCode || '').trim().toUpperCase();

    return bookshelfSubmissions.find((sub) => {
      const subAtt = String(sub.attendance_no || '').trim();
      const subName = (sub.student_name || '').trim().toLowerCase();
      const subRoom = (sub.room_code || '').trim().toUpperCase();

      const matchAtt = attNo && subAtt && attNo === subAtt;
      const matchName = name && subName && name === subName;
      const matchRoom = room && room !== 'LOBBY1' && subRoom && room === subRoom;

      return matchAtt || matchName || matchRoom;
    });
  };

  // Handler to designate student presenter after bookshelf check
  const handleAssignStudentPresenter = (student) => {
    const sub = findSubmissionForStudent(student);
    const sName = student.fullName || student.name || student.username || 'Siswa';
    const sRoom = student.roomCode || student.onlineData?.roomCode || 'LOBBY1';

    if (!sub) {
      setPresenterNotice({
        type: 'error',
        message: `Siswa "${sName}" (Kelompok ${sRoom}) belum menyetorkan link game di rak buku! Siswa diwajibkan menyetorkan link di rak buku terlebih dahulu sebelum ditunjuk menjadi presenter.`
      });
      return;
    }

    assignPresenter({
      id: student.onlineData?.id || student.id,
      username: student.name || student.username,
      fullName: student.fullName || student.name || student.username,
      attendanceNo: student.no || student.attendanceNo,
      roomCode: sRoom,
      submission: sub,
    });

    setPresenterNotice({
      type: 'success',
      message: `Berhasil menunjuk ${sName} sebagai presenter! Karya "${sub.platform || 'Game'} - ${sub.game_url}" siap ditampilkan di papan tulis.`
    });
    setTimeout(() => setPresenterNotice(null), 5000);
  };

  const handleRevokeStudentPresenter = () => {
    revokePresenter();
    setPresenterNotice({
      type: 'info',
      message: 'Hak presenter siswa telah dicabut. Kontrol papan tulis kembali ke Pengajar.'
    });
    setTimeout(() => setPresenterNotice(null), 4000);
  };

  // Handler to send broadcast announcement
  const handleSendBroadcast = (e) => {
    e?.preventDefault();
    if (!broadcastText.trim()) return;

    sendBroadcastAnnouncement({
      text: broadcastText.trim(),
      type: broadcastAnimType,
      duration: Number(broadcastDuration) > 0 ? Number(broadcastDuration) : null,
    });

    setBroadcastStatus('Pengumuman siaran berhasil dikirimkan ke layar seluruh siswa!');
    setTimeout(() => setBroadcastStatus(''), 4000);
  };

  // Attach screen stream to admin video element preview
  useEffect(() => {
    if (adminScreenVideoRef.current) {
      adminScreenVideoRef.current.srcObject = screenStream || null;
    }
  }, [screenStream]);

  // Sync inputs with presentation state
  React.useEffect(() => {
    if (presentationUrl) setInputUrl(presentationUrl);
  }, [presentationUrl]);

  React.useEffect(() => {
    if (canvaLiveCode !== undefined) setInputLiveCode(canvaLiveCode || '');
  }, [canvaLiveCode]);

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
                  Panel Admin Kelas
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

          <div className="flex items-center gap-2">
            {onOpenAuraModal && (
              <button
                type="button"
                onClick={onOpenAuraModal}
                className="pixel-btn-wood text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold text-amber-200 hover:text-amber-100"
                title="Kustomisasi Aura Admin (Biasa, Love, Bintang, Warna)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Aura Admin</span>
                {adminAura?.type && adminAura.type !== 'none' && (
                  <span 
                    className="w-2.5 h-2.5 rounded-full inline-block border border-black/40 ml-0.5"
                    style={{ backgroundColor: adminAura.color || '#f59e0b' }}
                  />
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="pixel-btn-gold text-xs px-2.5 py-1 flex items-center gap-1 font-bold"
              title="Tutup Panel Admin"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>
          </div>
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

        {/* Presenter Action Notice Banner (Validation or Success) */}
        {presenterNotice && (
          <div className={`border-b px-4 py-2 flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            presenterNotice.type === 'error'
              ? 'bg-red-950/95 border-red-600/80 text-red-200'
              : presenterNotice.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-600/80 text-emerald-200'
              : 'bg-amber-950/95 border-amber-600/80 text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              {presenterNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : presenterNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold">{presenterNotice.message}</span>
            </div>
            <button
              onClick={() => setPresenterNotice(null)}
              className="pixel-btn-wood text-[10px] px-2 py-0.5 ml-2 font-bold shrink-0"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-2.5 bg-[#1f0d03] border-b border-[#5c3416] overflow-x-auto">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'students'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Siswa {activeClass} ({onlineCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('slide')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'slide'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Papan Tulis &amp; Slide</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Pengumuman</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
                              const sub = findSubmissionForStudent(member);
                              const isCurrentPresenter = designatedPresenter && (
                                designatedPresenter.id === member.id ||
                                (member.attendanceNo && designatedPresenter.attendanceNo === String(member.attendanceNo)) ||
                                (designatedPresenter.username && designatedPresenter.username === (member.username || member.fullName))
                              );

                              return (
                                <div
                                  key={member.id}
                                  className={`flex items-center justify-between p-1.5 rounded transition-all ${
                                    isCurrentPresenter
                                      ? 'bg-amber-950/80 border border-amber-400 ring-1 ring-amber-400'
                                      : isSpotlighted 
                                      ? 'bg-amber-900/60 border border-amber-400 ring-1 ring-amber-400' 
                                      : 'bg-black/40 hover:bg-black/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                    {/* Ping badge */}
                                    {pingMap[member.id] != null && (
                                      <span className={`text-[9px] font-mono font-bold px-1 rounded shrink-0 ${
                                        pingMap[member.id] < 100
                                          ? 'text-emerald-400 bg-emerald-950/60'
                                          : pingMap[member.id] < 300
                                          ? 'text-amber-400 bg-amber-950/60'
                                          : 'text-red-400 bg-red-950/60'
                                      }`}>
                                        {pingMap[member.id]}ms
                                      </span>
                                    )}
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
                                        {isCurrentPresenter && (
                                          <span className="text-[8px] bg-amber-400 text-amber-950 px-1 rounded font-black border border-amber-300 animate-pulse">
                                            Presenter
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] font-mono">
                                        {member.studentClass && (
                                          <span className="text-amber-400/60">
                                            Kelas: {member.studentClass}
                                          </span>
                                        )}
                                        {sub ? (
                                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                            <BookOpen className="w-2.5 h-2.5 text-emerald-400" />
                                            <span>Rak: {sub.platform || 'Siap'}</span>
                                          </span>
                                        ) : (
                                          <span className="text-amber-700/80">
                                            Rak: Belum Setor
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {/* Designate Presenter Button */}
                                    {isCurrentPresenter ? (
                                      <button
                                        onClick={handleRevokeStudentPresenter}
                                        className="pixel-btn-silver text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 text-red-300 hover:text-white"
                                        title="Cabut Akses Presenter Siswa Ini"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Lepas Pres.</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAssignStudentPresenter({
                                          ...member,
                                          roomCode: group.roomCode,
                                        })}
                                        className={`text-[9px] px-2 py-0.5 font-bold flex items-center gap-1 ${
                                          sub 
                                            ? 'pixel-btn-gold text-amber-950 shadow-sm' 
                                            : 'pixel-btn-wood text-amber-400/80 hover:text-amber-200'
                                        }`}
                                        title={sub 
                                          ? `Tunjuk ${member.fullName || member.username} sebagai presenter (${sub.platform || 'Game'} siap)`
                                          : 'Siswa belum menyetor karya di rak buku. Tetap klik untuk memeriksa.'
                                        }
                                      >
                                        <PresentationIcon className="w-3 h-3 text-amber-500" />
                                        <span>Presenter</span>
                                      </button>
                                    )}

                                    {/* Spotlight Button */}
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
                                          : 'pixel-btn-wood text-amber-200'
                                      }`}
                                      title={isSpotlighted ? 'Matikan Sorotan' : 'Sorot Siswa Ini'}
                                    >
                                      {isSpotlighted ? (
                                        <>
                                          <EyeOff className="w-3 h-3" />
                                          <span>Unspot</span>
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3 h-3" />
                                          <span>Spot</span>
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
                      <th className="py-2 px-3 w-24">NIS</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3 w-24 text-center">Status</th>
                      <th className="py-2 px-3 w-24 text-center">Kelompok</th>
                      <th className="py-2 px-3 w-28 text-center">Rak Buku</th>
                      <th className="py-2 px-3 w-36 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d1e08]">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-amber-400/60 text-xs">
                          Tidak ada siswa yang cocok dengan pencarian "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const isSpotlighted = 
                          spotlightPlayer && 
                          (spotlightPlayer.attendanceNo === String(student.no) || 
                           (student.onlineData && spotlightPlayer.id === student.onlineData.id));

                        const sub = findSubmissionForStudent(student);
                        const isCurrentPresenter = designatedPresenter && (
                          (student.onlineData && designatedPresenter.id === student.onlineData.id) ||
                          (designatedPresenter.attendanceNo && designatedPresenter.attendanceNo === String(student.no)) ||
                          (designatedPresenter.username && designatedPresenter.username.toLowerCase() === student.name.toLowerCase())
                        );

                        return (
                          <tr 
                            key={student.nis} 
                            className={`transition-colors ${
                              isCurrentPresenter
                                ? 'bg-amber-950/80 border-l-4 border-amber-400'
                                : isSpotlighted 
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
                              <div className="flex items-center gap-1.5">
                                <span>{student.name}</span>
                                {isCurrentPresenter && (
                                  <span className="text-[8px] bg-amber-400 text-amber-950 px-1 rounded font-black border border-amber-300 animate-pulse">
                                    Presenter
                                  </span>
                                )}
                              </div>
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
                              {sub ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                                  title={`${sub.platform || 'Game'}: ${sub.game_url}`}
                                >
                                  <BookOpen className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>{sub.platform || 'Ada'}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700/70 font-mono">
                                  Belum
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {student.isOnline ? (
                                <div className="flex items-center justify-center gap-1">
                                  {/* Presenter Button */}
                                  {isCurrentPresenter ? (
                                    <button
                                      onClick={handleRevokeStudentPresenter}
                                      className="pixel-btn-silver text-[9px] px-2 py-0.5 font-bold text-red-300 hover:text-white"
                                      title="Cabut Akses Presenter"
                                    >
                                      Lepas
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAssignStudentPresenter(student)}
                                      className={`text-[9px] px-2 py-0.5 font-bold ${
                                        sub ? 'pixel-btn-gold text-amber-950' : 'pixel-btn-wood text-amber-400/80'
                                      }`}
                                      title={sub ? "Tunjuk Siswa Ini sebagai Presenter" : "Siswa belum setor di rak buku"}
                                    >
                                      Pres.
                                    </button>
                                  )}

                                  {/* Spotlight Button */}
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
                                        : 'pixel-btn-wood text-amber-200'
                                    }`}
                                    title={isSpotlighted ? 'Matikan Sorotan' : 'Sorot Siswa Ini'}
                                  >
                                    {isSpotlighted ? 'Unspot' : 'Spot'}
                                  </button>
                                </div>
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

          {/* ========================================================
              TAB 4: KONTROL SLIDE & CANVA LIVE REALTIME
             ======================================================== */}
          {activeTab === 'slide' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-200">Kontrol Slide Canva &amp; Canva Live Realtime</h3>
                  <p className="text-[11px] text-amber-400/70">
                    Kendalikan pergantian slide presentasi dan siarkan ke seluruh layar siswa secara bersamaan.
                  </p>
                </div>
                <div className="pixel-box-inset px-2.5 py-1 text-xs text-amber-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Siaran Supabase Aktif</span>
                </div>
              </div>

              {/* Force Fullscreen / Focus Mode Card */}
              <div className="pixel-box-inset p-4 bg-[#1c0c04] border border-[#5c3416] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {isForcedFullscreen ? (
                      <Lock className="w-4 h-4 text-red-400 animate-pulse" />
                    ) : (
                      <Unlock className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-bold text-amber-200">
                      Mode Paksa Layar Penuh Siswa (Focus &amp; Freeze Control):
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isForcedFullscreen 
                      ? 'bg-red-950/80 text-red-300 border-red-700/80 animate-pulse' 
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  }`}>
                    {isForcedFullscreen ? 'Status: Layar Penuh Siswa Terkunci' : 'Status: Siswa Bebas Bergerak'}
                  </span>
                </div>

                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Bila diaktifkan, seluruh layar siswa akan otomatis dipaksa membuka mode fokus papan tulis/presentasi dan seluruh kontrol pergerakan karakter (WASD/panah) siswa akan dihentikan sementara agar fokus menyimak materi.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleForceFullscreen(!isForcedFullscreen)}
                    className={isForcedFullscreen 
                      ? "pixel-btn-silver text-xs px-4 py-2 font-bold flex items-center gap-2 text-red-300 hover:text-white" 
                      : "pixel-btn-gold text-xs px-4 py-2 font-black flex items-center gap-2 text-amber-950"
                    }
                  >
                    {isForcedFullscreen ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>Lepas Kunci Layar Penuh Siswa (Bebaskan Pergerakan)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Paksa Layar Penuh ke Seluruh Siswa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Designated Student Presenter Card */}
              {designatedPresenter && (
                <div className="pixel-box-inset p-4 bg-[#230f04] border-2 border-amber-500/80 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <PresentationIcon className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-xs font-bold text-amber-100">
                        Siswa Yang Sedang Diberi Akses Presentasi:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRevokeStudentPresenter}
                      className="pixel-btn-silver text-[10px] px-3 py-1 font-bold text-red-300 hover:text-white"
                    >
                      Cabut Akses Presenter
                    </button>
                  </div>

                  <div className="bg-[#120702] p-2.5 rounded border border-[#4a2608] text-xs flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-amber-200 text-sm">
                        {designatedPresenter.fullName || designatedPresenter.username}
                        {designatedPresenter.attendanceNo ? ` (Absen #${designatedPresenter.attendanceNo})` : ''}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        Kelompok: <strong>{designatedPresenter.roomCode}</strong>
                      </div>
                    </div>

                    {designatedPresenter.submission && (
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 justify-end">
                          <BookOpen className="w-3 h-3 text-emerald-400" />
                          <span>Karya di Rak: {designatedPresenter.submission.platform || 'Game'}</span>
                        </div>
                        <a
                          href={designatedPresenter.submission.game_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-amber-300/80 hover:underline font-mono truncate max-w-xs block"
                        >
                          {designatedPresenter.submission.game_url}
                        </a>
                        {designatedPresenter.submission.group_members && (
                          <div className="text-[9.5px] text-amber-400/80 font-mono truncate max-w-xs mt-0.5">
                            Anggota: {designatedPresenter.submission.group_members}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Screen Sharing Card (WebRTC Realtime) */}
              <div className="pixel-box-inset p-4 bg-[#1c0c04] border border-[#5c3416] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">
                      Bagikan Layar ke Papan Tulis (WebRTC Realtime):
                    </span>
                  </div>
                  {isScreenSharing ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Layar Anda Sedang Ditampilkan di Papan Tulis</span>
                    </span>
                  ) : screenPresenterName ? (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      <span>Presenter Aktif: {screenPresenterName}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400/60 font-mono">
                      Belum ada layar yang dibagikan
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Bagikan seluruh layar, jendela browser, atau tab ke papan tulis virtual di tengah kelas. Semua siswa dapat melihat materi presentasi atau coding secara langsung tanpa jeda.
                </p>

                {screenShareError && (
                  <div className="p-2 bg-red-950/60 border border-red-700/60 rounded text-[11px] text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{screenShareError}</span>
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-3 pt-1">
                  {isScreenSharing ? (
                    <button
                      type="button"
                      onClick={stopScreenShare}
                      className="pixel-btn-silver text-xs px-4 py-2 font-bold flex items-center gap-2 text-red-300 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                      <span>Hentikan Bagikan Layar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startScreenShare}
                      className="pixel-btn-gold text-xs px-4 py-2 font-bold flex items-center gap-2 text-amber-950"
                    >
                      <MonitorPlay className="w-4 h-4" />
                      <span>Mulai Bagikan Layar Anda</span>
                    </button>
                  )}

                  <span className="text-[10px] text-amber-400/60">
                    Didukung WebRTC P2P dengan penandaan sinyal Supabase Realtime
                  </span>
                </div>

                {/* Live Preview if active */}
                {screenStream && (
                  <div className="mt-3 pt-3 border-t border-[#4a2608]">
                    <div className="text-[10px] font-mono text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Pratinjau Layar yang Sedang Dibagikan:</span>
                    </div>
                    <div className="w-full h-44 bg-black rounded overflow-hidden border border-amber-800/60 flex items-center justify-center">
                      <video
                        ref={adminScreenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Controller Card */}
              <div className="pixel-box-inset p-4 bg-[#1c0c04] border border-[#5c3416] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-amber-300">Navigasi Slide Realtime:</span>
                  <span className="text-[10px] text-amber-400/70 font-mono">
                    Perubahan slide langsung tersinkron ke semua siswa
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-2 bg-[#120702] rounded border border-[#4a2608]">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide <= 1}
                    className="pixel-btn-wood px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-amber-300" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-2 px-4 py-1.5 bg-[#241105] rounded border border-[#5c3416]">
                    <span className="text-xs text-amber-400 font-mono font-bold">Slide Saat Ini:</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={currentSlide}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          changeSlide(val);
                        }
                      }}
                      className="w-16 bg-slate-900 border border-amber-800 rounded px-2 py-1 text-center text-sm font-mono text-amber-200 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={nextSlide}
                    className="pixel-btn-wood px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </div>

              {/* Presentation Link & Canva Live Code Settings */}
              <div className="pixel-box-inset p-4 bg-[#1c0c04] border border-[#5c3416] space-y-4">
                <h4 className="text-xs font-bold text-amber-200 border-b border-[#5c3416] pb-1.5">
                  Pengaturan Tautan Canva &amp; Kode Live
                </h4>

                <div className="space-y-3">
                  {/* Presets */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pilihan Cepat / Preset Papan Tulis:</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInputUrl('https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed')}
                        className="pixel-box-inset p-2 text-left hover:border-amber-400 transition-colors"
                      >
                        <div className="font-bold text-[11px] text-amber-100">Canva Pembelajaran</div>
                        <div className="text-[9px] text-amber-400/70">Slide Materi Kelas</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUrl('https://excalidraw.com')}
                        className="pixel-box-inset p-2 text-left hover:border-amber-400 transition-colors"
                      >
                        <div className="font-bold text-[11px] text-amber-100">Excalidraw</div>
                        <div className="text-[9px] text-amber-400/70">Papan Corat-coret</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputUrl('https://witeboard.com')}
                        className="pixel-box-inset p-2 text-left hover:border-amber-400 transition-colors"
                      >
                        <div className="font-bold text-[11px] text-amber-100">Witeboard Online</div>
                        <div className="text-[9px] text-amber-400/70">Kolaborasi Instan</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Link Tampilan Papan Tulis (Canva / Slides / Whiteboard / Video):</span>
                    </label>
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://www.canva.com/... atau https://excalidraw.com atau https://docs.google.com/presentation/..."
                      className="w-full bg-[#120702] border border-[#5c3416] rounded px-3 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kode Canva Live (6 Digit):</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={10}
                        value={inputLiveCode}
                        onChange={(e) => setInputLiveCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: 123456"
                        className="w-44 bg-[#120702] border border-[#5c3416] rounded px-3 py-2 text-xs font-mono font-bold tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-400"
                      />
                      {inputLiveCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputLiveCode('');
                            changeCanvaLiveCode('');
                            setSavedStatus('Kode Canva Live berhasil dihapus.');
                            setTimeout(() => setSavedStatus(''), 3000);
                          }}
                          className="pixel-btn-wood px-2 py-1 text-[10px]"
                        >
                          Hapus Kode
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {savedStatus ? (
                      <span className="text-[11px] text-emerald-400 font-bold animate-in fade-in">
                        {savedStatus}
                      </span>
                    ) : (
                      <span></span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (inputUrl.trim()) {
                          changePresentationUrl(inputUrl.trim());
                        }
                        changeCanvaLiveCode(inputLiveCode.trim());
                        setSavedStatus('Berhasil disimpan dan disiarkan ke semua siswa.');
                        setTimeout(() => setSavedStatus(''), 3000);
                      }}
                      className="pixel-btn-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan &amp; Siarkan Perubahan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="pixel-box-inset p-3 bg-[#120702] border border-[#5c3416] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">Pratinjau Presentasi Saat Ini:</span>
                  <a
                    href={presentationUrl.replace(/\?embed.*$/, '').replace(/&embed.*$/, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-btn-wood text-[10px] px-2 py-0.5 flex items-center gap-1 text-amber-300"
                  >
                    <span>Buka Tab Canva</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="w-full h-56 bg-slate-950 rounded overflow-hidden border border-slate-800">
                  <iframe
                    src={presentationUrl}
                    title="Admin Preview Canva"
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: BROADCAST PENGUMUMAN REALTIME KE LAYAR SISWA
             ======================================================== */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <span>Broadcast Pengumuman ke Layar Siswa</span>
                  </h3>
                  <p className="text-[11px] text-amber-400/70">
                    Siarkan pengumuman real-time ke seluruh layar murid dengan pilihan animasi dan gambar.
                  </p>
                </div>
                {broadcastStatus && (
                  <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
                    {broadcastStatus}
                  </span>
                )}
              </div>

              {/* Active Broadcast Announcement Banner / Controller */}
              {activeAnnouncement && (
                <div className="pixel-box-inset p-3.5 bg-[#251004] border-2 border-amber-500/80 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-bold text-amber-200">
                        Pengumuman Sedang Tayang di Layar Siswa:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAnnouncement}
                      className="pixel-btn-silver text-[10px] px-2.5 py-1 font-bold text-red-300 hover:text-white"
                    >
                      Tarik / Hapus Pengumuman
                    </button>
                  </div>

                  <div className="bg-[#120702] p-2.5 rounded border border-[#4a2608] flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-100 break-words">
                        {activeAnnouncement.text}
                      </p>
                      <div className="text-[10px] text-amber-400/70 font-mono mt-0.5">
                        Animasi: {activeAnnouncement.type === 'banner' ? 'Melayang Atas (Kanan ke Kiri)' : 'Pop-up Bounce (Tengah)'} 
                        {activeAnnouncement.duration ? ` | Durasi: ${activeAnnouncement.duration}s` : ' | Tetap Tampil'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Broadcast Composer Form */}
              <form onSubmit={handleSendBroadcast} className="pixel-box-inset p-4 bg-[#1c0c04] border border-[#5c3416] space-y-3.5">
                {/* 1. Message Input */}
                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    Teks Pesan Pengumuman:
                  </label>
                  <textarea
                    rows={3}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Tuliskan instruksi, pengingat waktu tugas, atau pengumuman kelas di sini..."
                    className="w-full bg-[#120702] border border-[#5c3416] rounded p-2.5 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 resize-none"
                    required
                  />
                </div>

                {/* 2. Animation Options (Banner Melayang vs Pop-up Bounce) */}
                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1.5">
                    Pilihan Efek Animasi di Layar Siswa:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastAnimType('banner')}
                      className={`pixel-box-inset p-2.5 text-left flex items-start gap-2.5 transition-all ${
                        broadcastAnimType === 'banner'
                          ? 'border-amber-400 bg-amber-950/70 ring-1 ring-amber-400'
                          : 'hover:border-amber-600/50'
                      }`}
                    >
                      <Radio className={`w-4 h-4 mt-0.5 shrink-0 ${broadcastAnimType === 'banner' ? 'text-amber-400' : 'text-amber-700'}`} />
                      <div>
                        <div className="text-xs font-bold text-amber-100">
                          Melayang di Atas Layar
                        </div>
                        <div className="text-[10px] text-amber-400/70 leading-tight mt-0.5">
                          Teks berjalan perlahan dari kanan ke kiri di bagian paling atas layar seperti running text.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastAnimType('popup')}
                      className={`pixel-box-inset p-2.5 text-left flex items-start gap-2.5 transition-all ${
                        broadcastAnimType === 'popup'
                          ? 'border-amber-400 bg-amber-950/70 ring-1 ring-amber-400'
                          : 'hover:border-amber-600/50'
                      }`}
                    >
                      <Radio className={`w-4 h-4 mt-0.5 shrink-0 ${broadcastAnimType === 'popup' ? 'text-amber-400' : 'text-amber-700'}`} />
                      <div>
                        <div className="text-xs font-bold text-amber-100">
                          Pop-up Bounce di Tengah
                        </div>
                        <div className="text-[10px] text-amber-400/70 leading-tight mt-0.5">
                          Muncul membal (bounce) di bagian tengah layar dengan bingkai kayu dan tombol tutup.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Duration Selector */}
                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    Durasi Tayang di Layar Siswa:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '5 Detik', value: 5 },
                      { label: '10 Detik', value: 10 },
                      { label: '15 Detik', value: 15 },
                      { label: '30 Detik', value: 30 },
                      { label: 'Tetap Tayang', value: 0 },
                    ].map((dur) => {
                      const isSelected = broadcastDuration === dur.value;
                      return (
                        <button
                          key={dur.label}
                          type="button"
                          onClick={() => setBroadcastDuration(dur.value)}
                          className={`text-xs px-2.5 py-1 font-bold rounded transition-all ${
                            isSelected ? 'pixel-btn-gold text-amber-950' : 'pixel-btn-wood text-amber-300'
                          }`}
                        >
                          {dur.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 border-t border-[#4a2608] flex items-center justify-end">
                  <button
                    type="submit"
                    className="pixel-btn-gold px-5 py-2 text-xs font-black text-amber-950 flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Siarkan Pengumuman Sekarang</span>
                  </button>
                </div>
              </form>
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
