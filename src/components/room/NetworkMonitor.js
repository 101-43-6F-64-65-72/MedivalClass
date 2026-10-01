'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const PING_HIGH_THRESHOLD = 300; // ms - warn user above this
const PING_VERY_HIGH_THRESHOLD = 500; // ms - more urgent warning
const PING_STABLE_THRESHOLD = 150; // ms - stable enough to verify

/**
 * DEV steps untuk proses Low Ping Mode:
 * DEV 1 - Deteksi otomatis latensi tinggi
 * DEV 2 - Aktifkan Mode Low Ping
 * DEV 3 - Filter pemain luar kelompok (otomatis saat mode aktif)
 * DEV 4 - Verifikasi koneksi stabil
 * → Selesai: arahkan ke NPC Sam
 */
const DEV_STEPS = [
  {
    id: 1,
    label: 'DEV 1',
    title: 'Deteksi Latensi Tinggi',
    desc: 'Ping di atas 300ms terdeteksi secara otomatis.',
  },
  {
    id: 2,
    label: 'DEV 2',
    title: 'Aktifkan Mode Low Ping',
    desc: 'Klik tombol "Aktifkan" untuk mengurangi beban koneksi.',
    requiresAction: true,
  },
  {
    id: 3,
    label: 'DEV 3',
    title: 'Filter Pemain Luar Kelompok',
    desc: 'Hanya pemain satu kelompok yang dirender — otomatis saat mode aktif.',
  },
  {
    id: 4,
    label: 'DEV 4',
    title: 'Verifikasi Koneksi Stabil',
    desc: 'Ping terkonfirmasi di bawah 150ms setelah mode aktif.',
  },
];

