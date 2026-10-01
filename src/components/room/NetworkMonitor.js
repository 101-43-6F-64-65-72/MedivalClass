import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, Zap, ZapOff, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const HIGH_PING_THRESHOLD = 300; // ms - suggest Low Latency Mode above this

export default function NetworkMonitor({ playerId, lowLatencyMode, onToggleLowLatency }) {
  const [latency, setLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const latencyRef = useRef(0);
  const highPingCountRef = useRef(0); // Count consecutive high-ping readings before showing suggestion

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

          // Track consecutive high-ping readings
          if (rtt > HIGH_PING_THRESHOLD) {
            highPingCountRef.current += 1;
            // Show suggestion after 2 consecutive high-ping readings
            if (highPingCountRef.current >= 2 && !suggestionDismissed && !lowLatencyMode) {
              setShowSuggestion(true);
            }
          } else {
            highPingCountRef.current = 0;
            setShowSuggestion(false);
          }

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
      } catch (e) {
        // Ignore network errors on fetch ping
      }
    };

    const updateNetworkStats = () => {
      setIsOnline(navigator.onLine);
      if (navigator.connection) {
        const connection = navigator.connection;
        if (connection.downlink) setBandwidth(connection.downlink);
        if (connection.rtt && !latencyRef.current) {
          setLatency(connection.rtt);
          latencyRef.current = connection.rtt;
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
  }, [playerId, suggestionDismissed, lowLatencyMode]);

  const getLatencyColor = (ms) => {
    if (ms < 100) return 'text-emerald-400';
    if (ms < 300) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBandwidthColor = (mbps) => {
    if (mbps > 5) return 'text-emerald-400';
    if (mbps > 1) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-2 right-2 z-[60] flex flex-col items-end gap-1.5 pointer-events-none">

      {/* Low-ping suggestion toast */}
      {showSuggestion && !lowLatencyMode && (
        <div className="pointer-events-auto bg-red-950/95 border border-red-500/60 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300 max-w-[220px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
              <span className="text-[10px] font-black text-red-300">Ping Tinggi Terdeteksi</span>
            </div>
            <button
              onClick={() => {
                setShowSuggestion(false);
                setSuggestionDismissed(true);
              }}
              className="text-red-500/60 hover:text-red-300 transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[9px] text-red-200/80 leading-relaxed">
            Koneksimu lambat ({latency}ms). Aktifkan <strong>Mode Latensi Rendah</strong> untuk menyembunyikan pemain dari kelompok lain dan meningkatkan performa.
          </p>
          <button
            onClick={() => {
              if (onToggleLowLatency) onToggleLowLatency(true);
              setShowSuggestion(false);
              setSuggestionDismissed(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded px-2.5 py-1 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Aktifkan Low Latency
          </button>
        </div>
      )}

      {/* Low Latency Mode active badge */}
      {lowLatencyMode && (
        <button
          onClick={() => onToggleLowLatency && onToggleLowLatency(false)}
          className="pointer-events-auto flex items-center gap-1.5 bg-amber-900/90 border border-amber-500/60 rounded-lg px-2.5 py-1 shadow-xl backdrop-blur-sm hover:bg-amber-800/90 transition-colors"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] font-black text-amber-300">Low Latency ON</span>
          <ZapOff className="w-2.5 h-2.5 text-amber-600 ml-1" />
        </button>
      )}

      {/* Main ping/bandwidth widget */}
      <div className="bg-black/80 border border-slate-700/50 rounded-lg px-2 py-1.5 flex flex-col gap-1 backdrop-blur-sm shadow-xl transition-all">
        <div className="flex items-center gap-1.5 min-w-[70px]">
          {isOnline ? (
            <Wifi className={`w-3 h-3 ${getBandwidthColor(bandwidth)}`} />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-[9px] font-mono font-bold text-slate-300">
            BW: <span className={getBandwidthColor(bandwidth)}>{bandwidth ? bandwidth.toFixed(1) : '-'}</span> Mbps
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${getLatencyColor(latency)}`} />
          <span className="text-[9px] font-mono font-bold text-slate-300">
            Ping: <span className={getLatencyColor(latency)}>{latency ? latency : '-'}</span> ms
          </span>
        </div>
      </div>
    </div>
  );
}
