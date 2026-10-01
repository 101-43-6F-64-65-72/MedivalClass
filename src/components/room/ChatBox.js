'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Users, Globe } from 'lucide-react';

export default function ChatBox({ messages = [], onSendMessage, currentRoomCode = '', username = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [filterScope, setFilterScope] = useState('all'); // 'all' or 'team'
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim(), filterScope === 'team');
    setInputText('');
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
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#261408]/95 hover:bg-[#3d2010] text-amber-200 border-2 border-[#8c5324] px-3.5 py-2.5 rounded-2xl shadow-xl transition-all duration-150 active:scale-95 text-xs font-bold"
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Obrolan Kelas</span>
          {messages.length > 0 && (
            <span className="bg-[#421d05] text-amber-300 font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-amber-700">
              {messages.length}
            </span>
          )}
        </button>
      ) : (
        <div className="w-72 sm:w-80 h-80 bg-[#1f0f05]/95 border-2 border-[#8c5324] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2 bg-[#2d1607] border-b border-[#5c3416] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-xs text-amber-200">Obrolan Kelas</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#452108] rounded text-amber-300/70 hover:text-amber-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scope Filter Tabs */}
          <div className="flex items-center border-b border-[#5c3416] bg-[#1a0a03] text-[10px] font-semibold">
            <button
              onClick={() => setFilterScope('all')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition ${
                filterScope === 'all'
                  ? 'bg-[#3d1e0a] text-amber-200 border-b-2 border-amber-500'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Semua</span>
            </button>
            <button
              onClick={() => setFilterScope('team')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition ${
                filterScope === 'team'
                  ? 'bg-[#3d1e0a] text-amber-200 border-b-2 border-amber-500'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Kelompok ({currentRoomCode || '-'})</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-amber-400/40 text-[11px] italic">
                Belum ada pesan. Ketik pesan di bawah untuk berinteraksi!
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
                      <span className="font-bold text-amber-300 truncate max-w-[120px]">
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
                      className={`px-2.5 py-1.5 rounded-xl text-xs break-words border ${
                        isMe
                          ? 'bg-[#4a240c] text-amber-100 border-[#783c16] ml-2'
                          : 'bg-[#291306] text-amber-200/90 border-[#472209] mr-2'
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

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="p-2 bg-[#2d1607] border-t border-[#5c3416] flex items-center gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={filterScope === 'team' ? 'Kirim ke kelompok...' : 'Ketik pesan kelas...'}
              className="flex-1 bg-[#1a0a03] border border-[#6b3815] rounded-xl px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-amber-950 font-bold transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
