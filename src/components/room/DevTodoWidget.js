'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp, Navigation, X } from 'lucide-react';
import { playSuccessChime, playChoiceClick } from '@/lib/soundEffects';

const TODO_ITEMS = [
  { id: 'dev1', label: 'DEV 1' },
  { id: 'dev2', label: 'DEV 2' },
  { id: 'dev3', label: 'DEV 3' },
  { id: 'dev4', label: 'DEV 4' },
];

const STORAGE_KEY = 'virtual_dev_todos';

export default function DevTodoWidget({ onDirectToSam }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [checked, setChecked] = useState({});
  const [justCompleted, setJustCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const allDone = TODO_ITEMS.every((t) => checked[t.id]);

  const toggleItem = (id) => {
    playChoiceClick();
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}

      // Check if just completed all
      const nowAllDone = TODO_ITEMS.every((t) => next[t.id]);
      if (nowAllDone && !allDone) {
        playSuccessChime();
        setJustCompleted(true);
        setIsCollapsed(false);
        setTimeout(() => setJustCompleted(false), 4000);
      }
      return next;
    });
  };

  const doneCount = TODO_ITEMS.filter((t) => checked[t.id]).length;

  if (dismissed) return null;

  return (
    <div
      className="absolute bottom-14 right-2 z-[60] select-none"
      style={{ minWidth: '210px', maxWidth: '260px' }}
    >
      {/* Completion Banner pointing to Sam */}
      {allDone && (
        <div className="mb-1.5 pixel-panel-gold px-3 py-1.5 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Navigation className="w-3.5 h-3.5 text-amber-950 shrink-0 fill-amber-950" />
          <span className="text-[10px] font-black text-amber-950">
            Semua selesai! Temui Sam NPC
          </span>
          <button
            onClick={() => {
              playChoiceClick();
              if (onDirectToSam) onDirectToSam();
            }}
            className="ml-auto text-[9px] font-black bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded hover:bg-amber-900 transition-colors"
          >
            Pergi
          </button>
        </div>
      )}

      {/* Main Widget */}
      <div className="bg-[#1a0c04]/95 border border-amber-700/60 rounded-lg shadow-xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-950/40 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-black text-amber-200 uppercase tracking-wider">
              Dev Checklist
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                allDone
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-amber-950/60 text-amber-400'
              }`}
            >
              {doneCount}/{TODO_ITEMS.length}
            </span>
            {isCollapsed ? (
              <ChevronUp className="w-3 h-3 text-amber-600" />
            ) : (
              <ChevronDown className="w-3 h-3 text-amber-600" />
            )}
          </div>
        </button>

        {/* Progress Bar */}
        <div className="h-0.5 bg-amber-950/60">
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(doneCount / TODO_ITEMS.length) * 100}%` }}
          />
        </div>

        {/* Todo Items */}
        {!isCollapsed && (
          <div className="px-3 py-2 space-y-1.5">
            {TODO_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center gap-2 text-left group/item py-0.5"
              >
                {checked[item.id] ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover/item:text-amber-400 transition-colors" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[10.5px] font-bold ${
                      checked[item.id] ? 'text-emerald-400 line-through' : 'text-amber-200'
                    }`}
                  >
                    {item.label}
                  </div>
                </div>
              </button>
            ))}

            {/* Sam Direction hint when all done */}
            {allDone && (
              <div className="mt-2 pt-2 border-t border-amber-800/50 flex items-center gap-1.5 animate-in fade-in duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-bold text-emerald-400">
                  Arahkan ke Sam NPC untuk setor karya!
                </span>
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="mt-1 w-full text-[9px] text-amber-700/50 hover:text-amber-400 text-center transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-2.5 h-2.5" />
              Sembunyikan
            </button>
          </div>
        )}
      </div>

      {/* Completion pulse glow when just finished */}
      {justCompleted && (
        <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
