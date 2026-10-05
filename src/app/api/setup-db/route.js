import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This route creates the required tables for the server/group system.
// Access it once at /api/setup-db (admin only).
// Uses service_role key stored server-side only.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function POST(req) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const steps = [];

  // 1. virtual_servers table
  try {
    await client.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.virtual_servers (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name         TEXT NOT NULL,
          description  TEXT DEFAULT '',
          mode         TEXT NOT NULL DEFAULT 'class',
          active_class TEXT DEFAULT NULL,
          is_active    BOOLEAN NOT NULL DEFAULT true,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE public.virtual_servers ENABLE ROW LEVEL SECURITY;
      `
    });
    steps.push({ table: 'virtual_servers', status: 'ok' });
  } catch (e) {
    steps.push({ table: 'virtual_servers', status: 'error', error: e.message });
  }

  // 2. group_sessions table
  try {
    await client.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.group_sessions (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          server_id   UUID NOT NULL REFERENCES public.virtual_servers(id) ON DELETE CASCADE,
          slot        INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 9),
          room_code   TEXT NOT NULL,
          room_name   TEXT NOT NULL,
          owner_id    TEXT NOT NULL,
          owner_name  TEXT NOT NULL DEFAULT '',
          is_active   BOOLEAN NOT NULL DEFAULT true,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (server_id, slot)
        );
        ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
      `
    });
    steps.push({ table: 'group_sessions', status: 'ok' });
  } catch (e) {
    steps.push({ table: 'group_sessions', status: 'error', error: e.message });
  }

  // 3. group_members table
  try {
    await client.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.group_members (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id      UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
          player_id       TEXT NOT NULL,
          full_name       TEXT NOT NULL DEFAULT '',
          username        TEXT NOT NULL DEFAULT '',
          attendance_no   TEXT DEFAULT '',
          student_class   TEXT DEFAULT '',
          character_index INTEGER DEFAULT 1,
          status          TEXT NOT NULL DEFAULT 'pending',
          joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (session_id, player_id)
        );
        ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
      `
    });
    steps.push({ table: 'group_members', status: 'ok' });
  } catch (e) {
    steps.push({ table: 'group_members', status: 'error', error: e.message });
  }

  return NextResponse.json({ message: 'Setup complete', steps });
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run DB setup',
    instructions: 'Run the SQL in supabase/migrations/20261005_servers_and_groups.sql via Supabase Dashboard > SQL Editor'
  });
}
