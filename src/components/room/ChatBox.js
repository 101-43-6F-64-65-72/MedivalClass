'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Users, Globe, Zap } from 'lucide-react';

const QUICK_CHATS = [
  { label: 'Halo!', text: 'Halo semuanya!' },
  { label: 'Siap!', text: 'Siap, paham!' },
  { label: 'Ada ide!', text: 'Saya punya ide!' },
  { label: 'Izin tanya', text: 'Izin bertanya!' },
  { label: 'Sebentar', text: 'Tunggu sebentar ya' },
  { label: 'Mantap!', text: 'Keren banget, mantap!' },
];

export default function ChatBox({ messages = [], onSendMessage, currentRoomCode = '', username = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [filterScope, setFilterScope] = useState('all'); // 'all' or 'team'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Global keyboard shortcut:
  // - Press 'Enter' when not typing to open chat and focus input
  // - Press 'Escape' while chat is focused to close/blur and return to character controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

      if (e.key === 'Enter' && !isInput) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        inputRef.current?.blur();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const [cooldown, setCooldown] = useState(0);

  // Anti-spam cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || cooldown > 0) return;

    onSendMessage(inputText.trim(), filterScope === 'team');
    setInputText('');
    setCooldown(2); // 2 second anti-spam cooldown
  };

  const handleQuickSend = (text) => {
    if (cooldown > 0) return;
    onSendMessage(text, filterScope === 'team');
    setCooldown(2);
  };

  const filteredMessages = messages.filter((msg) => {
    if (filterScope === 'team') {
      return (
        msg.senderRoomCode &&
        currentRoomCode &&
        msg.senderRoomCode.trim().toUpperCase() === currentRoomCode.trim().toUpperCase()
      );
    }
    return true; // 'all' displays everything
  });

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="pixel-btn-wood flex items-center gap-2 px-3 py-1.5 text-xs font-bold shadow-2xl"
          title="Tekan Enter untuk membuka obrolan cepat"
        >
          <img 
            src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" 
            alt="Chat" 
            className="w-4 h-4 image-rendering-pixelated" 
          />
          <span>Obrolan Kelas</span>
          <span className="pixel-btn-gold text-amber-950 font-mono text-[9px] px-1.5 py-0.2 pointer-events-none">
            Enter
          </span>
          {messages.length > 0 && (
            <span className="bg-[#381a05] text-amber-300 font-mono text-[10px] px-1.5 py-0.2 rounded border border-amber-700">
              {messages.length}
            </span>
          )}
        </button>
      ) : (
        <div className="w-80 sm:w-96 h-96 pixel-panel-wood flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3 py-1.5 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/fantasy_pixelart_ui/icons/gold_flag.png" 
                alt="Chat" 
                className="w-3.5 h-3.5 image-rendering-pixelated" 
              />
              <span className="font-bold text-xs text-amber-200">Obrolan Kelas</span>
              <span className="text-[9px] font-mono text-amber-300/60 bg-[#160a03] px-1 rounded border border-[#5c3416]">
                Esc untuk tutup
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              title="Tutup (Esc)"
              className="pixel-btn-wood w-5 h-5 p-0"
            >
              <img 
                src="/assets/fantasy_pixelart_ui/icons/gold_cross.png" 
                alt="Close" 
                className="w-3 h-3 image-rendering-pixelated" 
              />
            </button>
          </div>

          {/* Scope Filter Tabs */}
          <div className="flex items-center p-1 gap-1 border-b border-[#5c3416] bg-[#1a0a03] text-[10px] font-semibold">
            <button
              onClick={() => setFilterScope('all')}
              className={`flex-1 py-1 flex items-center justify-center gap-1 transition ${
                filterScope === 'all'
                  ? 'pixel-btn-gold text-[10px]'
                  : 'pixel-btn-wood text-[10px] opacity-80 hover:opacity-100'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Semua</span>
            </button>
            <button
              onClick={() => setFilterScope('team')}
              className={`flex-1 py-1 flex items-center justify-center gap-1 transition ${
                filterScope === 'team'
                  ? 'pixel-btn-gold text-[10px]'
                  : 'pixel-btn-wood text-[10px] opacity-80 hover:opacity-100'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Kelompok ({currentRoomCode || '-'})</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs pixel-box-inset">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-amber-400/40 text-[11px] italic gap-1">
                <span>Belum ada pesan.</span>
                <span className="text-[10px]">Klik tombol respon cepat di bawah atau ketik pesan!</span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderName === username;
                const isSameTeam =
                  msg.senderRoomCode &&
                  currentRoomCode &&
                  msg.senderRoomCode.trim().toUpperCase() === currentRoomCode.trim().toUpperCase();

                return (
                  <div key={msg.id} className="flex flex-col gap-0.5 animate-in fade-in duration-100">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-bold text-amber-300 truncate max-w-[140px]">
                        {msg.senderName}
                        {msg.attendanceNo ? ` #${msg.attendanceNo}` : ''}
                      </span>
                      {msg.senderRoomCode && (
                        <span
                          className={`font-mono text-[8px] px-1 rounded border ${
                            isSameTeam
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-600/60'
                          }`}
                        >
                          {msg.senderRoomCode}
                        </span>
                      )}
                      <span className="text-[9px] text-amber-400/40 ml-auto font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs break-words border ${
                        isMe
                          ? 'bg-[#4a240c] text-amber-100 border-[#783c16] ml-3'
                          : 'bg-[#291306] text-amber-200/90 border-[#472209] mr-3'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Chat Response Shortcut Chips */}
          <div className="px-2 py-1 bg-[#241105] border-t border-[#5c3416] flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[9px] text-amber-400/70 font-semibold flex items-center gap-0.5 shrink-0 mr-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              Cepat:
            </span>
            {QUICK_CHATS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                disabled={cooldown > 0}
                onClick={() => handleQuickSend(chip.text)}
                title={cooldown > 0 ? `Tunggu ${cooldown}d...` : `Kirim cepat: "${chip.text}"`}
                className="pixel-btn-wood text-[10px] px-2 py-0.5 shrink-0 disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="p-2 bg-[#2d1607] border-t border-[#5c3416] flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={filterScope === 'team' ? 'Pesan kelompok... (Enter kirim, Esc keluar)' : 'Ketik pesan... (Enter kirim, Esc keluar)'}
              className="flex-1 pixel-box-inset px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || cooldown > 0}
              className="pixel-btn-gold px-2 py-1.5 min-w-[32px] text-xs font-bold disabled:opacity-40"
              title={cooldown > 0 ? `Anti-spam cooldown (${cooldown}d)` : "Kirim Pesan"}
            >
              {cooldown > 0 ? (
                <span className="font-mono text-[10px] text-amber-950 font-black">{cooldown}s</span>
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
