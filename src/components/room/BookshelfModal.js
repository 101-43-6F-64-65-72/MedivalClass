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
  Calendar 
} from 'lucide-react';
import { GAME_CATEGORIES, classifyGameUrl } from '@/lib/gameClassifier';
import { getGameSubmissions } from '@/lib/gameSubmissionsService';
import { playCloseSound, playChoiceClick, playSuccessChime } from '@/lib/soundEffects';

export default function BookshelfModal({
  isOpen,
  onClose,
  targetClass = 'XI PPLG-B',
  onOpenSubmit,
}) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Load submissions whenever modal opens or targetClass changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    getGameSubmissions(targetClass)
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
  }, [isOpen, targetClass]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchCategory = 
        selectedCategory === 'Semua Kategori' || item.category === selectedCategory;
      
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = 
        !q ||
        (item.student_name && item.student_name.toLowerCase().includes(q)) ||
        (item.room_name && item.room_name.toLowerCase().includes(q)) ||
        (item.platform && item.platform.toLowerCase().includes(q)) ||
        (item.game_url && item.game_url.toLowerCase().includes(q));

      return matchCategory && matchQuery;
    });
  }, [submissions, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (id, url) => {
    navigator.clipboard?.writeText(url);
    playSuccessChime();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClose = () => {
    playCloseSound();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[85vh] flex flex-col pixel-panel-wood p-5 sm:p-6 text-amber-100 shadow-2xl border-2 border-amber-600/80 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5c3416] pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#1c0c04] border border-amber-600/70 p-1 shrink-0 flex items-center justify-center">
              <img
                src="/assets/stardew_bookshelf.svg"
                alt="Bookshelf"
                className="w-full h-full object-contain image-pixelated"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-200">
                  Rak Buku Karya Game - {targetClass}
                </h2>
                <span className="pixel-box-inset px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
                  {submissions.length} Karya
                </span>
              </div>
              <p className="text-[10px] text-amber-400/80">
                Koleksi dan arsip link hasil tugas game siswa kelas {targetClass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSubmit && (
              <button
                onClick={() => {
                  playChoiceClick();
                  onOpenSubmit();
                }}
                className="pixel-btn-gold text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 text-amber-950"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Setor Link Game</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="pixel-btn-gold p-1 text-amber-950 font-bold"
              title="Tutup Rak Buku"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-2 mb-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama siswa, kelompok, atau platform..."
              className="w-full bg-[#120702] border border-[#5c3416] focus:border-amber-400 rounded pl-9 pr-3 py-1.5 text-xs text-amber-100 placeholder-amber-800 focus:outline-none font-mono"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {GAME_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'pixel-btn-gold text-amber-950 font-black'
                      : 'pixel-btn-wood text-amber-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submissions List Content */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-xs text-amber-400 font-mono animate-pulse">
              Membuka dan menata rak buku...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center space-y-3 pixel-box-inset p-6 bg-[#140802]">
              <Gamepad2 className="w-8 h-8 text-amber-600/70 mx-auto" />
              <div className="text-xs font-bold text-amber-300">
                {searchQuery || selectedCategory !== 'Semua Kategori'
                  ? 'Tidak ada karya game yang sesuai dengan filter.'
                  : `Belum ada link game yang tersimpan di Rak Buku ${targetClass}.`}
              </div>
              <p className="text-[11px] text-amber-400/70 max-w-sm mx-auto">
                Bicara dengan Sam atau klik tombol Setor Link Game untuk memajang karya game kelompokmu di rak ini!
              </p>
              {onOpenSubmit && (
                <button
                  onClick={() => {
                    playChoiceClick();
                    onOpenSubmit();
                  }}
                  className="pixel-btn-gold text-xs px-4 py-2 font-bold text-amber-950 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Jadilah yang Pertama Menyetor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredSubmissions.map((sub) => {
                const classification = classifyGameUrl(sub.game_url);
                const isCopied = copiedId === sub.id;

                return (
                  <div
                    key={sub.id || sub.game_url}
                    className="pixel-box-inset p-3 bg-[#180b03] border border-[#5c3416] hover:border-amber-500/80 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    {/* Top Row: Category Badge & Platform */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${classification.badgeClass}`}>
                        {sub.category || classification.category}
                      </span>
                      <span className="text-[9px] text-amber-400/70 font-mono">
                        {sub.platform || classification.platform}
                      </span>
                    </div>

                    {/* Middle: Submitter info & Group */}
                    <div>
                      <div className="text-xs font-bold text-amber-100 flex items-center gap-1.5 truncate">
                        <Users className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{sub.student_name}</span>
                        {sub.attendance_no && (
                          <span className="text-[9px] text-amber-400/80 font-mono shrink-0">
                            (#{sub.attendance_no})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono mt-0.5 truncate">
                        {sub.room_name || 'Kelompok Belajar'}
                      </div>
                    </div>

                    {/* URL Link Preview */}
                    <div className="text-[10px] font-mono text-amber-400/80 bg-[#0e0501] px-2 py-1 rounded truncate border border-[#3d1e0a]">
                      {sub.game_url}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#3d1e0a] gap-2">
                      <span className="text-[9px] text-amber-500 font-mono flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>
                          {sub.created_at
                            ? new Date(sub.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Hari ini'}
                        </span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(sub.id, sub.game_url)}
                          className="pixel-btn-wood p-1 text-[10px] text-amber-300"
                          title="Salin Link Game"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <a
                          href={sub.game_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pixel-btn-gold text-[10px] px-2 py-1 font-bold text-amber-950 flex items-center gap-1"
                          title="Buka / Mainkan Game di Tab Baru"
                        >
                          <span>Mainkan</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-[#5c3416] flex items-center justify-between text-[10px] text-amber-400/70">
          <span>Identitas Rak: <strong>{targetClass}</strong></span>
          <span>Hanya Kelas XI yang Aktif</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