export default function NetworkMonitor({ playerId, roomCode, lowPingMode, onSetLowPingMode }) {
  const [latency, setLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [allDone, setAllDone] = useState(false);
  const [stableCount, setStableCount] = useState(0);

  const latencyRef = useRef(0);
  const lowPingModeRef = useRef(lowPingMode);

  useEffect(() => {
    lowPingModeRef.current = lowPingMode;
  }, [lowPingMode]);

  // DEV step progression logic
  useEffect(() => {
    if (latency <= 0) return;

    setCompletedSteps((prev) => {
      const next = new Set(prev);

      // DEV 1: auto-complete when high ping detected
      if (latency > PING_HIGH_THRESHOLD) {
        next.add(1);
        if (!dismissed) setShowChecklist(true);
      }

      // DEV 3: auto-complete when low ping mode is on
      if (lowPingModeRef.current) {
        next.add(2);
        next.add(3);
      }

      // DEV 4: auto-complete when mode is on and ping is stable
      if (lowPingModeRef.current && latency > 0 && latency < PING_STABLE_THRESHOLD) {
        next.add(4);
      }

      return next;
    });
  }, [latency, lowPingMode, dismissed]);

  // Check if all 4 steps are done
  useEffect(() => {
    if (completedSteps.size === 4) {
      setAllDone(true);
    }
  }, [completedSteps]);

  useEffect(() => {
    let pingInterval;
    let isActive = true;

    const measureLatency = async () => {
      if (!isActive || !navigator.onLine) return;
      const start = performance.now();
      try {
        await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
        const end = performance.now();
        const rtt = Math.round(end - start);
        if (isActive) {
          setLatency(rtt);
          latencyRef.current = rtt;

          // Broadcast ping to Supabase so admin can monitor
          if (playerId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            try {
              const channel = supabase.channel('classroom:shared_universe');
              channel.send({
                type: 'broadcast',
                event: 'ping-report',
                payload: { playerId, ping: rtt },
              });
            } catch (_) {}
          }
        }
      } catch (_) {}
    };

    const updateNetworkStats = () => {
      setIsOnline(navigator.onLine);
      if (navigator.connection) {
        const conn = navigator.connection;
        if (conn.downlink) setBandwidth(conn.downlink);
        if (conn.rtt && !latencyRef.current) {
          setLatency(conn.rtt);
          latencyRef.current = conn.rtt;
        }
      }
    };

    updateNetworkStats();
    measureLatency();
    pingInterval = setInterval(measureLatency, 5000);

    window.addEventListener('online', updateNetworkStats);
    window.addEventListener('offline', updateNetworkStats);
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStats);
    }

    return () => {
      isActive = false;
      clearInterval(pingInterval);
      window.removeEventListener('online', updateNetworkStats);
      window.removeEventListener('offline', updateNetworkStats);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkStats);
      }
    };
  }, [playerId]);

  const handleActivateLowPing = useCallback(() => {
    if (onSetLowPingMode) onSetLowPingMode(true);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(2);
      next.add(3);
      return next;
    });
  }, [onSetLowPingMode]);

  const handleDeactivateLowPing = useCallback(() => {
    if (onSetLowPingMode) onSetLowPingMode(false);
    setAllDone(false);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(2);
      next.delete(3);
      next.delete(4);
      return next;
    });
  }, [onSetLowPingMode]);

  const getLatencyColor = (ms) => {
    if (ms < 100) return 'text-emerald-400';
    if (ms < 300) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBwColor = (mbps) => {
    if (mbps > 5) return 'text-emerald-400';
    if (mbps > 1) return 'text-amber-400';
    return 'text-red-400';
  };

  const isHighPing = latency > PING_HIGH_THRESHOLD;
  const isVeryHighPing = latency > PING_VERY_HIGH_THRESHOLD;

  return (
    <div className="absolute bottom-2 right-2 z-[60] flex flex-col items-end gap-1.5 select-none pointer-events-auto">

      {/* === DEV CHECKLIST PANEL === */}
      {showChecklist && !dismissed && (
        <div className="w-72 bg-[#0e1117]/95 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className={`px-3 py-2 flex items-center justify-between ${isVeryHighPing ? 'bg-red-950/80' : 'bg-amber-950/80'} border-b border-slate-700/60`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-3.5 h-3.5 ${isVeryHighPing ? 'text-red-400' : 'text-amber-400'}`} />
              <span className="text-xs font-black text-slate-100 tracking-wide">
                {isVeryHighPing ? 'Koneksi Sangat Lambat!' : 'Latensi Tinggi Terdeteksi'}
              </span>
            </div>
            <button
              onClick={() => { setDismissed(true); setShowChecklist(false); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Warning message */}
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Ping kamu <span className={`font-black ${getLatencyColor(latency)}`}>{latency}ms</span> — disarankan mengaktifkan{' '}
              <span className="text-emerald-400 font-bold">Mode Low Ping</span> untuk mengurangi beban render dan meningkatkan performa.
            </p>
          </div>

          {/* DEV Steps List */}
          <div className="px-3 pb-2 pt-2 space-y-1.5">
            {DEV_STEPS.map((step) => {
              const done = completedSteps.has(step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-2 p-1.5 rounded-lg transition-all ${done ? 'bg-emerald-950/40' : 'bg-slate-900/60'}`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black font-mono px-1 rounded ${done ? 'bg-emerald-800/60 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                        {step.label}
                      </span>
                      <span className={`text-[10px] font-bold ${done ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{step.desc}</p>

                    {/* Action button for DEV 2 */}
                    {step.requiresAction && !done && (
                      <button
                        onClick={handleActivateLowPing}
                        className="mt-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-black rounded transition-colors flex items-center gap-1"
                      >
                        <span>Aktifkan Low Ping Mode</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Done State → Go to Sam */}
          {allDone ? (
            <div className="mx-3 mb-3 bg-emerald-900/60 border border-emerald-600/50 rounded-lg px-3 py-2 animate-in fade-in duration-300">
              <p className="text-[10px] text-emerald-300 font-bold mb-1.5">
                Semua langkah selesai! Koneksimu sudah lebih ringan.
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/80">
                <span className="text-amber-400 font-black font-mono">→</span>
                <span>Temui <strong className="text-amber-300">NPC Sam</strong> di sudut kiri atas kelas untuk langkah selanjutnya.</span>
              </div>
            </div>
          ) : lowPingMode ? (
            <div className="px-3 pb-2">
              <p className="text-[9px] text-amber-400/70 font-mono text-center">
                Mode aktif — menunggu ping stabil di bawah 150ms…
              </p>
            </div>
          ) : null}

          {/* Low Ping Mode active: show deactivate button */}
          {lowPingMode && (
            <div className="px-3 pb-2.5 flex items-center justify-between">
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Low Ping Mode Aktif
              </span>
              <button
                onClick={handleDeactivateLowPing}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline transition-colors"
              >
                Matikan
              </button>
            </div>
          )}
        </div>
      )}

      {/* === MINI WIDGET === */}
      <div
        className={`bg-black/80 border rounded-lg px-2 py-1.5 flex flex-col gap-1 backdrop-blur-sm shadow-xl transition-all cursor-pointer ${
          isHighPing && !showChecklist && !dismissed
            ? 'border-red-600/70 animate-pulse'
            : lowPingMode
            ? 'border-emerald-700/50'
            : 'border-slate-700/50'
        }`}
        onClick={() => {
          if (isHighPing || showChecklist) {
            setShowChecklist((v) => !v);
            setDismissed(false);
          }
        }}
        title={isHighPing ? 'Klik untuk melihat saran optimasi koneksi' : undefined}
      >
        <div className="flex items-center gap-1.5 min-w-[70px]">
          {isOnline ? (
            <Wifi className={`w-3 h-3 ${getBwColor(bandwidth)}`} />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-[9px] font-mono font-bold text-slate-300">
            BW: <span className={getBwColor(bandwidth)}>{bandwidth ? bandwidth.toFixed(1) : '-'}</span> Mbps
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${getLatencyColor(latency)}`} />
          <span className="text-[9px] font-mono font-bold text-slate-300">
            Ping: <span className={getLatencyColor(latency)}>{latency ? latency : '-'}</span> ms
          </span>
          {lowPingMode && (
            <span className="text-[8px] font-black text-emerald-400 font-mono ml-0.5">LP</span>
          )}
        </div>
      </div>

    </div>
  );
}
