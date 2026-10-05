-- =============================================
-- SETUP: Virtual Servers & Group System
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Tanggal: 2026-10-05
-- =============================================

-- 1. TABEL: virtual_servers
-- Admin membuat server (namespace paralel per sesi/kelas)
CREATE TABLE IF NOT EXISTS public.virtual_servers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  mode         TEXT NOT NULL DEFAULT 'class',  -- 'class' atau 'free'
  active_class TEXT DEFAULT NULL,              -- aktif jika mode='class'
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_manage_virtual_servers" ON public.virtual_servers;
CREATE POLICY "anon_manage_virtual_servers"
  ON public.virtual_servers FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Default server (jika belum ada)
INSERT INTO public.virtual_servers (name, description, mode, active_class, is_active)
SELECT 'Server Utama', 'Server default untuk semua kelas', 'class', 'XI PPLG-B', true
WHERE NOT EXISTS (SELECT 1 FROM public.virtual_servers LIMIT 1);

-- 2. TABEL: group_sessions
-- Menyimpan kelompok yang sudah dibuat (persistent, tidak hilang saat refresh)
CREATE TABLE IF NOT EXISTS public.group_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id   UUID NOT NULL REFERENCES public.virtual_servers(id) ON DELETE CASCADE,
  slot        INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 9),
  room_code   TEXT NOT NULL,
  room_name   TEXT NOT NULL,
  owner_id    TEXT NOT NULL,    -- player_id dari owner (user pertama masuk)
  owner_name  TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (server_id, slot)
);

ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_manage_group_sessions" ON public.group_sessions;
CREATE POLICY "anon_manage_group_sessions"
  ON public.group_sessions FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- 3. TABEL: group_members
-- Menyimpan anggota kelompok dengan status (pending/approved/kicked)
CREATE TABLE IF NOT EXISTS public.group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  player_id       TEXT NOT NULL,       -- ID unik pemain (dari sessionStorage)
  full_name       TEXT NOT NULL DEFAULT '',
  username        TEXT NOT NULL DEFAULT '',
  attendance_no   TEXT DEFAULT '',
  student_class   TEXT DEFAULT '',
  character_index INTEGER DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'kicked'
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_manage_group_members" ON public.group_members;
CREATE POLICY "anon_manage_group_members"
  ON public.group_members FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- 4. INDEXES untuk performa
CREATE INDEX IF NOT EXISTS idx_group_sessions_server_slot ON public.group_sessions(server_id, slot);
CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON public.group_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_session ON public.group_members(session_id);
CREATE INDEX IF NOT EXISTS idx_group_members_player ON public.group_members(player_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);

-- Verifikasi
SELECT 'virtual_servers' AS tabel, COUNT(*) AS baris FROM public.virtual_servers
UNION ALL
SELECT 'group_sessions', COUNT(*) FROM public.group_sessions
UNION ALL
SELECT 'group_members', COUNT(*) FROM public.group_members;
