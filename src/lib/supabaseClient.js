import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
}) : { 
  channel: () => {
    const dummyChannel = {
      on: () => dummyChannel,
      subscribe: () => dummyChannel,
      track: () => Promise.resolve(),
      send: () => Promise.resolve()
    };
    return dummyChannel;
  },
  removeChannel: () => {}
};
