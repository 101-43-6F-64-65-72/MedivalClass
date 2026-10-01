# 📊 Laporan Progres & Status Proyek: MedivalClass (Multiplayer Virtual Room)

**Repository:** `https://github.com/101-43-6F-64-65-72/MedivalClass.git`  
**Tech Stack:** Next.js 16 (App Router), React 19, Supabase Realtime, Tailwind CSS v4, Lucide React  
**Tanggal Update:** 1 Oktober 2026  

---

## 📌 Ringkasan Proyek
**MedivalClass** adalah aplikasi *Virtual Room 2D* real-time berbasis Web (Next.js) dengan perspektif top-down / 3/4 view. Fitur utama mencakup pergerakan karakter multiplayer secara synchronous, objek interaktif di dalam kelas/ruangan, layar presentasi interaktif, dan integrasi modul chatbot / NPC.

---

## 🛠️ Fitur & Arsitektur Saat Ini (Kondisi Eksisting)

### 1. **Core & Real-time Engine**
- **Supabase Realtime Synchronization** ([`useMultiplayer.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/hooks/useMultiplayer.js)):
  - Melacak pergerakan pemain (koordinat `x`, `y`, arah/direction `animState`, `color`, dan `username`).
  - Penanganan heartbeat & penanganan pemain *disconnect/leave*.
- **Player Controls & Movement** ([`usePlayerControls.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/hooks/usePlayerControls.js)):
  - Kontrol keyboard (WASD / Arrow Keys).
  - Smooth animation interpolasi dan penanganan tab browser kehilangan fokus.

### 2. **Dunia Virtual & Physics**
- **Sistem Peta & Objek** ([`constants.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/lib/constants.js), [`VirtualRoom.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/components/room/VirtualRoom.js)):
  - Ukuran ruangan terdefinisi (`ROOM_WIDTH`, `ROOM_HEIGHT`).
  - Rendering sprite aset dekoratif (meja, kursi, papan tulis, tanaman, rak buku).
- **Collision Detection System** ([`collision.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/lib/collision.js)):
  - Deteksi tabrakan AABB (Axis-Aligned Bounding Box) untuk mencegah pemain menembus dinding dan objek.

### 3. **Interaktivitas Tambahan**
- **Presentation Screen** ([`PresentationScreen.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/components/room/PresentationScreen.js), [`usePresentation.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/hooks/usePresentation.js)):
  - Fitur layar presentasi interaktif yang disinkronkan untuk semua pengguna dalam ruang.
- **AI Chatbot Context Management System** *(Baru Ditambahkan)*:
  - **Hook Pengelola Konteks** ([`useChatbotContext.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/hooks/useChatbotContext.js)): Mengatur memori percakapan (`system prompt`, riwayat user/assistant, serta batas `maxHistory`).
  - **API Route** ([`route.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/app/api/chat/route.js)): Endpoint Next.js untuk integrasi ke LLM (OpenAI API / Demo Mode).
  - **UI Widget** ([`ChatbotWidget.js`](file:///z:/AJARPELATIHAN/multiplayer-game/src/components/room/ChatbotWidget.js)): Komponen widget obrolan terapung di pojok kanan bawah.

---

## 📈 Status Implementasi Modul

| Modul / Fitur | Status | Catatan |
| :--- | :---: | :--- |
| **Form Absensi, In-Game Lobby & Join via Kode Team (Phase 1)** | ✅ Selesai | Form absensi siswa, In-Game Lobby (Buat Kode Team 6-karakter acak vs Join Kode Team), Supabase Channel `room:${roomCode}`, & Limit 4/4 player real-time dengan tombol Salin Kode Team |
| **Admin Secret Code, Waiting Lobby, Game Start & NPC Story (Phase 2 Revisi)** | ✅ Selesai | Role Admin via no absen secret `99499`, Waiting Lobby (Admin punya tombol Start Game, Player menunggu), Broadcast sync `gameStart`, Auto-open Chatbot Widget saat game dimulai, Form Master Prompt 8 parameter, & render sprite RPG Maker MZ 48x48 dengan badge [ADMIN] |
| **Koneksi Supabase Realtime** | ✅ Selesai | Menggunakan channel presence/broadcast |
| **Movement & Collision 2D** | ✅ Selesai | Smooth AABB collision |
| **Kamera Dynamic POV** | ✅ Selesai | Kamera mengikuti pemain lokal |
| **Layar Presentasi Kelas** | ✅ Selesai | Sinkronisasi slide presentation |
| **Context Management Chatbot** | ✅ Selesai | Siap diintegrasikan ke halaman utama |
| **Database Persistence (Postgres)** | ⏳ Dalam Perencanaan | RLS & penyimpanan room/user ke Supabase DB |
| **Voice / Proximity Audio Chat** | 💡 Ide Masa Depan | Menggunakan WebRTC / LiveKit |

---

## 🚀 Panduan Menjalankan Proyek

1. **Jalankan Server Lokal**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui `http://localhost:3000`.

2. **Konfigurasi Environment Variable** ([`.env.local`](file:///z:/AJARPELATIHAN/multiplayer-game/.env.local)):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<URL_SUPABASE_ANDA>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY_SUPABASE_ANDA>
   OPENAI_API_KEY=<OPTIONAL_OPENAI_KEY>
   ```

---

## 📂 Struktur Direktori Utama

```
multiplayer-game/
├── src/
│   ├── app/
│   │   ├── api/chat/route.js        # API Handler Chatbot AI
│   │   ├── page.js                  # Halaman Utama (Login & Room Entry)
│   │   └── globals.css              # Style Utama (Tailwind v4)
│   ├── components/room/
│   │   ├── VirtualRoom.js           # Container Utama Ruangan Virtual & Kamera
│   │   ├── Player.js                # Rendering Sprite Karakter
│   │   ├── GameObject.js            # Rendering Objek Interaktif
│   │   ├── PresentationScreen.js    # Layar Presentasi Di Dalam Room
│   │   └── ChatbotWidget.js         # UI Chatbot & Context Display
│   ├── hooks/
│   │   ├── useMultiplayer.js        # Hook Sinkronisasi Realtime
│   │   ├── usePlayerControls.js     # Hook Kontrol Keyboard
│   │   └── useChatbotContext.js     # Hook Manajemen Konteks Chatbot
│   └── lib/
│       ├── collision.js             # Logic Deteksi Tabrakan
│       ├── constants.js             # Peta Objek & Dimensi Room
│       └── supabaseClient.js        # Client Supabase
├── PROJECT_STATUS.md                # Laporan Progres Ini
└── package.json
```
