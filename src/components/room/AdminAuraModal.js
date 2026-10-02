'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, CircleDot, EyeOff, Palette, Check, X } from 'lucide-react';
import AdminAuraEffect from './AdminAuraEffect';
import { playChoiceClick, playSuccessChime, playCloseSound } from '@/lib/soundEffects';

const AURA_TYPES = [
  { id: 'biasa', label: 'Biasa (Halo)', icon: CircleDot, desc: 'Halo lembut tipis di tanah' },
  { id: 'love', label: 'Love (Hati)', icon: Heart, desc: 'Partikel hati mungil melayang halus' },
  { id: 'bintang', label: 'Bintang', icon: Sparkles, desc: 'Kilau bintang kecil berkedip' },
  { id: 'none', label: 'Mati', icon: EyeOff, desc: 'Tanpa aura' },
];

const PRESET_COLORS = [
  { name: 'Emas', hex: '#f59e0b' },
  { name: 'Merah Ruby', hex: '#ef4444' },
  { name: 'Biru Langit', hex: '#0ea5e9' },
  { name: 'Ungu Mistis', hex: '#a855f7' },
  { name: 'Hijau Zamrud', hex: '#10b981' },
  { name: 'Pink Sakura', hex: '#ec4899' },
  { name: 'Putih Perak', hex: '#e2e8f0' },
  { name: 'Oranye Api', hex: '#f97316' },
];

export default function AdminAuraModal({
  isOpen,
  onClose,
  currentAura = { type: 'biasa', color: '#f59e0b' },
  onSaveAura,
  characterIndex = 1,
}) {
  const [selectedType, setSelectedType] = useState(currentAura?.type || 'biasa');
  const [selectedColor, setSelectedColor] = useState(currentAura?.color || '#f59e0b');

  useEffect(() => {
    if (currentAura) {
      setSelectedType(currentAura.type || 'biasa');
      setSelectedColor(currentAura.color || '#f59e0b');
    }
  }, [currentAura, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    playSuccessChime();
    if (onSaveAura) {
      onSaveAura({
        type: selectedType,
        color: selectedColor,
      });
    }
    onClose();
  };

  const handleClose = () => {
    playCloseSound();
    onClose();
  };

  const previewAura = {
    type: selectedType,
    color: selectedColor,
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md pixel-panel-wood text-amber-100 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 bg-[#2b1305] border-b-2 border-[#54280b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 pixel-box-inset flex items-center justify-center bg-[#170802]">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-200">Kustomisasi Aura Admin</h3>
              <p className="text-[10px] text-amber-400/80">Efek aura tipis & elegan khusus pengajar</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="pixel-btn-wood p-1 text-xs"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4 text-amber-200" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 bg-[#1a0a03]/90 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Live Character Preview Card */}
          <div className="pixel-box-inset p-3 bg-[#120501] flex flex-col items-center justify-center relative overflow-hidden">
            <span className="text-[10px] font-bold text-amber-400/70 mb-2 uppercase tracking-wider">
              Pratinjau Aura Karakter
            </span>
            <div className="relative w-16 h-16 flex items-center justify-center my-1">
              {/* Active Aura Rendered Below/Around Sprite */}
              <AdminAuraEffect aura={previewAura} />

              {/* Character Sprite Simulation */}
              <img
                src="/assets/sprites/characters/$Char_001.png"
                alt="Admin Preview"
                className="w-12 h-12 object-contain image-pixelated z-10"
                style={{
                  clipPath: 'inset(0 66.6% 75% 0)',
                  transform: 'scale(1.35) translate(25%, 25%)',
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/OwnAssets/qeebos/normal.png';
                  e.currentTarget.style.clipPath = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-amber-200 mt-2">
              {AURA_TYPES.find((t) => t.id === selectedType)?.label} •{' '}
              <span style={{ color: selectedColor }}>{selectedColor}</span>
            </span>
          </div>

          {/* Type Options */}
          <div>
            <label className="block text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <span>1. Bentuk Aura</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AURA_TYPES.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playChoiceClick();
                      setSelectedType(t.id);
                    }}
                    className={`p-2.5 rounded text-left flex items-start gap-2 border transition-all ${
                      isSelected
                        ? 'bg-[#3b1c06] border-amber-400 ring-1 ring-amber-400 text-amber-100 shadow-md'
                        : 'bg-[#241105] border-[#4a240c] text-amber-300/80 hover:bg-[#2e1608] hover:text-amber-100'
                    }`}
                  >
                    <IconComponent 
                      className="w-4 h-4 shrink-0 mt-0.5" 
                      style={{ color: isSelected ? selectedColor : undefined }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate flex items-center justify-between">
                        <span>{t.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400 ml-1 shrink-0" />}
                      </div>
                      <div className="text-[9.5px] text-amber-400/60 leading-tight mt-0.5">
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Presets & Picker */}
          {selectedType !== 'none' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Warna Aura</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400/80 font-mono">{selectedColor}</span>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    title="Pilih Warna Bebas"
                    className="w-5 h-5 rounded cursor-pointer border border-[#6b3815] bg-transparent p-0"
                  />
                </div>
              </div>

              {/* Swatches */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => {
                  const isColorSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        playChoiceClick();
                        setSelectedColor(c.hex);
                      }}
                      className={`py-1.5 px-2 rounded flex items-center gap-1.5 border text-left transition-all ${
                        isColorSelected
                          ? 'bg-[#3b1c06] border-amber-300 ring-1 ring-amber-300 text-white font-bold shadow'
                          : 'bg-[#220d04] border-[#441d08] text-amber-200/90 hover:bg-[#2c1306]'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/40 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#241105] border-t border-[#4a240c] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="pixel-btn-wood text-xs px-3 py-1.5 text-amber-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="pixel-btn-gold text-xs px-4 py-1.5 font-bold flex items-center gap-1.5 text-amber-950 shadow-md hover:scale-105 active:scale-95 transition-transform"
          >
            <Check className="w-3.5 h-3.5 text-emerald-950" />
            <span>Terapkan Aura</span>
          </button>
        </div>
      </div>
    </div>
  );
}
