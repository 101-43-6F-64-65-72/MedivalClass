import React from 'react';
import { usePresentation } from '@/hooks/usePresentation';

const SLIDES = [
  { title: "Welcome to Virtual Room", content: "This is a multiplayer learning space." },
  { title: "Supabase Realtime", content: "We are using Supabase Broadcast for fast synchronization." },
  { title: "Interactive Learning", content: "Walk around, see others, and participate together." },
];

export default function PresentationScreen({ object }) {
  const { currentSlide, changeSlide } = usePresentation();
  
  if (!object.visible) return null;

  const zIndex = Math.floor(object.y + object.height);
  const slide = SLIDES[currentSlide % SLIDES.length];

  return (
    <div 
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        zIndex,
        backgroundColor: '#ffffff',
        border: '6px solid #1e293b',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
      }}
    >
      <div className="w-full flex items-center justify-between pb-1 mb-2 border-b border-slate-200">
        <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">Interactive Presentation</span>
        <span className="text-[10px] text-slate-400">Slide {currentSlide + 1} of {SLIDES.length}</span>
      </div>
      <h2 className="font-bold text-base text-slate-900 leading-tight text-center">{slide.title}</h2>
      <p className="text-xs text-slate-600 text-center mt-1 max-w-md">{slide.content}</p>
      
      {/* Controls for presenting */}
      <div className="absolute -bottom-9 flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-full shadow-lg border border-slate-700 backdrop-blur-sm">
        <button 
          onClick={() => changeSlide(Math.max(0, currentSlide - 1))}
          className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-[11px] font-medium px-2 py-0.5 rounded transition-transform"
        >
          ◀ Prev
        </button>
        <span className="text-[11px] text-slate-300 font-mono">
          {currentSlide + 1} / {SLIDES.length}
        </span>
        <button 
          onClick={() => changeSlide(currentSlide + 1)}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-medium px-2 py-0.5 rounded transition-transform"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
