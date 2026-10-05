// serverService.js
// Service untuk mengelola Virtual Servers, Group Sessions, dan Group Members

import { supabase } from './supabaseClient';

// ─── VIRTUAL SERVERS ───────────────────────────────────────────────────────

export async function fetchActiveServers() {
  try {
    const { data, error } = await supabase
      .from('virtual_servers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[serverService] fetchActiveServers error:', err);
    return [];
  }
}

export async function fetchAllServers() {
  try {
    const { data, error } = await supabase
      .from('virtual_servers')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[serverService] fetchAllServers error:', err);
    return [];
  }
}

export async function createServer({ name, description = '', mode = 'class', active_class = null, pin = null }) {
  try {
    const payload = {
      name,
      description,
      mode,
      active_class,
      is_active: true,
      pin: pin ? String(pin).trim() : null,
    };
    const { data, error } = await supabase
      .from('virtual_servers')
      .insert([payload])
      .select()
      .single();
    if (error) {
      // Jika kolom 'pin' belum ada di skema database, fallback tanpa kolom pin
      if (error.message?.includes('pin') || error.code === '42703') {
        const { pin: _p, ...fallbackPayload } = payload;
        const fallback = await supabase.from('virtual_servers').insert([fallbackPayload]).select().single();
        if (fallback.error) throw fallback.error;
        return { ok: true, server: fallback.data };
      }
      throw error;
    }
    return { ok: true, server: data };
  } catch (err) {
    console.warn('[serverService] createServer error:', err);
    return { ok: false, error: err.message };
  }
}

export async function updateServer(id, updates) {
  try {
    const { data, error } = await supabase
      .from('virtual_servers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.message?.includes('pin') || error.code === '42703') {
        const { pin: _p, ...fallbackUpdates } = updates;
        const fallback = await supabase
          .from('virtual_servers')
          .update({ ...fallbackUpdates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (fallback.error) throw fallback.error;
        return { ok: true, server: fallback.data };
      }
      throw error;
    }
    return { ok: true, server: data };
  } catch (err) {
    console.warn('[serverService] updateServer error:', err);
    return { ok: false, error: err.message };
  }
}

export async function deleteServer(id) {
  try {
    const { error } = await supabase
      .from('virtual_servers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('[serverService] deleteServer error:', err);
    return { ok: false, error: err.message };
  }
}

// ─── GROUP SESSIONS ────────────────────────────────────────────────────────

export async function fetchGroupSessions(serverId) {
  try {
    const { data, error } = await supabase
      .from('group_sessions')
      .select('*, group_members(*)')
      .eq('server_id', serverId)
      .eq('is_active', true)
      .order('slot', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[serverService] fetchGroupSessions error:', err);
    return [];
  }
}

export async function upsertGroupSession({ serverId, slot, roomCode, roomName, ownerId, ownerName }) {
  try {
    const { data, error } = await supabase
      .from('group_sessions')
      .upsert(
        {
          server_id: serverId,
          slot,
          room_code: roomCode,
          room_name: roomName,
          owner_id: ownerId,
          owner_name: ownerName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'server_id,slot' }
      )
      .select()
      .single();
    if (error) throw error;
    return { ok: true, session: data };
  } catch (err) {
    console.warn('[serverService] upsertGroupSession error:', err);
    return { ok: false, error: err.message };
  }
}

export async function updateGroupSession(sessionId, updates) {
  try {
    const { data, error } = await supabase
      .from('group_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return { ok: true, session: data };
  } catch (err) {
    console.warn('[serverService] updateGroupSession error:', err);
    return { ok: false, error: err.message };
  }
}

export async function deleteGroupSession(sessionId) {
  try {
    // Delete members then delete the session so the slot is completely clean and freed
    await supabase.from('group_members').delete().eq('session_id', sessionId);
    const { error } = await supabase
      .from('group_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('[serverService] deleteGroupSession error:', err);
    return { ok: false, error: err.message };
  }
}

export async function fetchAllGroupSessions(serverId = null) {
  try {
    let query = supabase
      .from('group_sessions')
      .select('*, group_members(*)')
      .order('slot', { ascending: true });
    if (serverId) {
      query = query.eq('server_id', serverId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[serverService] fetchAllGroupSessions error:', err);
    return [];
  }
}

// ─── GROUP MEMBERS ─────────────────────────────────────────────────────────

export async function upsertGroupMember({
  sessionId,
  playerId,
  fullName,
  username,
  attendanceNo = '',
  studentClass = '',
  characterIndex = 1,
  status = 'pending',
}) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .upsert(
        {
          session_id: sessionId,
          player_id: playerId,
          full_name: fullName,
          username,
          attendance_no: attendanceNo,
          student_class: studentClass,
          character_index: characterIndex,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,player_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return { ok: true, member: data };
  } catch (err) {
    console.warn('[serverService] upsertGroupMember error:', err);
    return { ok: false, error: err.message };
  }
}

export async function updateMemberStatus(sessionId, playerId, status) {
  try {
    const { error } = await supabase
      .from('group_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('player_id', playerId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('[serverService] updateMemberStatus error:', err);
    return { ok: false, error: err.message };
  }
}

export async function removeMemberFromSession(sessionId, playerId) {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('session_id', sessionId)
      .eq('player_id', playerId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('[serverService] removeMemberFromSession error:', err);
    return { ok: false, error: err.message };
  }
}

export async function fetchApprovedMembers(sessionId) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchPendingMembers(sessionId) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

export async function getOrCreateGroupSession({ serverId, slot, roomCode, roomName, ownerId, ownerName }) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('server_id', serverId)
      .eq('slot', slot)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      return { session: existing, isNew: false };
    }

    const result = await upsertGroupSession({ serverId, slot, roomCode, roomName, ownerId, ownerName });
    if (!result.ok) throw new Error(result.error);
    return { session: result.session, isNew: true };
  } catch (err) {
    console.warn('[serverService] getOrCreateGroupSession error:', err);
    return null;
  }
}
