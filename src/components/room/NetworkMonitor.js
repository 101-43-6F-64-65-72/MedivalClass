import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export default function NetworkMonitor() {
  const [latency, setLatency] = useState(0);
  const [bandwidth, setBandwidth] = useState(0); // Mbps
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let pingInterval;
    let isActive = true;

    const measureLatency = async () => {
      if (!isActive || !navigator.onLine) return;
      const start = performance.now();
      try {
        // Pinging the current origin or a reliable small endpoint to get accurate round-trip time
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        const end = performance.now();
        const rtt = Math.round(end - start);
        if (isActive) setLatency(rtt);
      } catch (e) {
        // Ignore network errors on fetch ping
      }
    };

    const updateNetworkStats = () => {
      setIsOnline(navigator.onLine);
      
      // Use navigator.connection if available (Chromium based browsers)
      if (navigator.connection) {
        const connection = navigator.connection;
        // downlink returns estimated bandwidth in Mbps
        if (connection.downlink) {
          setBandwidth(connection.downlink);
        }
        if (connection.rtt && !latency) {
          // If we haven't successfully measured latency via fetch yet, use the browser's RTT estimation
          setLatency(connection.rtt);
        }
      }
    };

    // Initial check
    updateNetworkStats();
    measureLatency();

    // Set intervals for ongoing monitoring
    pingInterval = setInterval(measureLatency, 5000); // Check latency every 5 seconds

    // Listen for network connection changes
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
  }, [latency]);

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
    <div className="absolute bottom-2 right-2 z-[60] bg-black/80 border border-slate-700/50 rounded-lg px-2 py-1.5 flex flex-col gap-1 backdrop-blur-sm shadow-xl select-none pointer-events-none transition-all">
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
  );
}
