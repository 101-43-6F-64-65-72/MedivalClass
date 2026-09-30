import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channel = supabase.channel('presentation-room', {
      config: { broadcast: { ack: false } },
    });
    
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'slide-change' }, ({ payload }) => {
        setCurrentSlide(payload.slide);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const changeSlide = (newSlide) => {
    setCurrentSlide(newSlide);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'slide-change',
        payload: { slide: newSlide },
      });
    }
  };

  return { currentSlide, changeSlide };
}
