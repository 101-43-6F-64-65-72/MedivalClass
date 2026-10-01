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
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'team'
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const lastSeenLengthRef = useRef(messages.length);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track unread messages across tabs
  useEffect(() => {
    if (messages.length > lastSeenLengthRef.current) {
      const newMessages = messages.slice(lastSeenLengthRef.current);
      newMessages.forEach((msg) => {
        if (msg.isTeamOnly) {
          if (!isOpen || activeTab !== 'team') {
            setUnreadTeam((prev) => prev + 1);
          }
        } else {
          if (!isOpen || activeTab !== 'global') {
            setUnreadGlobal((prev) => prev + 1);
          }
        }
      });
      lastSeenLengthRef.current = messages.length;
    }
  }, [messages, isOpen, activeTab]);

  // Clear unread on tab switch or open
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'global') setUnreadGlobal(0);
      if (activeTab === 'team') setUnreadTeam(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTab]);

  // Auto-scroll to bottom on new message in current active tab
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Global keyboard shortcut
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

  const isCurrentGroupMsg = (msg) => {
    return (
      msg.senderRoomCode &&
      currentRoomCode &&
      msg.senderRoomCode.trim().toUpperCase() === currentRoomCode.trim().toUpperCase()
    );
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) {
      inputRef.current?.blur();
      return;
    }
    if (cooldown > 0) {
      inputRef.current?.blur();
      return;
    }

    const isTeamMsg = activeTab === 'team';
    onSendMessage(inputText.trim(), isTeamMsg);
    setInputText('');
    setCooldown(2);
    inputRef.current?.blur();
  };

  const handleQuickSend = (text) => {
    if (cooldown > 0) return;
    const isTeamMsg = activeTab === 'team';
    onSendMessage(text, isTeamMsg);
    setCooldown(2);
    inputRef.current?.blur();
  };

  // Strictly filter messages by active tab
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === 'team') {
      return msg.isTeamOnly || isCurrentGroupMsg(msg);
    }
    // Global tab shows only non-team messages
    return !msg.isTeamOnly;
  });

  const totalUnread = unreadGlobal + unreadTeam;

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="pixel-btn-wood flex items-center gap-2 px-3 py-1.5 text-xs font-bold shadow-2xl relative"
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
          {totalUnread > 0 ? (
            <span className="bg-red-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-red-400 font-bold animate-pulse">
              {totalUnread}
            </span>
          ) : messages.length > 0 ? (
            <span className="bg-[#381a05] text-amber-300 font-mono text-[10px] px-1.5 py-0.2 rounded border border-amber-700">
              {messages.length}
            </span>
          ) : null}
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

          {/* Strictly Separated Scope Tabs */}
          <div className="flex items-center p-1 gap-1 border-b border-[#5c3416] bg-[#1a0a03] text-[10px] font-semibold">
            <button
              onClick={() => {
                setActiveTab('global');
                setUnreadGlobal(0);
              }}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition ${
                activeTab === 'global'
                  ? 'pixel-btn-gold text-[10px]'
                  : 'pixel-btn-wood text-[10px] opacity-80 hover:opacity-100'
              }`}
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Chat Global</span>
              {unreadGlobal > 0 && (
                <span className="bg-red-500 text-white font-mono text-[8px] px-1 rounded-full font-bold">
                  {unreadGlobal}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('team');
                setUnreadTeam(0);
              }}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition ${
                activeTab === 'team'
                  ? 'pixel-btn-gold text-[10px]'
                  : 'pixel-btn-wood text-[10px] opacity-80 hover:opacity-100'
              }`}
            >
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Kelompok ({currentRoomCode || '-'})</span>
              {unreadTeam > 0 && (
                <span className="bg-emerald-500 text-black font-mono text-[8px] px-1 rounded-full font-bold">
                  {unreadTeam}
                </span>
              )}
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs pixel-box-inset">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-amber-400/50 text-[11px] italic gap-1 p-3">
                <span>
                  {activeTab === 'team'
                    ? `Belum ada pesan di kelompok ${currentRoomCode || '-'}.`
                    : 'Belum ada pesan di Chat Global.'}
                </span>
                <span className="text-[10px] text-amber-500/70">
                  {activeTab === 'team'
                    ? 'Kirim pesan rahasia yang hanya bisa dibaca anggota kelompokmu!'
                    : 'Ketik pesan atau klik opsi cepat untuk menyapa semua siswa!'}
                </span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderName === username;
                const isGroupMsg = msg.isTeamOnly || isCurrentGroupMsg(msg);

                return (
                  <div key={msg.id} className="flex flex-col gap-0.5 animate-in fade-in duration-100">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-bold text-amber-300 truncate max-w-[130px]">
                        {msg.senderName}
                        {msg.attendanceNo ? ` #${msg.attendanceNo}` : ''}
                      </span>
                      {msg.senderRoomCode && (
                        <span
                          className={`font-mono text-[8px] px-1 rounded border ${
                            isGroupMsg
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                              : 'bg-indigo-950 text-indigo-300 border-indigo-600/60'
                          }`}
                        >
                          {msg.senderRoomCode}
                        </span>
                      )}
                      {msg.isTeamOnly && (
                        <span className="text-[8px] bg-emerald-900/60 text-emerald-300 px-1 rounded border border-emerald-700/60 font-semibold">
                          Kelompok
                        </span>
                      )}
                      <span className="text-[9px] text-amber-400/40 ml-auto font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-xs break-words border ${
                        isMe
                          ? isGroupMsg
                            ? 'bg-[#1b3d22] text-emerald-100 border-[#2b6637] ml-3'
                            : 'bg-[#4a240c] text-amber-100 border-[#783c16] ml-3'
                          : isGroupMsg
                          ? 'bg-[#102415] text-emerald-200/90 border-[#1f4728] mr-3'
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
                title={cooldown > 0 ? `Tunggu ${cooldown}d...` : `Kirim ke ${activeTab === 'team' ? 'Kelompok' : 'Global'}: "${chip.text}"`}
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
              placeholder={
                activeTab === 'team'
                  ? `Pesan ke kelompok ${currentRoomCode || '-'}... (Enter kirim)`
                  : 'Pesan ke seluruh kelas... (Enter kirim)'
              }
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
