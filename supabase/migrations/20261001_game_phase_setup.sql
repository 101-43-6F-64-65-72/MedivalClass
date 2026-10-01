-- ====================================================================
-- SUPABASE MIGRATION: Game Phase, Story Progression & Master Prompt
-- Date: 2026-10-01
-- Best Practices: Uses TIMESTAMPTZ, indexes on foreign keys, RLS enabled
-- ====================================================================

-- 1. GAME SESSIONS TABLE
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL UNIQUE,
  admin_id TEXT NOT NULL,
  players JSONB DEFAULT '[]'::jsonb,
  game_phase TEXT DEFAULT 'waiting',
  story_phase TEXT,
  player_roles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- 2. MASTER PROMPTS TABLE
CREATE TABLE IF NOT EXISTS master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT, -- Can store room_id or session UUID
  game_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  target_user TEXT NOT NULL,
  game_goal TEXT NOT NULL,
  core_gameplay TEXT NOT NULL,
  target_duration TEXT NOT NULL,
  dev_level TEXT NOT NULL,
  device_condition TEXT NOT NULL,
  full_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_master_prompts_session_id ON master_prompts(session_id);

-- 3. ROOM LAYOUTS TABLE
CREATE TABLE IF NOT EXISTS room_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL UNIQUE,
  layout_data JSONB NOT NULL,
  tileset_name TEXT DEFAULT 'RPG Maker MZ (48x48)',
  width INT DEFAULT 20,
  height INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'manual' -- 'manual' or 'ai'
);

CREATE INDEX IF NOT EXISTS idx_room_layouts_room_id ON room_layouts(room_id);

-- 4. STORY PROGRESS TABLE
CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  scene_number INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_progress_session_id ON story_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_player_id ON story_progress(player_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for classroom/multiplayer anonymous access
-- ====================================================================

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

-- Policies for game_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Allow all to read game_sessions') THEN
    CREATE POLICY "Allow all to read game_sessions" ON game_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Allow all to insert game_sessions') THEN
    CREATE POLICY "Allow all to insert game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Allow all to update game_sessions') THEN
    CREATE POLICY "Allow all to update game_sessions" ON game_sessions FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for master_prompts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_prompts' AND policyname = 'Allow all to read master_prompts') THEN
    CREATE POLICY "Allow all to read master_prompts" ON master_prompts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'master_prompts' AND policyname = 'Allow all to insert master_prompts') THEN
    CREATE POLICY "Allow all to insert master_prompts" ON master_prompts FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Policies for room_layouts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_layouts' AND policyname = 'Allow all to read room_layouts') THEN
    CREATE POLICY "Allow all to read room_layouts" ON room_layouts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_layouts' AND policyname = 'Allow all to insert room_layouts') THEN
    CREATE POLICY "Allow all to insert room_layouts" ON room_layouts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_layouts' AND policyname = 'Allow all to update room_layouts') THEN
    CREATE POLICY "Allow all to update room_layouts" ON room_layouts FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for story_progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_progress' AND policyname = 'Allow all to read story_progress') THEN
    CREATE POLICY "Allow all to read story_progress" ON story_progress FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_progress' AND policyname = 'Allow all to insert story_progress') THEN
    CREATE POLICY "Allow all to insert story_progress" ON story_progress FOR INSERT WITH CHECK (true);
  END IF;
END $$;
