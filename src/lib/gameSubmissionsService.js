import { supabase } from '@/lib/supabaseClient';
import { classifyGameUrl } from './gameClassifier';

const LOCAL_STORAGE_KEY = 'virtual_classroom_game_submissions';

/**
 * Fetch all game submissions, optionally filtered by class.
 */
export async function getGameSubmissions(className = null) {
  let remoteData = [];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      let query = supabase
        .from('game_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (className) {
        query = query.eq('student_class', className);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        remoteData = data;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca game_submissions dari Supabase:', err);
  }

  // Read local cache backup & clean out any unwanted/invalid entries (e.g. roblox)
  let localData = [];
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently strip out roblox links from local cache
          const cleaned = parsed.filter(item => 
            !item.game_url?.toLowerCase().includes('roblox') &&
            !item.category?.toLowerCase().includes('roblox') &&
            !item.platform?.toLowerCase().includes('roblox')
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          }
          localData = className ? cleaned.filter(item => item.student_class === className) : cleaned;
        }
      }
    }
  } catch (e) {}

  // Merge unique items by id or game_url
  const map = new Map();
  remoteData.forEach(item => {
    // Exclude roblox
    if (
      !item.game_url?.toLowerCase().includes('roblox') &&
      !item.category?.toLowerCase().includes('roblox') &&
      !item.platform?.toLowerCase().includes('roblox')
    ) {
      map.set(item.id || item.game_url, item);
    }
  });

  localData.forEach(item => {
    const key = item.id || item.game_url;
    if (
      !map.has(key) &&
      !item.game_url?.toLowerCase().includes('roblox') &&
      !item.category?.toLowerCase().includes('roblox') &&
      !item.platform?.toLowerCase().includes('roblox')
    ) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
}

/**
 * Submit a student game link.
 * User only supplies the game URL.
 */
export async function submitGameLink({
  gameUrl,
  studentName,
  attendanceNo,
  studentClass,
  roomCode,
  roomName,
  groupMembers,
}) {
  const classification = classifyGameUrl(gameUrl);

  const payload = {
    student_name: studentName || 'Anonim',
    attendance_no: String(attendanceNo || ''),
    student_class: studentClass || 'XI PPLG-B',
    room_code: roomCode || '',
    room_name: roomName || 'Kelompok Belajar',
    group_members: Array.isArray(groupMembers) ? groupMembers.join(', ') : String(groupMembers || ''),
    game_url: classification.cleanUrl,
    category: classification.category,
    platform: classification.platform,
    created_at: new Date().toISOString(),
  };

  let insertedRecord = { ...payload, id: `sub-${Date.now()}` };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('game_submissions')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        insertedRecord = data;
      }
    }
  } catch (err) {
    console.warn('Gagal menyimpan ke Supabase:', err);
  }

  // Backup to localStorage
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : [];
      const updated = [insertedRecord, ...current.filter(item => item.game_url !== insertedRecord.game_url)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    }
  } catch (e) {}

  // Broadcast to shared universe channel so all active students see the bookshelf update in real time
  try {
    const channel = supabase.channel('classroom:shared_universe');
    channel.send({
      type: 'broadcast',
      event: 'game-submitted',
      payload: insertedRecord,
    });
  } catch (e) {}

  return insertedRecord;
}
