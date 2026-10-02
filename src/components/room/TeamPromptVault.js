'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Gamepad2, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  Trash2, 
  FileText, 
  Users, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { playChoiceClick, playSuccessChime, playCloseSound } from '@/lib/soundEffects';

export default function TeamPromptVault({
  roomCode = '',
  username = '',
  attendanceNo = '',
  teamSharedPrompts = [],
  onSharePromptData,
  onDeleteSharedPrompt,
  onApplyToForm, // callback (data, itemType) => void
  currentFormData = null,
  isEmbedded = false, // if true, fits inside Qeebos modal; if false, renders as standalone modal
  onClose = null,
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'supabase' | 'brainstorm' | 'snippet'
  const [copiedKey, setCopiedKey] = useState(null);
  const [justAppliedId, setJustAppliedId] = useState(null);
  
  // Custom quick note/snippet form
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetContent, setSnippetContent] = useState('');
  const [isQuickShareOpen, setIsQuickShareOpen] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState('');

  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playChoiceClick();
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApply = (item) => {
    if (onApplyToForm) {
      playSuccessChime();
      onApplyToForm(item.data, item.itemType);
      setJustAppliedId(item.id);
      setTimeout(() => setJustAppliedId(null), 3000);
    }
  };

  const handleSendCustomSnippet = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!snippetContent.trim()) return;

    if (onSharePromptData) {
      playChoiceClick();
      await onSharePromptData({
        itemType: 'snippet',
        data: {
          title: snippetTitle.trim() || 'Catatan / Snippet Tim',
          content: snippetContent.trim(),
        },
        summary: snippetTitle.trim() || 'Catatan Tim',
      });
      setSnippetTitle('');
      setSnippetContent('');
      setIsQuickShareOpen(false);
      setShareSuccessMsg('Catatan berhasil dikirim ke kelompok!');
      setTimeout(() => setShareSuccessMsg(''), 3000);
    }
  };

  const handleShareCurrentMcp = async () => {
    if (!currentFormData || !onSharePromptData) return;
    const hasData = currentFormData.supabaseUrl?.trim() || currentFormData.supabaseAnonKey?.trim() || currentFormData.supabaseProjectName?.trim();
    if (!hasData) {
      alert('Isi minimal URL atau Anon Key Supabase terlebih dahulu di form untuk dibagikan ke tim!');
      return;
    }
    playChoiceClick();
    await onSharePromptData({
      itemType: 'supabase',
      data: {
        supabaseProjectName: currentFormData.supabaseProjectName || '',
        supabaseRefId: currentFormData.supabaseRefId || '',
        supabaseUrl: currentFormData.supabaseUrl || '',
        supabaseAnonKey: currentFormData.supabaseAnonKey || '',
      },
      summary: `Kredensial Supabase (${currentFormData.supabaseProjectName || 'Proyek Tim'})`,
    });
    setShareSuccessMsg('Kredensial Supabase berhasil dikirim ke kelompok!');
    setTimeout(() => setShareSuccessMsg(''), 3000);
  };

  const handleShareCurrentBrainstorm = async () => {
    if (!currentFormData || !onSharePromptData) return;
    const hasData = currentFormData.gameName?.trim() || currentFormData.genre?.trim() || currentFormData.ideDescription?.trim();
    if (!hasData) {
      alert('Isi minimal Nama Game atau Ide di form terlebih dahulu untuk dibagikan ke tim!');
      return;
    }
    playChoiceClick();
    await onSharePromptData({
      itemType: 'brainstorm',
      data: {
        gameName: currentFormData.gameName || '',
        genre: currentFormData.genre || '',
        ideDescription: currentFormData.ideDescription || '',
        targetPlayer: currentFormData.targetPlayer || '',
        gameStyle: currentFormData.gameStyle || '',
        developer: currentFormData.developer || 'PEMULA',
      },
      summary: `Ide Game: ${currentFormData.gameName || 'Konsep Tim'}`,
    });
    setShareSuccessMsg('Ide game berhasil dikirim ke kelompok!');
    setTimeout(() => setShareSuccessMsg(''), 3000);
  };

  const filteredItems = teamSharedPrompts.filter((item) => {
    if (filterType === 'all') return true;
    return item.itemType === filterType;
  });

  const content = (
    <div className="flex flex-col h-full space-y-3 text-xs select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#5a3012] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 pixel-box-inset flex items-center justify-center bg-[#251004] text-amber-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-amber-200 flex items-center gap-2">
              <span>Bahan Bersama Kelompok</span>
              <span className="font-mono text-[9px] pixel-btn-gold text-amber-950 px-1.5 py-0.2 font-bold pointer-events-none">
                {roomCode || 'TIM'}
              </span>
            </h3>
            <p className="text-[10px] text-amber-400/70">
              Oper URL Supabase, Anon Key, atau ide game tanpa perlu kirim via WhatsApp.
            </p>
          </div>
        </div>

        {!isEmbedded && onClose && (
          <button
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className="pixel-btn-wood p-1"
            title="Tutup"
          >
            <X className="w-4 h-4 text-amber-300" />
          </button>
        )}
      </div>

      {/* Success Notification */}
      {shareSuccessMsg && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 px-3 py-1.5 rounded text-emerald-200 text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{shareSuccessMsg}</span>
        </div>
      )}

      {/* Quick Action Share Buttons from Current Form */}
      {currentFormData && (
        <div className="bg-[#241105] border border-[#5a3012] rounded p-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Bagikan Data Form Saat Ini ke Tim:</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareCurrentMcp}
              className="pixel-btn-gold text-[10px] px-2.5 py-1 font-bold flex items-center gap-1 shadow"
              title="Kirim URL, Ref ID, dan Anon Key Supabase di form ini ke teman sekelompok"
            >
              <Database className="w-3 h-3 text-amber-950" />
              <span>Oper Data Supabase</span>
            </button>
            <button
              onClick={handleShareCurrentBrainstorm}
              className="pixel-btn-wood text-[10px] px-2.5 py-1 font-bold flex items-center gap-1 text-amber-200"
              title="Kirim ide game dan konsep di form ini ke teman sekelompok"
            >
              <Gamepad2 className="w-3 h-3 text-amber-400" />
              <span>Oper Ide Game</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Quick Note Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              filterType === 'all'
                ? 'bg-amber-600 text-amber-950 border border-amber-300'
                : 'bg-[#2a1306] text-amber-300/80 hover:text-amber-100 border border-[#4a220a]'
            }`}
          >
            Semua ({teamSharedPrompts.length})
          </button>
          <button
            onClick={() => setFilterType('supabase')}
            className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
              filterType === 'supabase'
                ? 'bg-amber-600 text-amber-950 border border-amber-300'
                : 'bg-[#2a1306] text-amber-300/80 hover:text-amber-100 border border-[#4a220a]'
            }`}
          >
            <Database className="w-2.5 h-2.5" />
            <span>Supabase MCP</span>
          </button>
          <button
            onClick={() => setFilterType('brainstorm')}
            className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
              filterType === 'brainstorm'
                ? 'bg-amber-600 text-amber-950 border border-amber-300'
                : 'bg-[#2a1306] text-amber-300/80 hover:text-amber-100 border border-[#4a220a]'
            }`}
          >
            <Gamepad2 className="w-2.5 h-2.5" />
            <span>Ide Game</span>
          </button>
          <button
            onClick={() => setFilterType('snippet')}
            className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
              filterType === 'snippet'
                ? 'bg-amber-600 text-amber-950 border border-amber-300'
                : 'bg-[#2a1306] text-amber-300/80 hover:text-amber-100 border border-[#4a220a]'
            }`}
          >
            <FileText className="w-2.5 h-2.5" />
            <span>Catatan/Key</span>
          </button>
        </div>

        <button
          onClick={() => setIsQuickShareOpen((v) => !v)}
          className="text-[10px] text-amber-400 hover:text-amber-200 flex items-center gap-1 font-bold underline"
        >
          <span>{isQuickShareOpen ? 'Tutup Input Tambahan' : '+ Tulis Catatan / Token Tim'}</span>
          {isQuickShareOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Quick Custom Snippet Form */}
      {isQuickShareOpen && (
        <form onSubmit={handleSendCustomSnippet} className="pixel-box-inset p-3 bg-[#1d0c04] space-y-2 border border-amber-700/60 rounded animate-in fade-in duration-150">
          <div className="text-[10.5px] font-bold text-amber-300">
            Kirim Catatan, Link, atau Token Kustom ke Anggota Kelompok:
          </div>
          <input
            type="text"
            placeholder="Judul / Label (contoh: Link Figma, Token Vercel, Supabase Service Role)"
            value={snippetTitle}
            onChange={(e) => setSnippetTitle(e.target.value)}
            className="w-full pixel-box-inset px-2 py-1 text-xs bg-[#100602] border border-[#5a3012] text-amber-100 focus:outline-none"
          />
          <textarea
            placeholder="Isi catatan, token, atau teks yang ingin dibagikan ke teman sekelompok..."
            value={snippetContent}
            onChange={(e) => setSnippetContent(e.target.value)}
            rows={2}
            className="w-full pixel-box-inset p-2 text-xs font-mono bg-[#100602] border border-[#5a3012] text-amber-100 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsQuickShareOpen(false)}
              className="pixel-btn-wood text-[10px] px-2.5 py-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!snippetContent.trim()}
              className="pixel-btn-gold text-[10px] px-3.5 py-1 font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3 h-3 text-amber-950" />
              <span>Kirim ke Kelompok</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Shared Materials */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-amber-400/60 pixel-box-inset bg-[#180903] p-4 rounded space-y-1.5">
            <div className="font-bold text-xs text-amber-300">
              Belum ada bahan yang dikirim di Kelompok {roomCode || '-'}.
            </div>
            <p className="text-[10px] text-amber-400/70 max-w-sm mx-auto leading-relaxed">
              Jika salah satu anggota telah membuat proyek Supabase, klik <strong>"Oper Data Supabase"</strong> di atas agar anggota lain bisa langsung menerapkan ke form mereka dengan satu klik!
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSupabase = item.itemType === 'supabase';
            const isBrainstorm = item.itemType === 'brainstorm';
            const isSnippet = item.itemType === 'snippet';
            const wasJustApplied = justAppliedId === item.id;

            return (
              <div 
                key={item.id} 
                className="pixel-panel-wood p-3 border border-[#6b3815] bg-[#241005] rounded shadow-md space-y-2 animate-in fade-in duration-100"
              >
                {/* Item Card Header */}
                <div className="flex items-center justify-between border-b border-[#472009] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 uppercase tracking-wider ${
                        isSupabase 
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60' 
                          : isBrainstorm
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      {isSupabase && <Database className="w-2.5 h-2.5" />}
                      {isBrainstorm && <Gamepad2 className="w-2.5 h-2.5" />}
                      {isSnippet && <FileText className="w-2.5 h-2.5" />}
                      <span>{isSupabase ? 'Supabase MCP' : isBrainstorm ? 'Ide Game' : 'Catatan'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-200">
                      {item.senderName} {item.attendanceNo ? `(#${item.attendanceNo})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-amber-400/50 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}</span>
                    </span>
                    {onDeleteSharedPrompt && (
                      <button
                        onClick={() => {
                          if (confirm('Hapus bahan ini dari kelompok?')) {
                            onDeleteSharedPrompt(item.id);
                          }
                        }}
                        title="Hapus bahan dari kelompok"
                        className="text-amber-500/40 hover:text-red-400 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content Details */}
                {isSupabase && (
                  <div className="space-y-1.5 text-[10.5px]">
                    {item.data.supabaseProjectName && (
                      <div className="flex items-center justify-between bg-[#150702] px-2 py-1 rounded">
                        <span className="text-amber-400/80 font-semibold">Nama Proyek:</span>
                        <span className="font-bold text-white truncate max-w-[200px]">{item.data.supabaseProjectName}</span>
                      </div>
                    )}
                    {item.data.supabaseRefId && (
                      <div className="flex items-center justify-between bg-[#150702] px-2 py-1 rounded">
                        <span className="text-amber-400/80 font-semibold">Project Ref ID:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-emerald-300 font-mono font-bold text-[10px]">{item.data.supabaseRefId}</code>
                          <button
                            onClick={() => handleCopy(`ref-${item.id}`, item.data.supabaseRefId)}
                            className="pixel-btn-wood p-0.5 text-[8.5px] px-1"
                            title="Salin Ref ID"
                          >
                            {copiedKey === `ref-${item.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-amber-300" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {item.data.supabaseUrl && (
                      <div className="flex items-center justify-between bg-[#150702] px-2 py-1 rounded">
                        <span className="text-amber-400/80 font-semibold">Supabase URL:</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <code className="text-indigo-300 font-mono text-[10px] truncate max-w-[190px]">{item.data.supabaseUrl}</code>
                          <button
                            onClick={() => handleCopy(`url-${item.id}`, item.data.supabaseUrl)}
                            className="pixel-btn-wood p-0.5 text-[8.5px] px-1 shrink-0"
                            title="Salin Project URL"
                          >
                            {copiedKey === `url-${item.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-amber-300" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {item.data.supabaseAnonKey && (
                      <div className="flex items-center justify-between bg-[#150702] px-2 py-1 rounded">
                        <span className="text-amber-400/80 font-semibold">Anon Key:</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <code className="text-amber-200/80 font-mono text-[9.5px] truncate max-w-[190px]">
                            {item.data.supabaseAnonKey.slice(0, 16)}...{item.data.supabaseAnonKey.slice(-8)}
                          </code>
                          <button
                            onClick={() => handleCopy(`key-${item.id}`, item.data.supabaseAnonKey)}
                            className="pixel-btn-wood p-0.5 text-[8.5px] px-1 shrink-0"
                            title="Salin Anon Key Lengkap"
                          >
                            {copiedKey === `key-${item.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-amber-300" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isBrainstorm && (
                  <div className="space-y-1 text-[10.5px] bg-[#150702] p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400/80 font-semibold">Judul Game:</span>
                      <strong className="text-amber-200">{item.data.gameName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400/80 font-semibold">Genre:</span>
                      <span className="text-white">{item.data.genre}</span>
                    </div>
                    <div className="pt-1 text-[10px] text-amber-100/90 italic leading-snug border-t border-[#381a07] mt-1">
                      "{item.data.ideDescription}"
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] text-amber-400/70 pt-0.5">
                      <span>Target: {item.data.targetPlayer}</span>
                      <span>Gaya: {item.data.gameStyle}</span>
                    </div>
                  </div>
                )}

                {isSnippet && (
                  <div className="bg-[#150702] p-2 rounded space-y-1">
                    <div className="font-bold text-amber-300 text-[11px] flex items-center justify-between">
                      <span>{item.data.title || 'Catatan Tim'}</span>
                      <button
                        onClick={() => handleCopy(`snip-${item.id}`, item.data.content)}
                        className="pixel-btn-wood p-0.5 text-[8.5px] px-1.5 flex items-center gap-1"
                        title="Salin Teks"
                      >
                        {copiedKey === `snip-${item.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-amber-300" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <div className="font-mono text-[10.5px] text-amber-100/90 whitespace-pre-wrap select-text break-words">
                      {item.data.content}
                    </div>
                  </div>
                )}

                {/* 1-Click Auto-Fill Action Button */}
                {onApplyToForm && (isSupabase || isBrainstorm) && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleApply(item)}
                      className={`text-[10px] px-3 py-1 font-bold rounded flex items-center gap-1.5 shadow transition-all ${
                        wasJustApplied
                          ? 'bg-emerald-600 text-white ring-1 ring-emerald-300'
                          : 'pixel-btn-gold text-amber-950 hover:brightness-110'
                      }`}
                    >
                      {wasJustApplied ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Sudah Diterapkan ke Form!</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3 text-amber-950" />
                          <span>Terapkan ke Form Ini (1 Klik)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[85vh] pixel-panel-wood text-amber-100 p-4 rounded shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {content}
      </div>
    </div>
  );
}
