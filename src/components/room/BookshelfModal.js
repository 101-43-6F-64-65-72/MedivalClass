'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  BookOpen, 
  Gamepad2, 
  Sparkles, 
  Plus, 
  Layers, 
  Users, 
  Calendar,
  Server,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { GAME_CATEGORIES, classifyGameUrl } from '@/lib/gameClassifier';
import { getGameSubmissions } from '@/lib/gameSubmissionsService';
import { fetchAllServers } from '@/lib/serverService';
import { playCloseSound, playChoiceClick, playSuccessChime, playDialogueOpen } from '@/lib/soundEffects';

// Helper to extract numeric group number from room_code or room_name
function extractGroupNumber(item) {
  if (!item) return 999;
  const str = `${item.room_code || ''} ${item.room_name || ''}`;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

// Fantasy leather book cover palettes based on group number
const BOOK_COVER_PALETTES = [
  { bg: 'from-[#541212] via-[#360909] to-[#1c0404]', border: 'border-red-600/80', ribbon: 'bg-amber-400', accent: 'text-red-300' }, // Kel 1 (Crimson)
  { bg: 'from-[#0e2c66] via-[#081b40] to-[#040e21]', border: 'border-blue-500/80', ribbon: 'bg-sky-400', accent: 'text-blue-300' }, // Kel 2 (Sapphire)
  { bg: 'from-[#0d4528] via-[#072b19] to-[#03170d]', border: 'border-emerald-600/80', ribbon: 'bg-amber-300', accent: 'text-emerald-300' }, // Kel 3 (Emerald)
  { bg: 'from-[#4a1266] via-[#2d0940] to-[#170421]', border: 'border-purple-600/80', ribbon: 'bg-pink-400', accent: 'text-purple-300' }, // Kel 4 (Amethyst)
  { bg: 'from-[#633a08] via-[#3d2304] to-[#211202]', border: 'border-amber-600/80', ribbon: 'bg-amber-300', accent: 'text-amber-300' }, // Kel 5 (Bronze)
  { bg: 'from-[#0c4d52] via-[#063136] to-[#03191c]', border: 'border-teal-600/80', ribbon: 'bg-teal-300', accent: 'text-teal-300' }, // Kel 6 (Teal)
  { bg: 'from-[#2b2b2b] via-[#1a1a1a] to-[#0d0d0d]', border: 'border-zinc-500/80', ribbon: 'bg-red-500', accent: 'text-zinc-300' }, // Kel 7 (Obsidian)
  { bg: 'from-[#542407] via-[#331503] to-[#1a0a01]', border: 'border-amber-500/90', ribbon: 'bg-yellow-400', accent: 'text-yellow-300' }, // Kel 8 (Ancient Gold)
];

function getBookPalette(groupNum) {
  if (!groupNum || groupNum === 999) return BOOK_COVER_PALETTES[7];
  const idx = (groupNum - 1) % BOOK_COVER_PALETTES.length;
  return BOOK_COVER_PALETTES[idx >= 0 ? idx : 0];
}

export default function BookshelfModal({
  isOpen,
  onClose,
  targetClass = 'XI PPLG-B',
  shelfMeta = null,
  onOpenSubmit,
  isAdmin = false,
  bookshelfConfig = null,
  onUpdateBookshelfConfig = null,
}) {
  const [servers, setServers] = useState([]);
  const [activeTabClass, setActiveTabClass] = useState(targetClass || 'XI PPLG-B');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('group_asc'); // 'group_asc' | 'title_asc' | 'newest'
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  // Open Book View State: null when viewing shelf; object when viewing open book with preview
  const [openedBook, setOpenedBook] = useState(null);
  const [iframeKey, setIframeKey] = useState(1);
  const [useProxy, setUseProxy] = useState(true);

  // Fetch servers list once on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    fetchAllServers().then((data) => {
      if (isMounted && Array.isArray(data)) {
        setServers(data);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync active tab with targetClass when opened, and reset opened book to shelf
  useEffect(() => {
    if (isOpen) {
      setActiveTabClass(targetClass || 'XI PPLG-B');
      setOpenedBook(null);
    }
  }, [isOpen, targetClass]);

  // Load submissions whenever modal is open or activeTabClass changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const filterClass = activeTabClass === 'ALL' ? null : activeTabClass;

    getGameSubmissions(filterClass)
      .then((data) => {
        if (isMounted) {
          setSubmissions(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTabClass]);

  // Construct dynamic server tabs (styled like books standing on the top shelf)
  const serverTabs = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    if (servers && servers.length > 0) {
      servers.forEach((srv) => {
        const key = srv.active_class || srv.name;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            key,
            label: srv.name || key,
            badge: srv.active_class || 'Server',
            isServer: true,
          });
        }
      });
    }

    if (!seenKeys.has('XI PPLG-B')) {
      seenKeys.add('XI PPLG-B');
      list.push({
        key: 'XI PPLG-B',
        label: 'Server XI PPLG B',
        badge: 'XI PPLG-B',
        isServer: true,
      });
    }
    if (!seenKeys.has('XI PPLG-A')) {
      seenKeys.add('XI PPLG-A');
      list.push({
        key: 'XI PPLG-A',
        label: 'Server XI PPLG A',
        badge: 'XI PPLG-A',
        isServer: true,
      });
    }

    list.push({
      key: 'ALL',
      label: 'Semua Server',
      badge: 'Semua',
      isServer: false,
    });

    return list;
  }, [servers]);

  const currentTabObj = useMemo(() => {
    return serverTabs.find((t) => t.key === activeTabClass) || {
      key: activeTabClass,
      label: activeTabClass,
      badge: activeTabClass,
    };
  }, [serverTabs, activeTabClass]);

  // Available groups for filter chips
  const availableGroups = useMemo(() => {
    const set = new Set();
    submissions.forEach((item) => {
      const g = extractGroupNumber(item);
      if (g && g !== 999) set.add(g);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [submissions]);

  // Filter and sort submissions
  const processedSubmissions = useMemo(() => {
    let result = submissions.filter((item) => {
      const matchCategory = 
        selectedCategory === 'Semua Kategori' || item.category === selectedCategory;
      
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = 
        !q ||
        (item.student_name && item.student_name.toLowerCase().includes(q)) ||
        (item.room_name && item.room_name.toLowerCase().includes(q)) ||
        (item.group_members && item.group_members.toLowerCase().includes(q)) ||
        (item.platform && item.platform.toLowerCase().includes(q)) ||
        (item.game_url && item.game_url.toLowerCase().includes(q));

      const grpNum = extractGroupNumber(item);
      const matchGroup = 
        selectedGroupFilter === 'ALL' || String(grpNum) === String(selectedGroupFilter);

      return matchCategory && matchQuery && matchGroup;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'group_asc') {
        const numA = extractGroupNumber(a);
        const numB = extractGroupNumber(b);
        if (numA !== numB) return numA - numB;
        return (a.room_name || '').localeCompare(b.room_name || '');
      }
      if (sortBy === 'title_asc') {
        const titleA = a.room_name || a.student_name || '';
        const titleB = b.room_name || b.student_name || '';
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

    return result;
  }, [submissions, selectedCategory, searchQuery, selectedGroupFilter, sortBy]);

  if (!isOpen) return null;

  const handleCopy = (id, url) => {
    navigator.clipboard?.writeText(url);
    playSuccessChime();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenBook = (sub) => {
    playDialogueOpen();
    setOpenedBook(sub);
    setIframeKey(Date.now());
  };

  const handleCloseBook = () => {
    playChoiceClick();
    setOpenedBook(null);
  };

  const handleCloseModal = () => {
    playCloseSound();
    setOpenedBook(null);
    onClose();
  };

  const handleQuickAssignShelf = (shelfNum) => {
    if (!onUpdateBookshelfConfig) return;
    playSuccessChime();
    const shelfId = shelfNum <= 3 ? `shelf-w${shelfNum}` : `shelf-e${shelfNum - 3}`;
    const targetLabel = activeTabClass === 'ALL' ? 'Semua Server' : currentTabObj.label;

    const currentShelves = bookshelfConfig?.shelves || {};
    const updatedShelves = {
      ...currentShelves,
      [shelfId]: {
        ...(currentShelves[shelfId] || {}),
        id: shelfId,
        num: shelfNum,
        targetClass: activeTabClass,
        label: targetLabel,
      }
    };

    onUpdateBookshelfConfig({
      shelves: updatedShelves,
      westClass: updatedShelves['shelf-w1']?.targetClass || 'XI PPLG-A',
      westLabel: updatedShelves['shelf-w1']?.label || 'Server XI PPLG A',
      eastClass: updatedShelves['shelf-e1']?.targetClass || 'XI PPLG-B',
      eastLabel: updatedShelves['shelf-e1']?.label || 'Server XI PPLG B',
    });

    setAdminFeedback(`Rak ${shelfNum} diarahkan ke tab ini`);
    setTimeout(() => setAdminFeedback(''), 3000);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 bg-black/80 animate-in fade-in duration-200 font-pixel">
      <div 
        className="w-full max-w-5xl h-[90vh] max-h-[90vh] flex flex-col pixel-panel-wood p-3 sm:p-5 text-amber-100 border-2 border-amber-600/80 relative overflow-hidden font-pixel pixel-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            HEADER MODAL PERPUSTAKAAN
           ======================================================== */}
        <div className="flex items-center justify-between border-b border-[#5c3416] pb-2.5 mb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-[#1c0c04] border border-amber-600/70 p-1 shrink-0 flex items-center justify-center shadow">
              <img
                src="/assets/stardew_bookshelf.svg"
                alt="Bookshelf"
                className="w-full h-full object-contain image-pixelated"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-base font-black text-amber-200 uppercase tracking-wide">
                  Perpustakaan Karya Game: {currentTabObj.label}
                </h2>
                {shelfMeta && (
                  <span className="pixel-btn-gold text-[9px] px-1.5 py-0.2 font-mono font-bold text-amber-950">
                    Rak {shelfMeta.num}
                  </span>
                )}
                <span className="pixel-box-inset px-2 py-0.2 text-[9px] font-mono text-amber-400 font-bold">
                  {processedSubmissions.length} Buku Game
                </span>
              </div>
              <p className="text-[10px] text-amber-400/80">
                Arahkan kursor ke buku untuk mengambil dan klik buku untuk membuka layar preview game.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {openedBook && (
              <button
                onClick={handleCloseBook}
                className="pixel-btn-wood text-xs px-2.5 py-1 font-bold flex items-center gap-1 text-amber-200 hover:text-white"
                title="Kembali ke Rak Buku"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kembali ke Rak</span>
              </button>
            )}
            {onOpenSubmit && (
              <button
                onClick={() => {
                  playChoiceClick();
                  onOpenSubmit();
                }}
                className="pixel-btn-gold text-xs px-3 py-1 font-bold flex items-center gap-1.5 text-amber-950"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Setor Karya Game</span>
                <span className="sm:hidden">Setor</span>
              </button>
            )}
            <button
              onClick={handleCloseModal}
              className="pixel-btn-gold p-1 text-amber-950 font-bold"
              title="Tutup Perpustakaan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB SERVER BERKONSEP BUKU DI RAK ATAS (STANDING BOOK SPINES)
           ======================================================== */}
        {!openedBook && (
          <div className="space-y-2 mb-2 shrink-0">
            {/* Wooden Shelf Top Bar with Standing Book Tabs */}
            <div className="bg-[#120702] border border-[#5c3416] p-2 rounded relative">
              <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-amber-500" />
                  <span>Pilih Buku Server (Tab Kelas):</span>
                </span>

                {isAdmin && (
                  <span className="text-[9px] text-amber-400/70 font-mono">
                    Mode Admin: Kunci tab server ke Rak 1-6
                  </span>
                )}
              </div>

              {/* Book Spine Tabs sitting on wooden plank */}
              <div className="flex items-end gap-1.5 overflow-x-auto pb-1 scrollbar-thin px-1">
                {serverTabs.map((tab, idx) => {
                  const isSelected = activeTabClass === tab.key;
                  const palette = BOOK_COVER_PALETTES[idx % BOOK_COVER_PALETTES.length];

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        playChoiceClick();
                        setActiveTabClass(tab.key);
                      }}
                      className={`group relative text-left transition-all duration-200 rounded-t shrink-0 flex flex-col justify-between p-2 border-t-2 border-x-2 ${
                        isSelected
                          ? `bg-gradient-to-b ${palette.bg} border-amber-300 -translate-y-1 pixel-shadow-sm w-32 sm:w-36 min-h-[58px]`
                          : `bg-[#241105] hover:bg-[#381a07] border-[#5c3416] hover:-translate-y-0.5 opacity-80 hover:opacity-100 w-28 sm:w-32 min-h-[52px]`
                      }`}
                    >
                      {/* Top bookmark ribbon tab */}
                      <span className={`absolute top-0 right-2 w-2 h-3.5 ${palette.ribbon} shadow-sm rounded-b`} />

                      {/* Spine Ribs */}
                      <div className="w-full h-0.5 bg-amber-500/40 mb-1" />

                      <div className="text-[11px] font-black truncate text-amber-100 group-hover:text-amber-200">
                        {tab.label}
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-amber-400/80 mt-1">
                        <span className="truncate">{tab.badge}</span>
                        {isSelected && (
                          <span className="text-[8px] bg-amber-400 text-amber-950 font-black px-1 rounded">
                            Buka
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Wooden Shelf Edge Base */}
              <div className="w-full h-2 bg-gradient-to-b from-[#42220b] to-[#2b1406] border-t-2 border-amber-600/70 shadow-inner rounded-b" />
            </div>

            {/* Admin Quick Shelf Mapper Bar (Rak 1 s/d 6) */}
            {isAdmin && onUpdateBookshelfConfig && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#1b0a02] border border-amber-600/50 rounded text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-amber-300 text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Kunci tab <strong className="text-amber-100">{currentTabObj.label}</strong> ke rak:</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const shelfId = num <= 3 ? `shelf-w${num}` : `shelf-e${num - 3}`;
                    const isMapped = bookshelfConfig?.shelves?.[shelfId]?.targetClass === activeTabClass;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickAssignShelf(num)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono transition-all border ${
                          isMapped
                            ? 'bg-amber-400 text-amber-950 border-amber-200 font-black scale-105'
                            : 'pixel-btn-wood text-amber-300 hover:text-white'
                        }`}
                        title={`Arahkan Rak ${num} (${num <= 3 ? 'Barat' : 'Timur'}) ke tab server ini`}
                      >
                        Rak {num} {isMapped ? '(*)' : ''}
                      </button>
                    );
                  })}
                  {adminFeedback && (
                    <span className="text-[10px] text-emerald-400 font-bold ml-1 animate-in fade-in">
                      {adminFeedback}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Filter, Search & Group Sorting Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#120702] border border-[#5c3416] p-2 rounded">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari buku game, nama kelompok, atau platform..."
                  className="w-full bg-[#1c0c04] border border-[#5c3416] focus:border-amber-400 rounded pl-8 pr-3 py-1 text-xs text-amber-100 placeholder-amber-800 focus:outline-none font-mono"
                />
              </div>

              {/* Sort By Kelompok Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span className="hidden sm:inline">Urutkan:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1c0c04] border border-[#5c3416] focus:border-amber-400 text-[10px] text-amber-200 rounded px-2 py-1 font-bold focus:outline-none"
                >
                  <option value="group_asc">Urut Kelompok (1 s/d 8)</option>
                  <option value="title_asc">Nama Game (A - Z)</option>
                  <option value="newest">Waktu Setor Terbaru</option>
                </select>
              </div>

              {/* Group Chips Filter */}
              {availableGroups.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupFilter('ALL')}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${
                      selectedGroupFilter === 'ALL'
                        ? 'pixel-btn-gold text-amber-950 font-black'
                        : 'pixel-btn-wood text-amber-300'
                    }`}
                  >
                    Semua Kel.
                  </button>
                  {availableGroups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroupFilter(String(g))}
                      className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all ${
                        String(selectedGroupFilter) === String(g)
                          ? 'pixel-btn-gold text-amber-950 font-black'
                          : 'pixel-btn-wood text-amber-300'
                      }`}
                    >
                      Kel. {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAMPILAN 1: RAK BUKU (GRID BUKU DENGAN HOVER MENGANGKAT)
           ======================================================== */}
        {!openedBook && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pixel-scrollbar">
            {loading ? (
              <div className="py-16 text-center text-xs text-amber-400 font-mono animate-pulse">
                Menyusun deretan buku game di rak perpustakaan...
              </div>
            ) : processedSubmissions.length === 0 ? (
              <div className="py-16 text-center space-y-3 pixel-box-inset p-6 bg-[#140802]">
                <Gamepad2 className="w-10 h-10 text-amber-600/70 mx-auto" />
                <div className="text-xs font-bold text-amber-300">
                  {searchQuery || selectedGroupFilter !== 'ALL'
                    ? 'Tidak ada buku game yang cocok dengan filter atau kata kunci pencarian.'
                    : `Belum ada buku karya game di ${currentTabObj.label}.`}
                </div>
                <p className="text-[11px] text-amber-400/70 max-w-sm mx-auto">
                  Setorkan link game kelompokmu melalui tombol di atas atau bicara dengan Qeebos / Sam!
                </p>
              </div>
            ) : (
              /* Wooden Bookshelf Layout with Books sitting on Plank */
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pt-4">
                  {processedSubmissions.map((sub, index) => {
                    const groupNum = extractGroupNumber(sub);
                    const palette = getBookPalette(groupNum);
                    const classification = classifyGameUrl(sub.game_url);
                    const gameTitle = sub.room_name || sub.student_name || 'Game Karya Siswa';

                    return (
                      <div
                        key={sub.id || sub.game_url}
                        onClick={() => handleOpenBook(sub)}
                        className="group relative cursor-pointer flex flex-col justify-end"
                        title={`Buka Buku: ${gameTitle} (Klik untuk membaca & memainkan game)`}
                      >
                        {/* Hover Popup Tooltip: [Buka Buku] */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 whitespace-nowrap">
                          <span className="pixel-panel-gold text-[9px] font-black text-amber-950 px-2 py-0.5 shadow-lg border border-amber-900">
                            Buka Buku
                          </span>
                        </div>

                        {/* HARDCOVER FANTASY BOOK (Lifts up on hover like taking a book from shelf, zero glow) */}
                        <div 
                          className={`relative w-full min-h-[175px] sm:min-h-[195px] rounded-t-sm rounded-br-sm border-2 ${palette.border} bg-gradient-to-br ${palette.bg} pixel-shadow-sm p-3 flex flex-col justify-between overflow-hidden transition-all duration-200 ease-out transform group-hover:-translate-y-3 group-hover:scale-[1.02] group-hover:shadow-[4px_6px_0px_#000000]`}
                        >
                          {/* Book spine crease line on left side */}
                          <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

                          {/* Hanging Silk Bookmark Ribbon */}
                          <div className={`absolute top-0 right-3 w-3 h-7 ${palette.ribbon} shadow-md z-10`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }} />

                          {/* Gold filigree decorative frame corners */}
                          <div className="absolute top-1 left-3 text-[10px] text-amber-400/50 select-none">+</div>
                          <div className="absolute bottom-1 right-1 text-[10px] text-amber-400/50 select-none">+</div>

                          {/* Top: Group Badge & Server Tag */}
                          <div className="pl-2 space-y-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[8px] font-black px-1.5 py-0.2 rounded font-mono bg-amber-950/80 text-amber-300 border border-amber-600/60 uppercase">
                                {sub.room_code || (groupNum !== 999 ? `KEL ${groupNum}` : 'KARYA')}
                              </span>
                            </div>
                          </div>

                          {/* Center: Book Cover Title Embossing */}
                          <div className="pl-2 py-2 text-center space-y-1">
                            <div className="w-8 h-8 rounded-full border border-amber-500/60 bg-black/40 mx-auto flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                              <Gamepad2 className="w-4 h-4 text-amber-300" />
                            </div>
                            <h3 className="text-xs sm:text-sm font-black text-amber-100 line-clamp-2 leading-tight uppercase tracking-wider drop-shadow group-hover:text-amber-200">
                              {gameTitle}
                            </h3>
                          </div>

                          {/* Bottom Cover: Platform & Category Ribbon */}
                          <div className="pl-2 space-y-1 pt-1 border-t border-amber-900/50">
                            <div className="text-[8px] font-mono text-amber-400/80 truncate text-center">
                              {sub.platform || classification.platform}
                            </div>
                            <div className="text-center">
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block border ${classification.badgeClass}`}>
                                {sub.category || classification.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Wooden Shelf Plank Supporting the Books */}
                        <div className="w-full h-3 bg-gradient-to-b from-[#4a260d] to-[#291304] border-t-2 border-amber-600/80 shadow-md relative">
                          <div className="w-full h-0.5 bg-amber-500/30" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAMPILAN 2: BUKU TERBUKA DENGAN PREVIEW (OPEN BOOK TOME)
           ======================================================== */}
        {openedBook && (() => {
          const groupNum = extractGroupNumber(openedBook);
          const palette = getBookPalette(groupNum);
          const classification = classifyGameUrl(openedBook.game_url);
          const gameTitle = openedBook.room_name || openedBook.student_name || 'Game Karya Siswa';
          const isNamedAfterGame = Boolean(
            openedBook.student_name && openedBook.room_name && 
            openedBook.student_name.trim().toLowerCase() === openedBook.room_name.trim().toLowerCase()
          );

          return (
            <div className="flex-1 min-h-0 flex flex-col bg-[#140802] border-2 border-amber-600/70 rounded p-2 sm:p-3 overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Back Bar */}
              <div className="flex items-center justify-between border-b border-[#5c3416] pb-2 mb-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseBook}
                  className="pixel-btn-gold text-xs px-3 py-1 font-bold flex items-center gap-1.5 text-amber-950"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Rak Buku</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-400 font-mono">
                    Halaman Buku Game: <strong className="text-amber-200">{gameTitle}</strong>
                  </span>
                </div>
              </div>

              {/* TWO-PAGE OPEN FANTASY TOME (Bounded with min-h-0 and dedicated scroll) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch overflow-hidden">
                
                {/* HALAMAN KIRI (LEFT PAGE: ARSIP & DETAIL GAME) */}
                <div className="md:col-span-5 pixel-box-inset p-3 sm:p-3.5 bg-[#1a0c04] border border-[#5c3416] flex flex-col justify-between space-y-3 relative pixel-shadow overflow-y-auto min-h-0 pixel-scrollbar">
                  {/* Decorative book page header line */}
                  <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Lembar Karya Kelompok</span>
                    </span>
                    <span className="text-[9px] font-mono text-amber-500">
                      {openedBook.room_code || (groupNum !== 999 ? `Kelompok ${groupNum}` : 'Kelompok Game')}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Game Title */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-amber-200 uppercase tracking-wide">
                        {gameTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${classification.badgeClass}`}>
                          {openedBook.category || classification.category}
                        </span>
                        <span className="text-[9px] text-amber-400/80 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                          {openedBook.platform || classification.platform}
                        </span>
                      </div>
                    </div>

                    {/* Member details (Only if provided) */}
                    {openedBook.group_members ? (
                      <div className="text-[11px] text-amber-100 bg-[#120601] p-2 rounded border border-[#4a240d] space-y-1">
                        <span className="text-amber-400 font-bold block text-[10px] uppercase">
                          Anggota Tim:
                        </span>
                        <p className="leading-snug">{openedBook.group_members}</p>
                      </div>
                    ) : (!isNamedAfterGame && openedBook.student_name) ? (
                      <div className="text-[11px] text-amber-300 font-mono bg-[#120601] p-2 rounded border border-[#4a240d]">
                        Pengirim: {openedBook.student_name} {openedBook.attendance_no ? `(#${openedBook.attendance_no})` : ''}
                      </div>
                    ) : null}

                    {/* Date submitted */}
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Disimpan: {openedBook.created_at ? new Date(openedBook.created_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Hari ini'}
                      </span>
                    </div>

                    {/* URL Link Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Tautan Game:
                      </span>
                      <div className="text-[11px] font-mono text-amber-300 bg-[#0d0401] p-2 rounded border border-[#4a240d] break-all select-all">
                        {openedBook.game_url}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-amber-900/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(openedBook.id, openedBook.game_url)}
                      className="pixel-btn-wood text-xs px-3 py-2 font-bold flex items-center gap-1.5 text-amber-300 hover:text-white"
                      title="Salin tautan game ke papan klip"
                    >
                      {copiedId === openedBook.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={openedBook.game_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-btn-gold text-xs px-4 py-2 font-black flex items-center gap-1.5 text-amber-950 flex-1 justify-center shadow"
                    >
                      <span>Mainkan di Tab Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* HALAMAN KANAN (RIGHT PAGE: LAYAR PREVIEW GAME DI DALAM BUKU) */}
                <div className="md:col-span-7 pixel-box-inset p-3 bg-[#110501] border border-[#5c3416] flex flex-col justify-between space-y-2 pixel-shadow min-h-[300px] md:min-h-0 overflow-hidden">
                  {/* Top Bar for Game Preview */}
                  <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide">
                        Layar Preview Game di Dalam Buku
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setUseProxy((prev) => !prev)}
                        className={`text-[9px] px-2 py-0.5 rounded border font-mono transition-all ${
                          useProxy
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            : 'bg-[#2a1306] text-amber-300/80 border-[#5c3416]'
                        }`}
                        title="Beralih mode: Aktifkan proxy jika browser memblokir embed langsung"
                      >
                        {useProxy ? 'Bypass Embed: AKTIF' : 'Mode Langsung'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIframeKey(Date.now())}
                        className="pixel-btn-wood text-[9px] px-2 py-0.5 flex items-center gap-1 text-amber-300"
                        title="Muat ulang preview game"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Muat Ulang</span>
                      </button>
                      <a
                        href={openedBook.game_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pixel-btn-gold text-[9px] px-2 py-0.5 flex items-center gap-1 font-bold text-amber-950"
                        title="Buka Layar Penuh di Tab Baru"
                      >
                        <span>Fullscreen</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Interactive Embedded Game Iframe */}
                  {(() => {
                    const embedUrl = useProxy
                      ? `/api/proxy-preview?url=${encodeURIComponent(openedBook.game_url)}`
                      : openedBook.game_url;

                    return (
                      <div className="flex-1 w-full min-h-[220px] md:min-h-0 bg-black rounded border border-[#4a240d] overflow-hidden relative shadow-none">
                        <iframe
                          key={`${iframeKey}-${useProxy ? 'proxy' : 'direct'}`}
                          src={embedUrl}
                          title={`Preview Game: ${gameTitle}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    );
                  })()}

                  {/* Footnote instruction */}
                  <div className="text-[9px] text-amber-400/80 font-mono text-center pt-0.5 flex items-center justify-center gap-1.5">
                    <span>Jika game memerlukan login akun atau dibatasi browser:</span>
                    <a
                      href={openedBook.game_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-amber-300 hover:text-amber-100 font-bold"
                    >
                      Buka di Tab Baru
                    </a>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ========================================================
            FOOTER STATUS
           ======================================================== */}
        <div className="pt-2 mt-2 border-t border-[#5c3416] flex items-center justify-between text-[10px] text-amber-400/70 shrink-0">
          <span>Tab Aktif: <strong>{currentTabObj.label}</strong></span>
          <span>{processedSubmissions.length} Buku Karya Terkoleksi</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
