'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Copy, Check, Sparkles, X, ChevronRight, Database, Gamepad2, ArrowRight, AlertCircle, FileText, Settings, Navigation } from 'lucide-react';
import { 
  playTypewriterBlip, 
  playDialogueOpen, 
  playChoiceHover, 
  playChoiceClick, 
  playScrollOpen, 
  playBlushChime, 
  playCloseSound,
  playSuccessChime
} from '@/lib/soundEffects';

function QeebosNPC({
  x = 1715,
  y = 720,
  localPlayer,
  onOpenChange,
  isTracked = false,
}) {
  const [mounted, setMounted] = useState(false);
  // Dialogue state: null | 'intro' | 'explain' | 'sayang' | 'form'
  const [dialogStage, setDialogStage] = useState(null);
  
  // Independent tabs: 'brainstorm' | 'mcp'
  const [activeTab, setActiveTab] = useState('brainstorm');
  // Independent view modes per tab: 'form' | 'preview'
  const [brainstormView, setBrainstormView] = useState('form');
  const [mcpView, setMcpView] = useState('form');

  const [copiedType, setCopiedType] = useState(null); // 'brainstorm' | 'mcp' | null
  const [validationError, setValidationError] = useState('');

  // Visual Novel Typing Effect State
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const DIALOGUE_TEXTS = {
    intro: 'Halo aku Qeebos dan aku punya scroll prompt yang akan kamu butuhkan. Mau buat prompt Brainstorming atau setup MCP Server?',
    explain: 'Halah alah, ini digunakan untuk membantu mu dalam prompting agar AI menghasilkan output yang enak, mantap, dan terarah!',
    sayang: 'Aduh jadi malu... Nih pilih scroll yang kamu mau >///<',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Visual Novel typewriter ticker
  useEffect(() => {
    if (!dialogStage || dialogStage === 'form') {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const fullText = DIALOGUE_TEXTS[dialogStage] || '';
    if (!fullText) return;

    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      const currentSlice = fullText.slice(0, currentIndex);
      setDisplayedText(currentSlice);
      
      const char = fullText[currentIndex - 1];
      if (currentIndex % 2 === 0) {
        playTypewriterBlip(char);
      }

      if (currentIndex >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [dialogStage]);

  // Click or press Space/Enter to instant-complete typing
  const handleSkipTyping = () => {
    if (isTyping && dialogStage && DIALOGUE_TEXTS[dialogStage]) {
      setDisplayedText(DIALOGUE_TEXTS[dialogStage]);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const handleKeySkip = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if ((e.key === ' ' || e.key === 'Enter') && isTyping) {
        e.preventDefault();
        handleSkipTyping();
      }
    };

    window.addEventListener('keydown', handleKeySkip);
    return () => window.removeEventListener('keydown', handleKeySkip);
  }, [isTyping, dialogStage]);

  // Format keywords in the typed text
  const renderTypedContent = (text) => {
    if (!text) return null;

    const keywords = [
      { word: 'Qeebos', className: 'text-[#7d3204] font-black underline decoration-[#a0521e]' },
      { word: 'scroll prompt', className: 'text-[#873906] font-black' },
      { word: 'Brainstorming', className: 'text-[#1e6126] font-black' },
      { word: 'MCP Server', className: 'text-[#094770] font-black' },
      { word: 'enak', className: 'text-[#1e6126] font-black' },
      { word: 'mantap', className: 'text-[#8c4a00] font-black' },
      { word: 'terarah', className: 'text-[#094770] font-black' },
      { word: '>///<', className: 'text-[#8c1b48] font-black' },
    ];

    const regex = new RegExp(`(${keywords.map(k => k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const match = keywords.find(k => k.word.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <span key={idx} className={match.className}>
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Proximity check: Generous radius (130px)
  const isNear = Boolean(
    localPlayer &&
    Math.hypot(localPlayer.x - x, localPlayer.y - y) <= 130
  );

  const isDialogOpen = Boolean(dialogStage);

  // Notify parent if dialog or form is open (to disable player movement)
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isDialogOpen);
    }
  }, [isDialogOpen, onOpenChange]);

  const handleOpenIntro = () => {
    playDialogueOpen();
    setDialogStage('intro');
  };

  // Handle 'E' key press to interact with Qeebos when nearby
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if ((e.key === 'e' || e.key === 'E') && isNear && !dialogStage) {
        e.preventDefault();
        handleOpenIntro();
      } else if (e.key === 'Escape' && dialogStage) {
        e.preventDefault();
        handleCloseAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, dialogStage]);

  // Form Parameters for Brainstorming & Supabase Setup (SEPARATED)
  const [formData, setFormData] = useState({
    // Brainstorming fields
    gameName: '',
    genre: '',
    ideDescription: '',
    targetPlayer: '',
    gameStyle: '',
    targetDuration: '',
    developer: 'PEMULA',
    // Supabase MCP fields
    supabaseProjectName: '',
    supabaseRefId: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationError) {
      setValidationError('');
    }
  };

  // Validation Checks - Completely Independent
  const isBrainstormValid = Boolean(
    formData.gameName.trim() &&
    formData.genre.trim() &&
    formData.ideDescription.trim() &&
    formData.targetPlayer.trim() &&
    formData.gameStyle.trim() &&
    formData.targetDuration.trim()
  );

  const isMcpValid = Boolean(
    formData.supabaseProjectName.trim() &&
    formData.supabaseRefId.trim() &&
    formData.supabaseUrl.trim() &&
    formData.supabaseAnonKey.trim()
  );

  // Prompt Generator 1: Brainstorming ONLY
  const generateBrainstormPrompt = () => {
    return `# AI GAME ARCHITECT — BRAINSTORMING

Saya ingin membuat game multiplayer berbasis web dengan bantuan AI Agent.

Kamu bertindak sebagai Senior Game Designer, Game Architect, dan Technical Mentor.

Saya adalah Product Owner. Bantu saya mengembangkan ide, tetapi jangan langsung membuat kode.

## PROJECT INPUT

Nama Game:
${formData.gameName.trim() || '[ISI NAMA GAME]'}

Genre:
${formData.genre.trim() || '[ISI GENRE GAME]'}

Deskripsi Ide:
${formData.ideDescription.trim() || '[ISI 2–3 KALIMAT]'}

Target Pemain:
${formData.targetPlayer.trim() || '[ISI TARGET PEMAIN]'}

Gaya Game:
${formData.gameStyle.trim() || '[PIXEL ART / CARTOON / RETRO / DLL]'}

Target Waktu Pembuatan:
${formData.targetDuration.trim() || '[ISI TARGET WAKTU]'}

Developer:
PEMULA

## TECHNOLOGY

Gunakan:

* Next.js
* Supabase
* Supabase Realtime
* GitHub
* Vercel

Game wajib multiplayer.

Prioritaskan solusi sederhana dan realistis untuk developer pemula.

Jangan menambahkan teknologi lain kecuali benar-benar diperlukan.

## TUGAS

Bantu saya mengembangkan:

1. Game Concept
2. Core Gameplay
3. Gameplay Loop
4. Cara multiplayer bekerja
5. Player interaction
6. Kondisi menang/kalah
7. Fitur MVP
8. Fitur yang sebaiknya ditunda
9. Data yang perlu disimpan di Supabase
10. Bagian yang menggunakan Supabase Realtime
11. Struktur halaman utama
12. Risiko teknis terbesar
13. Urutan development sederhana

Jika ide saya terlalu besar, sederhanakan.

Jangan menambahkan fitur hanya agar game terlihat lebih kompleks.

Bedakan dengan jelas:

MVP = wajib untuk game bisa dimainkan.

Optional = dikerjakan jika MVP sudah selesai.

## ATURAN

Jangan membuat kode.

Jangan membuat file.

Jangan melakukan implementasi.

Jangan menentukan semuanya sendiri.

Jika ada keputusan desain penting, berikan beberapa opsi dan jelaskan trade-off singkatnya agar saya dapat memilih.

Fokus pada game yang:

SIMPLE
→ PLAYABLE
→ MULTIPLAYER
→ STABLE
→ FUN

Setelah brainstorming selesai, berhenti dan tunggu keputusan saya.`;
  };

  // Prompt Generator 2: Supabase Connection & MCP Server Setup ONLY
  const generateMcpPrompt = () => {
    return `# SUPABASE CONNECTION & MCP SETUP

You are the Software Engineer responsible for connecting this existing project to the student's Supabase project.

Your task is to configure the project so that:

1. The Antigravity Agent can work with the correct Supabase project through Supabase MCP.
2. The Next.js application can connect to the same Supabase project.
3. Future database migrations, schema changes, RLS configuration, and Supabase-related development can be performed against this exact project.
4. No credentials or secrets are exposed in source code or Git.

## SUPABASE PROJECT INFORMATION

Use the following project information:

* Project Name: ${formData.supabaseProjectName.trim() || '[ISI NAMA PROJECT SUPABASE]'}
* Project Reference ID: ${formData.supabaseRefId.trim() || '[ISI PROJECT REFERENCE ID]'}
* Project URL: ${formData.supabaseUrl.trim() || '[ISI PROJECT URL]'}
* Publishable Key: ${formData.supabaseAnonKey.trim() || '[ISI PUBLISHABLE KEY]'}

IMPORTANT:

* Do NOT ask me for or create a service_role key.
* Do NOT put any service_role key, secret key, database password, or personal access token into source code.
* Do NOT commit \`.env.local\` to Git.
* Treat all credentials as sensitive even if they are intended for client-side use.
* If MCP authentication requires Supabase login/OAuth, use the supported authentication flow instead of asking me to paste a personal access token into this prompt.

---

# STEP 1 — INSPECT THE CURRENT PROJECT

Before changing anything:

1. Inspect the existing project structure.
2. Read:

   * README.md
   * GAME_DESIGN.md
   * ARCHITECTURE.md
   * AGENTS.md
   * TODO.md
   * CHANGELOG.md
3. Inspect \`package.json\`.
4. Check whether Supabase packages are already installed.
5. Check whether a Supabase MCP configuration already exists.
6. Check whether \`.env.local\` already exists.
7. Check \`.gitignore\`.

Do not overwrite existing project files unnecessarily.

---

# STEP 2 — CONNECT SUPABASE MCP

Configure Supabase MCP so that it targets ONLY this Supabase project:

Project Reference ID:

${formData.supabaseRefId.trim() || '[ISI PROJECT REFERENCE ID]'}

Use the project-scoped Supabase MCP configuration whenever supported.

The intended target is:

${formData.supabaseUrl.trim() || '[ISI PROJECT URL]'}

If an existing Supabase MCP configuration is already present:

* inspect it first;
* update it only if it points to another project;
* do not create duplicate MCP configurations.

If authentication is required:

* use the supported Supabase MCP authentication/OAuth flow;
* ask the user to authenticate through the appropriate Antigravity/Supabase interface;
* never request a service_role key or database password.

After connection, verify that the MCP connection is targeting the intended Supabase project.

Do not modify any database schema yet.

---

# STEP 3 — CONFIGURE THE NEXT.JS APPLICATION

Configure the application to use the same Supabase project.

Use the existing project's environment-variable convention where possible.

The application should have:

NEXT_PUBLIC_SUPABASE_URL=${formData.supabaseUrl.trim() || '[ISI PROJECT URL]'}

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${formData.supabaseAnonKey.trim() || '[ISI PUBLISHABLE KEY]'}

If the project already uses the legacy \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`, do not create duplicate variables unnecessarily. Keep the existing convention and report it in the final report.

IMPORTANT:

* \`.env.local\` must remain ignored by Git.
* Never hard-code the key inside JavaScript/React source files.
* Never expose a service_role/secret key to the browser.
* \`.env.example\` may contain variable names and placeholder values, but never real secrets.

---

# STEP 4 — INSTALL ONLY REQUIRED DEPENDENCIES

Inspect the current dependencies first.

If Supabase client functionality is not installed, install only the dependency required by the existing architecture.

Prefer:

@supabase/supabase-js

Do not install unnecessary libraries.

Do not introduce a game engine or unrelated dependencies.

---

# STEP 5 — CREATE THE SUPABASE CLIENT

Create the minimum required Supabase client structure for this project.

Follow the project's existing architecture.

The client should:

* read credentials from environment variables;
* be reusable by future game features;
* avoid creating a new Supabase client unnecessarily on every render;
* not contain hard-coded credentials.

Do not implement rooms, players, coins, scores, authentication, or realtime gameplay yet.

This task is ONLY the connection foundation.

---

# STEP 6 — VERIFY THE CONNECTION

Verify all of the following:

1. The application can initialize the Supabase client.
2. The environment variables are loaded correctly.
3. The Supabase MCP points to the intended Project Reference ID.
4. No secret credentials are exposed in source files.
5. \`.env.local\` is ignored by Git.
6. The project still builds successfully.
7. There are no unnecessary dependency changes.

If MCP access cannot be verified because user authentication is required, clearly report that and tell me exactly what I need to approve/authenticate. Do not guess that the connection works.

---

# STEP 7 — SECURITY CHECK

Before finishing, inspect for accidental exposure of:

* service_role keys
* secret keys
* database passwords
* personal access tokens
* \`.env.local\`
* credentials committed to Git

If any are found, stop and report the problem instead of silently proceeding.

Remember:

The Project Reference ID and Project URL are not substitutes for authentication credentials.

---

# IMPORTANT SCOPE LIMIT

DO NOT:

* create database tables yet;
* create migrations yet;
* modify RLS yet;
* create rooms;
* create players;
* implement multiplayer;
* implement Realtime;
* implement coins;
* implement score;
* implement game logic;
* redesign the UI;
* add unrelated dependencies;
* modify unrelated files.

This phase is ONLY:

Supabase MCP connection + Next.js Supabase client foundation.

---

# FINAL REPORT

When finished, report:

1. Supabase Project Reference ID being targeted.
2. Whether Supabase MCP is connected and verified.
3. Whether Next.js Supabase client is configured.
4. Environment variables created/updated.
5. Dependencies added/changed.
6. Files created/modified.
7. Build/test result.
8. Any remaining manual authentication step.
9. Any security issue found.

Then STOP.

Do not continue to database schema or game implementation.

Wait for my approval before proceeding to the next phase.`;
  };

  const handleCopyBrainstorm = () => {
    if (!isBrainstormValid) {
      setValidationError('Semua kolom ide game wajib diisi sebelum menyalin prompt brainstorming!');
      return;
    }
    const text = generateBrainstormPrompt();
    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopiedType('brainstorm');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyMcp = () => {
    if (!isMcpValid) {
      setValidationError('Semua kolom Supabase & MCP wajib diisi sebelum menyalin prompt MCP server!');
      return;
    }
    const text = generateMcpPrompt();
    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopiedType('mcp');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleOpenBrainstorm = () => {
    playScrollOpen();
    setActiveTab('brainstorm');
    setValidationError('');
    setDialogStage('form');
  };

  const handleOpenMcp = () => {
    playScrollOpen();
    setActiveTab('mcp');
    setValidationError('');
    setDialogStage('form');
  };

  const handleCloseAll = () => {
    playCloseSound();
    setDialogStage(null);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <>
      {/* ========================================================
          1. IN-ROOM PHYSICAL NPC: QEEBOS
             Rendered in 2D Classroom Camera Layer
         ======================================================== */}
      <div 
        className="absolute cursor-default pointer-events-auto select-none group"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: Math.floor(y) || 530,
          width: '56px',
          height: '68px',
        }}
        title="Dekati dan tekan E untuk bicara dengan Qeebos"
      >
        {/* Floating NPC Pointer Arrow (Only when not tracked) */}
        {!isTracked && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-bounce">
            <img 
              src="/assets/fantasy_pixelart_ui/arrows/gold_arrow_down_normal.png" 
              alt="NPC Pointer" 
              className="w-4 h-4 image-rendering-pixelated drop-shadow" 
            />
          </div>
        )}

        {/* Proximity Interaction Hint [E] */}
        {isNear && !dialogStage && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-bounce-short">
            <div className="pixel-panel-wood text-amber-100 px-2.5 py-1 flex items-center gap-1.5 shadow-2xl border border-amber-600/70">
              <span className="pixel-btn-gold text-amber-950 font-mono font-black text-[10px] px-1.5 py-0.2 pointer-events-none">
                E
              </span>
              <span className="text-[11px] font-bold text-amber-200">Tekan E untuk Bicara</span>
            </div>
          </div>
        )}

        {/* NPC Nametag */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#140802]/90 border border-amber-600/70 text-amber-300 shadow-md">
            <span>Qeebos</span>
          </div>
        </div>

        {/* Active Waypoint Beacon Marker (100% centered and fitted on NPC) */}
        {isTracked && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center animate-bounce">
            <div className="pixel-panel-gold px-2 py-0.5 text-[9px] font-black text-amber-950 uppercase tracking-widest shadow-2xl border-2 border-amber-900 flex items-center gap-1 whitespace-nowrap">
              <Navigation className="w-2.5 h-2.5 text-amber-900 fill-amber-900" />
              <span>TARGET</span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-400 drop-shadow-md" />
          </div>
        )}

        {/* Qeebos Avatar Sprite (Using authentic OwnAssets/qeebos/qeebos.png) */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-end">
          <img 
            src="/assets/OwnAssets/qeebos/qeebos.png" 
            alt="Qeebos" 
            className="w-12 h-12 object-contain image-pixelated transition-transform group-hover:scale-105 active:scale-95" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/OwnAssets/qeebos/normal.png';
            }}
          />
          {/* Shadow directly at feet */}
          <div className="w-8 h-2.5 bg-black/60 rounded-full blur-[1px] -mt-1 pointer-events-none" />
        </div>

        {/* Golden Target Pulse Ring at Feet */}
        {isTracked && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-12 h-3.5 border-2 border-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute w-10 h-3 border-2 border-amber-300 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
          </div>
        )}
      </div>

      {/* ========================================================
          2. PORTAL DIALOG & MODALS (Portaled to document.body)
         ======================================================== */}
      {mounted && createPortal(
        <>
          {/* A. STARDEW VALLEY DIALOGUE BOX */}
          {dialogStage && dialogStage !== 'form' && (
            <div className="fixed inset-0 z-[999999] pointer-events-auto flex items-end justify-center pb-6 sm:pb-8 px-4 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150">
              <div 
                className="w-full max-w-[800px] select-none rounded shadow-2xl relative"
                style={{
                  backgroundColor: '#733814',
                  border: '4px solid #4a210b',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 2px 4px #a05322',
                  padding: '8px',
                }}
              >
                {/* Close Button top-right */}
                <button
                  onClick={handleCloseAll}
                  title="Tutup Dialog (Esc)"
                  className="absolute -top-3.5 -right-3.5 bg-[#54280b] hover:bg-[#733814] border-2 border-[#f7d59b] text-[#f7d59b] w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-110 active:scale-90 z-20"
                >
                  ✕
                </button>

                {/* Main Stardew Container: Left Parchment + Right Portrait */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                  {/* LEFT: Dialogue Parchment Box */}
                  <div 
                    className="flex-1 rounded p-4 sm:p-5 flex flex-col justify-between min-h-[170px] relative shadow-inner"
                    style={{
                      backgroundColor: '#f5cb85',
                      border: '3px solid #b87c42',
                      boxShadow: 'inset 0 0 12px rgba(139, 75, 26, 0.25)',
                    }}
                  >
                    {/* Dialogue Text Area (Clickable to skip typing) */}
                    <div 
                      onClick={handleSkipTyping}
                      className="text-[#3b1c06] font-medium leading-relaxed text-sm sm:text-base select-text cursor-pointer min-h-[56px]"
                      title={isTyping ? "Klik untuk mempercepat teks" : ""}
                    >
                      <p className="font-semibold text-sm sm:text-base">
                        "{renderTypedContent(displayedText)}"
                        {isTyping && (
                          <span className="inline-block w-2 h-4 ml-1 bg-[#8c3b28] animate-pulse align-middle" />
                        )}
                      </p>
                    </div>

                    {/* Dialogue Choice List */}
                    <div className={`mt-3 pt-2 border-t border-[#c98d51]/50 space-y-1.5 transition-opacity duration-200 ${
                      isTyping ? 'opacity-40' : 'opacity-100'
                    }`}>
                      {dialogStage === 'intro' && (
                        <>
                          {/* Option 1: Brainstorming */}
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleOpenBrainstorm();
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center justify-between group transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                              <span>Scroll 1: Brainstorming Ide Game</span>
                            </div>
                            <span className="text-[10px] text-[#733814] bg-[#ebd1a0] px-1.5 py-0.5 rounded font-mono">
                              Konsep & Loop
                            </span>
                          </button>

                          {/* Option 2: MCP Server & Supabase */}
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              handleOpenMcp();
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center justify-between group transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                              <span>Scroll 2: MCP Server & Supabase</span>
                            </div>
                            <span className="text-[10px] text-[#094770] bg-[#ebd1a0] px-1.5 py-0.5 rounded font-mono">
                              Koneksi Database
                            </span>
                          </button>

                          {/* Option 3: Explanation */}
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playChoiceClick();
                              setDialogStage('explain');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Apa itu scroll prompt?</span>
                          </button>

                          {/* Option 4: Cute flirt */}
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={() => {
                              playBlushChime();
                              setDialogStage('sayang');
                            }}
                            className="w-full text-left px-3 py-1.5 bg-gradient-to-r from-[#ffe5cf] to-[#ffd4df] hover:from-[#fff0e0] hover:to-[#ffe1ea] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#96264d] rounded text-xs sm:text-sm font-bold text-[#5c1328] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#96264d] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Tolong ya sayang</span>
                          </button>

                          {/* Option 5: Gak */}
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={handleCloseAll}
                            className="w-full text-left px-3 py-1.5 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#6d2716] flex items-center gap-2 group transition-all shadow-sm"
                          >
                            <span className="text-[#a0521e] group-hover:translate-x-1 transition-transform font-mono">▶</span>
                            <span>Nanti dulu, pamit ya</span>
                          </button>
                        </>
                      )}

                      {dialogStage === 'explain' && (
                        <button
                          onMouseEnter={() => playChoiceHover()}
                          onClick={() => {
                            playChoiceClick();
                            setDialogStage('intro');
                          }}
                          className="w-full text-left px-3 py-2 bg-[#fde5bc] hover:bg-[#fff3db] active:bg-[#ebd09d] border-2 border-[#b87c42] hover:border-[#733814] rounded text-xs sm:text-sm font-bold text-[#3d1e08] flex items-center gap-2 group transition-all shadow-sm"
                        >
                          <span className="text-[#a0521e] group-hover:-translate-x-1 transition-transform font-mono">◀</span>
                          <span>Kembali ke pilihan scroll</span>
                        </button>
                      )}

                      {dialogStage === 'sayang' && (
                        <div className="flex gap-2">
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={handleOpenBrainstorm}
                            className="flex-1 py-2 px-3 bg-[#b33660] hover:bg-[#c4416e] text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1"
                          >
                            <span>Scroll Brainstorming</span>
                          </button>
                          <button
                            onMouseEnter={() => playChoiceHover()}
                            onClick={handleOpenMcp}
                            className="flex-1 py-2 px-3 bg-[#1e4a6d] hover:bg-[#255c87] text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1"
                          >
                            <span>Scroll MCP Server</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stardew Indicator */}
                    <div className="absolute bottom-2 right-2.5 pointer-events-none select-none text-xs text-[#a0521e] animate-bounce font-mono">
                      ▼
                    </div>
                  </div>

                  {/* RIGHT: Stardew Character Portrait Box */}
                  <div 
                    className="w-full sm:w-44 shrink-0 rounded p-2.5 flex flex-col items-center justify-between"
                    style={{
                      backgroundColor: '#874218',
                      border: '3px solid #54280b',
                    }}
                  >
                    {/* Portrait Inner Frame */}
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded flex items-center justify-center overflow-hidden relative shadow-inner p-1"
                      style={{
                        backgroundColor: '#fadca2',
                        border: '4px solid #5a280b',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <img
                        src={dialogStage === 'sayang' ? '/assets/OwnAssets/qeebos/blush.png' : '/assets/OwnAssets/qeebos/normal.png'}
                        alt="Qeebos Portrait"
                        className="w-full h-full object-contain image-pixelated pointer-events-none select-none"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/OwnAssets/qeebos/normal.png';
                        }}
                      />
                    </div>

                    {/* Stardew Nameplate Banner */}
                    <div 
                      className="w-full mt-2.5 py-1 px-2 text-center rounded shadow-sm"
                      style={{
                        backgroundColor: '#fae4bb',
                        border: '2px solid #5a280b',
                      }}
                    >
                      <div className="font-serif font-black text-sm sm:text-base tracking-wider text-[#3d1e08]">
                        Qeebos
                      </div>
                      <div className="text-[10px] text-[#733814] font-semibold">
                        Scroll Prompt Master
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              B. FULL FORM MODAL (Separate Brainstorming & MCP Server)
             ======================================================== */}
          {dialogStage === 'form' && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
              <div className="w-full max-w-3xl max-h-[90vh] pixel-panel-wood text-amber-100 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-3.5 bg-[#2d1506] border-b-2 border-[#5a3012] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 pixel-box-inset flex items-center justify-center bg-[#1a0a03] border border-amber-600/50">
                      <img
                        src="/assets/OwnAssets/qeebos/normal.png"
                        alt="Qeebos"
                        className="w-7 h-7 object-contain image-pixelated"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/OwnAssets/qeebos/qeebos.png';
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="font-black text-sm text-amber-300 flex items-center gap-2">
                        <span>Qeebos</span>
                        <span className="text-[10px] pixel-btn-gold text-amber-950 px-1.5 py-0.2 pointer-events-none">
                          Scroll Prompt Generator
                        </span>
                      </h2>
                      <p className="text-[11px] text-amber-200/80">
                        {activeTab === 'brainstorm' 
                          ? 'Scroll 1: Brainstorming Ide Game (Konsep, Loop, & MVP)' 
                          : 'Scroll 2: MCP Server & Koneksi Supabase Database'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseAll}
                    className="pixel-btn-wood p-1.5 text-xs"
                    title="Tutup (Esc)"
                  >
                    <img
                      src="/assets/fantasy_pixelart_ui/icons/gold_cross.png"
                      alt="Close"
                      className="w-4 h-4 image-pixelated"
                    />
                  </button>
                </div>

                {/* Primary Category Tabs: Strictly Separated */}
                <div className="flex items-center gap-2 p-2 bg-[#200e04] border-b border-[#5a3012] text-xs">
                  <button
                    onClick={() => {
                      setValidationError('');
                      setActiveTab('brainstorm');
                    }}
                    className={`flex-1 py-2 px-3 font-bold flex items-center justify-center gap-2 transition-all ${
                      activeTab === 'brainstorm' 
                        ? 'pixel-btn-gold text-amber-950 shadow-md ring-1 ring-amber-300' 
                        : 'pixel-btn-wood text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Scroll 1: Brainstorming Ide Game</span>
                    {isBrainstormValid && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      setValidationError('');
                      setActiveTab('mcp');
                    }}
                    className={`flex-1 py-2 px-3 font-bold flex items-center justify-center gap-2 transition-all ${
                      activeTab === 'mcp' 
                        ? 'pixel-btn-gold text-amber-950 shadow-md ring-1 ring-amber-300' 
                        : 'pixel-btn-wood text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Scroll 2: MCP Server & Supabase</span>
                    {isMcpValid && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Validation Banner if Error */}
                {validationError && (
                  <div className="bg-red-950/90 border-b border-red-700 px-4 py-2 text-xs text-red-200 flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-semibold">{validationError}</span>
                  </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 p-4 overflow-y-auto bg-[#170802]/90 space-y-4 text-xs">
                  {/* ========================================================
                      TAB 1: BRAINSTORMING GAME (Completely Independent)
                     ======================================================== */}
                  {activeTab === 'brainstorm' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      {/* Sub-navigation: Form vs Preview */}
                      <div className="flex items-center justify-between border-b border-[#3d1d07] pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBrainstormView('form')}
                            className={`px-3 py-1 text-xs font-bold rounded ${
                              brainstormView === 'form' 
                                ? 'bg-[#733814] text-amber-200 border border-[#b87c42]' 
                                : 'text-amber-400/80 hover:text-amber-200'
                            }`}
                          >
                            Input Form Brainstorming
                          </button>
                          <button
                            onClick={() => {
                              if (!isBrainstormValid) {
                                setValidationError('Lengkapi data ide game di bawah terlebih dahulu!');
                                return;
                              }
                              setValidationError('');
                              setBrainstormView('preview');
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${
                              brainstormView === 'preview' 
                                ? 'bg-[#733814] text-amber-200 border border-[#b87c42]' 
                                : 'text-amber-400/80 hover:text-amber-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Preview Prompt Brainstorming</span>
                          </button>
                        </div>

                        {brainstormView === 'form' && isBrainstormValid && (
                          <button
                            onClick={() => {
                              setValidationError('');
                              setBrainstormView('preview');
                            }}
                            className="pixel-btn-gold text-[10px] px-2.5 py-1 font-bold flex items-center gap-1"
                          >
                            <span>Lihat Prompt</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* View 1: Form Input */}
                      {brainstormView === 'form' && (
                        <div className="space-y-3">
                          <div className="pixel-box-inset p-3 bg-[#241105] text-[11px] text-amber-200/90 leading-relaxed flex items-center justify-between">
                            <div>
                              <strong>Scroll Brainstorming:</strong> Fokus pada konsep game, gameplay loop, dan fitur MVP. Prompt ini <strong>bebas dari kode dan setup database</strong>.
                            </div>
                            <span className="text-[10px] text-amber-400/70 font-mono shrink-0 ml-2">
                              * = Wajib
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                1. Nama Game <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.gameName}
                                onChange={(e) => handleChange('gameName', e.target.value)}
                                placeholder="Contoh: Medival Dungeon Runner"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.gameName.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                2. Genre Game <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.genre}
                                onChange={(e) => handleChange('genre', e.target.value)}
                                placeholder="Contoh: 2D Pixel Action RPG / Puzzle"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.genre.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                3. Deskripsi Ide (2–3 Kalimat) <span className="text-red-400">*</span>
                              </label>
                              <textarea
                                rows={3}
                                value={formData.ideDescription}
                                onChange={(e) => handleChange('ideDescription', e.target.value)}
                                placeholder="Jelaskan inti gameplay, interaksi pemain, dan tujuan menang dalam 2-3 kalimat..."
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.ideDescription.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                4. Target Pemain <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.targetPlayer}
                                onChange={(e) => handleChange('targetPlayer', e.target.value)}
                                placeholder="Contoh: Siswa SMK / Gamer Casual Web"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.targetPlayer.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                5. Gaya Game <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.gameStyle}
                                onChange={(e) => handleChange('gameStyle', e.target.value)}
                                placeholder="Contoh: PIXEL ART / CARTOON / RETRO"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.gameStyle.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                6. Target Waktu Pembuatan <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.targetDuration}
                                onChange={(e) => handleChange('targetDuration', e.target.value)}
                                placeholder="Contoh: 3 Hari / 1 Minggu"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.targetDuration.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                7. Tingkat Developer
                              </label>
                              <div className="pixel-box-inset px-3 py-2 text-xs text-amber-300 font-bold bg-[#1a0a03]">
                                PEMULA (Otomatis)
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-between items-center">
                            <span className="text-[10px] text-amber-400/70">
                              {isBrainstormValid ? '✓ Semua kolom terisi siap salin' : 'Isi semua kolom untuk membuat prompt'}
                            </span>
                            <button
                              onClick={() => {
                                if (!isBrainstormValid) {
                                  setValidationError('Semua kolom ide game wajib diisi terlebih dahulu!');
                                  return;
                                }
                                setValidationError('');
                                setBrainstormView('preview');
                              }}
                              className="pixel-btn-gold px-4 py-2 font-bold flex items-center gap-1.5"
                            >
                              <span>Lihat & Salin Prompt Brainstorming</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* View 2: Prompt Preview */}
                      {brainstormView === 'preview' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-[#5a3012] pb-1.5">
                            <div>
                              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Prompt Brainstorming Siap Digunakan!</span>
                              </h4>
                              <p className="text-[10px] text-amber-200/70">
                                Berikan prompt ini ke AI Agent untuk merumuskan konsep game secara terarah.
                              </p>
                            </div>
                            <button
                              onClick={handleCopyBrainstorm}
                              className="pixel-btn-gold px-3.5 py-1.5 font-bold text-xs flex items-center gap-1.5 shadow-lg"
                            >
                              {copiedType === 'brainstorm' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Code Block for Brainstorming */}
                          <div className="pixel-box-inset p-3 max-h-[340px] overflow-y-auto font-mono text-[10.5px] text-amber-100/90 leading-relaxed whitespace-pre-wrap select-text bg-[#120501]">
                            {generateBrainstormPrompt()}
                          </div>

                          <div className="pt-1 flex justify-between items-center">
                            <button
                              onClick={() => setBrainstormView('form')}
                              className="pixel-btn-wood px-3 py-1.5 text-xs"
                            >
                              Edit Input Ide Game
                            </button>
                            <button
                              onClick={handleCopyBrainstorm}
                              className="pixel-btn-gold px-5 py-2 font-bold text-xs flex items-center gap-2 shadow-xl"
                            >
                              {copiedType === 'brainstorm' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedType === 'brainstorm' ? 'Berhasil Disalin ke Clipboard!' : 'Salin Prompt Brainstorming'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================
                      TAB 2: MCP SERVER & SUPABASE SETUP (Completely Independent)
                     ======================================================== */}
                  {activeTab === 'mcp' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      {/* Sub-navigation: Form vs Preview */}
                      <div className="flex items-center justify-between border-b border-[#3d1d07] pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMcpView('form')}
                            className={`px-3 py-1 text-xs font-bold rounded ${
                              mcpView === 'form' 
                                ? 'bg-[#733814] text-amber-200 border border-[#b87c42]' 
                                : 'text-amber-400/80 hover:text-amber-200'
                            }`}
                          >
                            Input Data Supabase
                          </button>
                          <button
                            onClick={() => {
                              if (!isMcpValid) {
                                setValidationError('Lengkapi data Supabase di bawah terlebih dahulu!');
                                return;
                              }
                              setValidationError('');
                              setMcpView('preview');
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${
                              mcpView === 'preview' 
                                ? 'bg-[#733814] text-amber-200 border border-[#b87c42]' 
                                : 'text-amber-400/80 hover:text-amber-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Preview Prompt MCP Server</span>
                          </button>
                        </div>

                        {mcpView === 'form' && isMcpValid && (
                          <button
                            onClick={() => {
                              setValidationError('');
                              setMcpView('preview');
                            }}
                            className="pixel-btn-gold text-[10px] px-2.5 py-1 font-bold flex items-center gap-1"
                          >
                            <span>Lihat Prompt</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* View 1: Form Input */}
                      {mcpView === 'form' && (
                        <div className="space-y-3">
                          <div className="pixel-box-inset p-3 bg-[#1d1007] text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                            <div>
                              <strong>Scroll MCP Server:</strong> Konfigurasi koneksi proyek ke Supabase dan MCP Server. Prompt ini <strong>khusus untuk integrasi teknis</strong>.
                            </div>
                            <p className="text-amber-400/80">
                              Dapatkan dari Dashboard Supabase: <em>Project Settings → General (Ref ID) & API (URL + anon key)</em>.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                1. Nama Project Supabase <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.supabaseProjectName}
                                onChange={(e) => handleChange('supabaseProjectName', e.target.value)}
                                placeholder="Contoh: My Pixel Game"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 ${
                                  validationError && !formData.supabaseProjectName.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                2. Project Reference ID <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.supabaseRefId}
                                onChange={(e) => handleChange('supabaseRefId', e.target.value)}
                                placeholder="Contoh: wxyzkabcxyz123"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 font-mono ${
                                  validationError && !formData.supabaseRefId.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                3. Project URL Supabase <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.supabaseUrl}
                                onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                                placeholder="Contoh: https://wxyzkabcxyz123.supabase.co"
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 font-mono ${
                                  validationError && !formData.supabaseUrl.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                4. Publishable Key (Anon Key) <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.supabaseAnonKey}
                                onChange={(e) => handleChange('supabaseAnonKey', e.target.value)}
                                placeholder="Contoh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                required
                                className={`w-full pixel-box-inset px-3 py-2 text-xs text-amber-100 placeholder-amber-700/60 focus:outline-none focus:border-amber-400 font-mono ${
                                  validationError && !formData.supabaseAnonKey.trim() ? 'border-red-500 bg-red-950/30' : ''
                                }`}
                              />
                              <span className="text-[10px] text-amber-400/70 mt-1 block">
                                * Gunakan publishable/anon key saja. Jangan gunakan service_role key.
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-between items-center">
                            <span className="text-[10px] text-amber-400/70">
                              {isMcpValid ? '✓ Semua data Supabase terisi' : 'Isi semua data Supabase untuk membuat prompt'}
                            </span>
                            <button
                              onClick={() => {
                                if (!isMcpValid) {
                                  setValidationError('Semua kolom Supabase & MCP wajib diisi terlebih dahulu!');
                                  return;
                                }
                                setValidationError('');
                                setMcpView('preview');
                              }}
                              className="pixel-btn-gold px-4 py-2 font-bold flex items-center gap-1.5"
                            >
                              <span>Lihat & Salin Prompt MCP Server</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* View 2: Prompt Preview */}
                      {mcpView === 'preview' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-[#5a3012] pb-1.5">
                            <div>
                              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Prompt MCP Server & Supabase Siap Digunakan!</span>
                              </h4>
                              <p className="text-[10px] text-amber-200/70">
                                Berikan prompt ini ke AI Agent untuk mengonfigurasi koneksi Supabase MCP dan client Next.js.
                              </p>
                            </div>
                            <button
                              onClick={handleCopyMcp}
                              className="pixel-btn-gold px-3.5 py-1.5 font-bold text-xs flex items-center gap-1.5 shadow-lg"
                            >
                              {copiedType === 'mcp' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt MCP</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Code Block for MCP Server */}
                          <div className="pixel-box-inset p-3 max-h-[340px] overflow-y-auto font-mono text-[10.5px] text-amber-100/90 leading-relaxed whitespace-pre-wrap select-text bg-[#120501]">
                            {generateMcpPrompt()}
                          </div>

                          <div className="pt-1 flex justify-between items-center">
                            <button
                              onClick={() => setMcpView('form')}
                              className="pixel-btn-wood px-3 py-1.5 text-xs"
                            >
                              Edit Data Supabase
                            </button>
                            <button
                              onClick={handleCopyMcp}
                              className="pixel-btn-gold px-5 py-2 font-bold text-xs flex items-center gap-2 shadow-xl"
                            >
                              {copiedType === 'mcp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedType === 'mcp' ? 'Berhasil Disalin ke Clipboard!' : 'Salin Prompt MCP Server'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}

export default React.memo(QeebosNPC, (prev, next) => {
  const wasNear = prev.localPlayer && Math.hypot(prev.localPlayer.x - prev.x, prev.localPlayer.y - prev.y) <= 130;
  const isNear = next.localPlayer && Math.hypot(next.localPlayer.x - next.x, next.localPlayer.y - next.y) <= 130;
  if (wasNear !== isNear) return false;
  if (prev.isTracked !== next.isTracked) return false;
  if (prev.x !== next.x || prev.y !== next.y) return false;
  if (prev.onOpenChange !== next.onOpenChange) return false;
  return true;
});
