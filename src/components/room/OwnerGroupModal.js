'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { updateMemberStatus, removeMemberFromSession } from '@/lib/serverService';
import { X, Users, UserPlus, Check, UserX, Shield, RefreshCw } from 'lucide-react';

export default function OwnerGroupModal({
  isOpen,
  onClose,
  sessionId,
  roomCode,
  roomName,
  groupNumber,
  myPlayerId,
  myFullName,
  sendBroadcast,
}) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'members'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      const all = data || [];
      setPendingRequests(all.filter((m) => m.status === 'pending'));
      setApprovedMembers(all.filter((m) => m.status === 'approved'));
    } catch (err) {
      console.warn('[OwnerGroupModal] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId, loadData]);

  if (!isOpen) return null;

  const handleApprove = async (req) => {
    setActionLoadingId(req.player_id);
    try {
      await updateMemberStatus(sessionId, req.player_id, 'approved');
      if (typeof sendBroadcast === 'function') {
        sendBroadcast('join-room-response', {
          targetPlayerId: req.player_id,
          status: 'ACCEPTED',
          roomCode,
          roomName,
          sessionId,
          hostName: myFullName,
        });
      }
      await loadData();
    } catch (err) {
      console.warn('Gagal approve member:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req) => {
    setActionLoadingId(req.player_id);
    try {
      await updateMemberStatus(sessionId, req.player_id, 'kicked');
      if (typeof sendBroadcast === 'function') {
        sendBroadcast('join-room-response', {
          targetPlayerId: req.player_id,
          status: 'REJECTED',
          reason: 'Permintaan bergabung ditolak oleh ketua kelompok.',
        });
      }
      await loadData();
    } catch (err) {
      console.warn('Gagal reject member:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleKick = async (member) => {
    if (!confirm(`Keluarkan ${member.full_name || member.username} dari kelompok?`)) return;
    setActionLoadingId(member.player_id);
    try {
      await removeMemberFromSession(sessionId, member.player_id);
      if (typeof sendBroadcast === 'function') {
        sendBroadcast('member-kicked', {
          kickedPlayerId: member.player_id,
          roomCode,
          kickedBy: myFullName,
        });
      }
      await loadData();
    } catch (err) {
      console.warn('Gagal kick member:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-w-lg pixel-panel-wood p-4 sm:p-5 relative select-none text-amber-100 space-y-3.5 max-h-[90vh] flex flex-col overflow-hidden font-pixel pixel-shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5c3416] pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-950/80 border border-amber-500/60 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-200 uppercase tracking-wider">
                Kelola Kelompok (Owner)
              </h2>
              <p className="text-[10px] text-amber-400/80">
                {roomName || `Kelompok ${groupNumber || ''}`} | Kode: <strong className="font-mono text-amber-300">{roomCode}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn-silver p-1 text-amber-300 hover:text-white"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'requests'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'pixel-btn-silver text-amber-200/80'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Permintaan Masuk</span>
            {pendingRequests.length > 0 && (
              <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'members'
                ? 'pixel-btn-gold text-amber-950 font-black'
                : 'pixel-btn-silver text-amber-200/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Anggota Kelompok ({approvedMembers.length}/4)</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="pixel-btn-wood p-2 text-amber-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pixel-scrollbar">
          {/* TAB 1: PERMINTAAN MASUK */}
          {activeTab === 'requests' && (
            <div className="space-y-2">
              {pendingRequests.length === 0 ? (
                <div className="pixel-box-inset p-6 text-center space-y-1">
                  <p className="text-xs text-amber-400 font-bold">Tidak ada permintaan bergabung.</p>
                  <p className="text-[10px] text-amber-500/70">
                    Siswa lain yang ingin masuk ke kelompok ini akan muncul di sini untuk Anda setujui.
                  </p>
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id || req.player_id}
                    className="pixel-box-inset p-3 flex items-center justify-between gap-3 bg-[#140802]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-200 truncate">
                          {req.full_name || req.username}
                        </span>
                        {req.attendance_no && (
                          <span className="text-[10px] font-mono text-amber-400 px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800/50">
                            #{req.attendance_no}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-500 font-mono mt-0.5">
                        {req.student_class || 'Siswa'} | ID: {req.player_id?.substring(0, 10)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={actionLoadingId === req.player_id}
                        className="pixel-btn-gold py-1 px-2.5 text-[10px] font-bold uppercase flex items-center gap-1"
                        title="Setujui Masuk Kelompok"
                      >
                        <Check className="w-3 h-3" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={actionLoadingId === req.player_id}
                        className="pixel-btn-wood text-red-300 hover:text-red-100 py-1 px-2 text-[10px] font-bold uppercase flex items-center gap-1"
                        title="Tolak Permintaan"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ANGGOTA KELOMPOK */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              {approvedMembers.length === 0 ? (
                <div className="pixel-box-inset p-6 text-center text-amber-500 text-xs">
                  Belum ada anggota terdaftar di kelompok ini.
                </div>
              ) : (
                approvedMembers.map((m) => {
                  const isOwner = m.player_id === myPlayerId;
                  return (
                    <div
                      key={m.id || m.player_id}
                      className="pixel-box-inset p-3 flex items-center justify-between gap-3 bg-[#140802]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-xs font-bold text-amber-200 truncate">
                            {m.full_name || m.username}
                          </span>
                          {m.attendance_no && (
                            <span className="text-[10px] font-mono text-amber-400">
                              #{m.attendance_no}
                            </span>
                          )}
                          {isOwner && (
                            <span className="text-[9px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700/60 px-1 py-0.2 rounded font-bold">
                              Ketua (Owner)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-amber-500/80 font-mono mt-0.5">
                          {m.student_class || 'Siswa'}
                        </div>
                      </div>

                      {!isOwner && (
                        <button
                          onClick={() => handleKick(m)}
                          disabled={actionLoadingId === m.player_id}
                          className="pixel-btn-wood text-red-300 hover:text-red-100 py-1 px-2.5 text-[10px] font-bold uppercase flex items-center gap-1"
                          title="Keluarkan dari kelompok"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Kick</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#5c3416] pt-3 flex items-center justify-between text-[11px] text-amber-400/80">
          <span>Kapasitas Kelompok: {approvedMembers.length} / 4 Peserta</span>
          <button
            onClick={onClose}
            className="pixel-btn-silver py-1 px-3 text-xs font-bold uppercase"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
