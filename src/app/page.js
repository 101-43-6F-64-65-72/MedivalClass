"use client";

import { useState } from 'react';
import VirtualRoom from '@/components/room/VirtualRoom';

export default function Home() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [color, setColor] = useState('#3b82f6'); // default blue

  if (!joined) {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">Virtual Learning Room</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Character Color</label>
              <div className="flex gap-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                if (username.trim()) setJoined(true);
              }}
              disabled={!username.trim()}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-full min-h-screen">
      <VirtualRoom username={username} color={color} />
    </main>
  );
}
