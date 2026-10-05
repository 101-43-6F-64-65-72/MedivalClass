-- =============================================
-- Migration: Tambah Kolom PIN ke virtual_servers
-- Jalankan di Supabase Dashboard > SQL Editor jika diperlukan
-- =============================================

ALTER TABLE public.virtual_servers 
ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT NULL;

COMMENT ON COLUMN public.virtual_servers.pin IS 'PIN keamanan opsional untuk bergabung ke server (null = tanpa PIN / terbuka)';
