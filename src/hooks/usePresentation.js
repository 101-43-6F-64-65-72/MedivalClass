import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const DEFAULT_WHITEBOARD_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed';

export function formatWhiteboardUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return DEFAULT_WHITEBOARD_URL;
  let url = inputUrl.trim();

  // 1. Canva: ensure ?embed
  if (url.includes('canva.com') && url.includes('/view')) {
    url = url.replace(/\/$/, '');
    if (!url.includes('?embed') && !url.includes('&embed')) {
      url = url.includes('?') ? `${url}&embed` : `${url}?embed`;
    }
    return url;
  }

  // 2. Google Slides: convert /edit or /pub to /embed
  if (url.includes('docs.google.com/presentation')) {
    if (url.includes('/pub')) {
      return url.replace('/pub', '/embed');
    }
    if (url.includes('/edit')) {
      return url.split('/edit')[0] + '/embed';
    }
  }

  // 3. YouTube: convert watch?v=ID or youtu.be/ID to /embed/ID
  if (url.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(url);
      const v = parsed.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    } catch (e) {}
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

export function usePresentation(options = {}) {
  const { isAdmin = false, presenterName = 'Guru' } = options;

  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(15);
  const [presentationUrl, setPresentationUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('virtual_presentation_url');
      return saved ? formatWhiteboardUrl(saved) : DEFAULT_WHITEBOARD_URL;
    }
    return DEFAULT_WHITEBOARD_URL;
  });
  const [canvaLiveCode, setCanvaLiveCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('virtual_canva_live_code') || '';
    }
    return '';
  });
  const [lastNotification, setLastNotification] = useState(null);
  const [syncedBy, setSyncedBy] = useState(null);

  const channelRef = useRef(null);
  const currentSlideRef = useRef(currentSlide);
  const presentationUrlRef = useRef(presentationUrl);
  const canvaLiveCodeRef = useRef(canvaLiveCode);

  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  useEffect(() => {
    presentationUrlRef.current = presentationUrl;
  }, [presentationUrl]);

  useEffect(() => {
    canvaLiveCodeRef.current = canvaLiveCode;
  }, [canvaLiveCode]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    // Use dedicated presentation broadcast channel
    const channel = supabase.channel('presentation:realtime_sync', {
      config: { broadcast: { ack: false, self: false } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'slide-change' }, ({ payload }) => {
        if (!payload) return;
        const newSlide = Math.max(1, Number(payload.slide) || 1);
        setCurrentSlide(newSlide);
        setSyncedBy(payload.presenterName || 'Guru');
        setLastNotification(`Presenter berpindah ke Slide ${newSlide}`);
      })
      .on('broadcast', { event: 'url-change' }, ({ payload }) => {
        if (!payload || !payload.url) return;
        setPresentationUrl(payload.url);
        try {
          localStorage.setItem('virtual_presentation_url', payload.url);
        } catch (e) {}
        setLastNotification('Link presentasi Canva telah diperbarui oleh Pengajar');
      })
      .on('broadcast', { event: 'canva-live-update' }, ({ payload }) => {
        if (!payload) return;
        setCanvaLiveCode(payload.code || '');
        try {
          localStorage.setItem('virtual_canva_live_code', payload.code || '');
        } catch (e) {}
        if (payload.code) {
          setLastNotification(`Sesi Canva Live aktif dengan Kode: ${payload.code}`);
        }
      })
      .on('broadcast', { event: 'request-sync' }, () => {
        // If this client is Admin/Presenter, reply with current state
        if (isAdmin && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'sync-state-response',
            payload: {
              slide: currentSlideRef.current,
              url: presentationUrlRef.current,
              code: canvaLiveCodeRef.current,
              presenterName,
            },
          });
        }
      })
      .on('broadcast', { event: 'sync-state-response' }, ({ payload }) => {
        if (!payload) return;
        if (payload.slide) setCurrentSlide(payload.slide);
        if (payload.url) setPresentationUrl(payload.url);
        if (payload.code) setCanvaLiveCode(payload.code);
        if (payload.presenterName) setSyncedBy(payload.presenterName);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Request current state from any active presenter
          channel.send({
            type: 'broadcast',
            event: 'request-sync',
            payload: { timestamp: Date.now() },
          });
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [isAdmin, presenterName]);

  // Admin function: Change slide number & broadcast
  const changeSlide = useCallback((newSlide) => {
    const validSlide = Math.max(1, Number(newSlide) || 1);
    setCurrentSlide(validSlide);

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'slide-change',
        payload: {
          slide: validSlide,
          presenterName,
          timestamp: Date.now(),
        },
      });
    }
  }, [presenterName]);

  const nextSlide = useCallback(() => {
    changeSlide(currentSlideRef.current + 1);
  }, [changeSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlideRef.current > 1) {
      changeSlide(currentSlideRef.current - 1);
    }
  }, [changeSlide]);

  // Admin function: Change Whiteboard / Presentation embed URL & broadcast
  const changePresentationUrl = useCallback((newUrl) => {
    if (!newUrl || !newUrl.trim()) return;
    const cleanUrl = formatWhiteboardUrl(newUrl.trim());
    setPresentationUrl(cleanUrl);
    try {
      localStorage.setItem('virtual_presentation_url', cleanUrl);
    } catch (e) {}

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'url-change',
        payload: {
          url: cleanUrl,
          presenterName,
          timestamp: Date.now(),
        },
      });
    }
  }, [presenterName]);

  // Admin function: Set Canva Live code & broadcast
  const changeCanvaLiveCode = useCallback((code) => {
    const clean = (code || '').trim().toUpperCase();
    setCanvaLiveCode(clean);
    try {
      localStorage.setItem('virtual_canva_live_code', clean);
    } catch (e) {}

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'canva-live-update',
        payload: {
          code: clean,
          presenterName,
          timestamp: Date.now(),
        },
      });
    }
  }, [presenterName]);

  const clearNotification = useCallback(() => {
    setLastNotification(null);
  }, []);

  return {
    currentSlide,
    totalSlides,
    presentationUrl,
    canvaLiveCode,
    syncedBy,
    lastNotification,
    clearNotification,
    changeSlide,
    nextSlide,
    prevSlide,
    changePresentationUrl,
    changeCanvaLiveCode,
  };
}
