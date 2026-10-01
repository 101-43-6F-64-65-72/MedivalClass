"use client";

import React, { useState } from 'react';
import { Bot, Copy, Check, Sparkles, Send, X, ArrowRight, RefreshCw, Flame } from 'lucide-react';

export default function ChatbotWidget({ gameStarted = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('INTRO'); // INTRO -> FORM -> PREVIEW -> DISASTER
  const [copied, setCopied] = useState(false);

  // Auto-open saat gameStarted === true
  React.useEffect(() => {
    if (gameStarted) {
      setIsOpen(true);
      setStep('INTRO');
    }
  }, [gameStarted]);

  // Form Parameters Master Prompt Badai Ide
  const [formData, setFormData] = useState({
    gameName: '',
    genre: '',
    targetUser: '',
    gameGoal: '',
    coreGameplay: '',
    targetDuration: '',
    devLevel: '',
    deviceCondition: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormComplete = 
    formData.gameName.trim() &&
    formData.genre.trim() &&
    formData.targetUser.trim() &&
    formData.gameGoal.trim() &&
    formData.coreGameplay.trim() &&
    formData.targetDuration.trim() &&
    formData.devLevel.trim() &&
    formData.deviceCondition.trim();

  // Template Master Prompt sesuai instruksi
  const generateMasterPrompt = () => {
    return `AI GAME ARCHITECT — MASTER PROMPT
Saya ingin membuat sebuah game dengan bantuan AI Agent.
Kamu bertindak sebagai Senior Game Designer + Principal Software Architect + Tech Lead.
AI Agent nantinya akan bertindak sebagai Software Engineer / Implementer yang mengerjakan project berdasarkan rencana dan aturan yang kamu buat.
Saya adalah Product Owner. Saya yang memberikan visi dan menyetujui atau menolak keputusan penting.

1. PROJECT INPUT
Nama game: ${formData.gameName || '[NAMA_GAME]'}
Genre: ${formData.genre || '[GENRE]'}
Platform: WEB
Target pengguna: ${formData.targetUser || '[TARGET_PENGGUNA]'}
Tujuan game: ${formData.gameGoal || '[TUJUAN_GAME]'}
Core gameplay: ${formData.coreGameplay || '[CORE_GAMEPLAY]'}
Target durasi pengerjaan: ${formData.targetDuration || '[TARGET_DURASI]'}
Level kemampuan developer: ${formData.devLevel || '[LEVEL_DEV]'}
Kondisi perangkat: ${formData.deviceCondition || '[KONDISI_PERANGKAT]'}

2. TECHNOLOGY CONSTRAINT
Prioritaskan teknologi yang: ringan, mudah dijalankan, tidak membutuhkan hardware khusus, mudah dipahami developer pemula, mudah di-debug, mudah di-deploy.
Gunakan framework NEXT JS.

3. PERAN KAMU
Kamu adalah Senior Game Designer, Principal Software Architect, Tech Lead, QA Lead, dan Technical Reviewer. Kamu BUKAN sekadar generator kode.
Tugasmu adalah membantu saya mengambil keputusan teknis dan menjaga project tetap realistis.

4. ATURAN UTAMA
Jangan langsung membuat kode. Mulai dengan menganalisis tujuan project, target user, core gameplay, technical constraints, scope, risiko, kompleksitas, dan fitur yang tidak diperlukan.
Gunakan prinsip YAGNI, KISS, maintainability, performance, dan simplicity.

5. PHASE 0 — GAME CONCEPT
Buat Game Concept, Core Gameplay Loop, Player Experience, Main Features, Optional Features, Non-Goals, Technical Constraints, Recommended Technology, Project Risks, dan MVP Scope.
Setelah selesai, BERHENTI dan tunggu persetujuan saya.

6. PHASE 1 — PROJECT ARCHITECTURE
Setelah disetujui, buat rancangan folder structure, file structure, architecture, game systems, data flow, state management, rendering strategy, input system, collision system, dan audio strategy.
Buat README.md, GAME_DESIGN.md, ARCHITECTURE.md, AGENTS.md, TODO.md, dan CHANGELOG.md.

7. PHASE 2+ — IMPLEMENTATION
Pecah project menjadi phase kecil dengan Objective, Files involved, Implementation tasks, Acceptance criteria, Testing procedure, dan Expected result.

8. AI AGENT RULES & ACCEPTANCE CRITERIA
Ikuti dokumentasi project, jangan hapus kode tanpa alasan, dan selalu verifikasi acceptance criteria.

9. HUMAN APPROVAL
Pada akhir setiap phase tampilkan: Completed, Changed Files, Tests, Issues, dan Next Phase lalu tunggu approval.

Sekarang mulai dari PHASE 0 — GAME CONCEPT. Analisis ide game saya terlebih dahulu dan berikan rekomendasi MVP.`;
  };

  const handleCopyPrompt = () => {
    const fullText = generateMasterPrompt();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      // Alihkan ke klimaks dialog NPC hanyut setelah prompt disalin
      setStep('DISASTER');
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          title="Mentor AI (Badai Ide)"
          className="w-12 h-12 rounded-full bg-[#261408]/95 hover:bg-[#3d2010] text-amber-300 border-2 border-[#8c5324] shadow-2xl flex items-center justify-center transition-all duration-150 active:scale-95 hover:scale-105"
        >
          <Bot className="w-5 h-5 text-amber-400" />
        </button>
      ) : (
        <div className="w-[360px] sm:w-[440px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[580px] h-[580px] overflow-hidden">
          {/* Widget Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <Bot className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  NPC Mentor Game
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800 font-mono">
                    Phase 2
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Skenario Badai Ide & Master Prompt Generator</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Widget Body Content (Step Controlled) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-sm bg-slate-950/50">
            {/* STEP 1: INTRO */}
            {step === 'INTRO' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>⛈️ KAPAL KITA DITERJANG BADAI IDE DASYAT!</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "Sebelum aku terseret badai, mari kita rumuskan Master Prompt AI Game Architect! Ini akan memandu AI Agent kalian mendirikan kerajaan game yang megah! Cepat, badai makin dekat!"
                  </p>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-800/50 p-3.5 rounded-xl text-xs text-indigo-200 leading-relaxed">
                  💡 <strong>Tugas Tim:</strong> Rumuskan 8 parameter game design bersama rekan se-room untuk bekal memandu AI Agent.
                </div>

                <button
                  onClick={() => setStep('FORM')}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Mulai Badai Ide (Isi Form)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: FORM PARAMETER */}
            {step === 'FORM' && (
              <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-amber-400">Form Parameter Master Prompt</h4>
                  <span className="text-[10px] text-slate-400">8 Parameter</span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">1. Nama Game</label>
                    <input
                      type="text"
                      value={formData.gameName}
                      onChange={(e) => handleChange('gameName', e.target.value)}
                      placeholder="Contoh: Medival Dungeon Runner"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">2. Genre Game</label>
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) => handleChange('genre', e.target.value)}
                      placeholder="Contoh: 2D Pixel Action RPG / Puzzle"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">3. Target Pengguna</label>
                    <input
                      type="text"
                      value={formData.targetUser}
                      onChange={(e) => handleChange('targetUser', e.target.value)}
                      placeholder="Contoh: Siswa SMA / Gamer Casual Web"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">4. Tujuan Game</label>
                    <input
                      type="text"
                      value={formData.gameGoal}
                      onChange={(e) => handleChange('gameGoal', e.target.value)}
                      placeholder="Contoh: Pembelajaran logika & kolaborasi team"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">5. Core Gameplay</label>
                    <input
                      type="text"
                      value={formData.coreGameplay}
                      onChange={(e) => handleChange('coreGameplay', e.target.value)}
                      placeholder="Contoh: Pergerakan 4 player & kolaborasi teka-teki"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">6. Target Durasi Pengerjaan</label>
                    <input
                      type="text"
                      value={formData.targetDuration}
                      onChange={(e) => handleChange('targetDuration', e.target.value)}
                      placeholder="Contoh: 3 Hari / 1 Minggu"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">7. Level Kemampuan Developer</label>
                    <input
                      type="text"
                      value={formData.devLevel}
                      onChange={(e) => handleChange('devLevel', e.target.value)}
                      placeholder="Contoh: Pemula - Menengah (Next.js & JS)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">8. Kondisi Perangkat</label>
                    <input
                      type="text"
                      value={formData.deviceCondition}
                      onChange={(e) => handleChange('deviceCondition', e.target.value)}
                      placeholder="Contoh: Laptop standar tanpa GPU khusus"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setStep('INTRO')}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => setStep('PREVIEW')}
                    disabled={!isFormComplete}
                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Generate Prompt</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW PROMPT & COPY BUTTON */}
            {step === 'PREVIEW' && (
              <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Master Prompt Siap!</span>
                  </h4>
                  <button
                    onClick={() => setStep('FORM')}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Edit Form
                  </button>
                </div>

                <p className="text-slate-300 text-[11px]">
                  Tinjau teks di bawah ini lalu klik tombol salin untuk diserahkan ke AI Agent kalian:
                </p>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl max-h-[280px] overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {generateMasterPrompt()}
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Master Prompt</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 4: DISASTER — KLIMAKS NPC HANYUT */}
            {step === 'DISASTER' && (
              <div className="space-y-4 animate-in zoom-in duration-300 text-xs">
                <div className="bg-red-950/60 border border-red-800/80 p-5 rounded-2xl text-center space-y-3 shadow-2xl relative overflow-hidden">
                  <div className="w-12 h-12 bg-red-900/80 text-red-300 rounded-full flex items-center justify-center mx-auto border border-red-600 text-2xl animate-spin">
                    🌪️
                  </div>
                  
                  <h4 className="font-extrabold text-base text-red-400 tracking-wide uppercase">
                    ARGHHH... BADAI TERLALU KUAT!
                  </h4>

                  <p className="text-slate-200 leading-relaxed font-semibold italic">
                    "Master Prompt sudah siap! Gunakan ini untuk memandu AI Agent kalian! Arghhh... badai terlalu kuat, aku hanyuttt! Kalian berempat harus melanjutkan ini bersama-sama!"
                  </p>

                  <div className="text-[10px] bg-red-900/40 text-red-300 py-1 px-2.5 rounded-full inline-block border border-red-700/50">
                    🌊 NPC Terseret Badai Ide...
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed text-center">
                  ✅ <strong>Master Prompt telah berhasil disalin ke clipboard!</strong> Sekarang mulailah berdiskusi dengan tim Anda dan gunakan prompt tersebut untuk memandu AI Agent.
                </div>

                <button
                  onClick={() => setStep('INTRO')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ulangi Badai Ide</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
