import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const DEFAULT_WHITEBOARD_URL = 'https://www.canva.com/design/DAHWqHcG_Jw/4VfIFITHxeJqwMWPd1KeKA/view?embed';

export const DEFAULT_BOOKSHELVES_MAP = {
  'shelf-w1': { id: 'shelf-w1', num: 1, name: 'Rak 1 (Barat Atas)', targetClass: 'XI PPLG-A', label: 'Server XI PPLG A' },
  'shelf-w2': { id: 'shelf-w2', num: 2, name: 'Rak 2 (Barat Tengah)', targetClass: 'XI PPLG-A', label: 'Server XI PPLG A' },
  'shelf-w3': { id: 'shelf-w3', num: 3, name: 'Rak 3 (Barat Bawah)', targetClass: 'ALL', label: 'Semua Server' },
  'shelf-e1': { id: 'shelf-e1', num: 4, name: 'Rak 4 (Timur Atas)', targetClass: 'XI PPLG-B', label: 'Server XI PPLG B' },
  'shelf-e2': { id: 'shelf-e2', num: 5, name: 'Rak 5 (Timur Tengah)', targetClass: 'XI PPLG-B', label: 'Server XI PPLG B' },
  'shelf-e3': { id: 'shelf-e3', num: 6, name: 'Rak 6 (Timur Bawah)', targetClass: 'ALL', label: 'Semua Server' },
};

export const DEFAULT_BOOKSHELF_CONFIG = {
  shelves: DEFAULT_BOOKSHELVES_MAP,
  westClass: 'XI PPLG-A',
  westLabel: 'Server XI PPLG A',
  eastClass: 'XI PPLG-B',
  eastLabel: 'Server XI PPLG B',
};

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

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function usePresentation(options = {}) {
  const { isAdmin = false, presenterName = 'Admin', enabled = true } = options;

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

  // WebRTC Screen Share State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenPresenterName, setScreenPresenterName] = useState(null);
  const [screenShareError, setScreenShareError] = useState(null);

  const channelRef = useRef(null);
  const myPeerIdRef = useRef(`peer-${Math.random().toString(36).substring(2, 9)}`);
  const currentSlideRef = useRef(currentSlide);
  const presentationUrlRef = useRef(presentationUrl);
  const canvaLiveCodeRef = useRef(canvaLiveCode);
  const isScreenSharingRef = useRef(false);
  const screenPresenterIdRef = useRef(null);

  // WebRTC Peer Connections: Presenter stores map of viewerId -> RTCPeerConnection
  const peerConnectionsRef = useRef(new Map());
  // Viewer stores single RTCPeerConnection to presenter
  const viewerPcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Forced Fullscreen State (Admin forces classroom whiteboard on student screens)
  const [isForcedFullscreen, setIsForcedFullscreen] = useState(false);
  const isForcedFullscreenRef = useRef(false);

  // Student Presentation Delegation: Chosen by Admin
  const [designatedPresenter, setDesignatedPresenter] = useState(null);
  const designatedPresenterRef = useRef(null);

  // Active Presentation Game Link (Pinned banner on whiteboard & screenshare)
  const [activeGameSubmission, setActiveGameSubmission] = useState(null);
  const activeGameSubmissionRef = useRef(null);

  // Bookshelf Target Server configuration (Controlled by Admin, synced to all students)
  const [bookshelfConfig, setBookshelfConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('virtual_bookshelf_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_BOOKSHELF_CONFIG,
            ...parsed,
            shelves: {
              ...DEFAULT_BOOKSHELVES_MAP,
              ...(parsed?.shelves || {}),
            },
          };
        }
      } catch (e) {}
    }
    return DEFAULT_BOOKSHELF_CONFIG;
  });
  const bookshelfConfigRef = useRef(bookshelfConfig);

  // Admin Broadcast Announcements (Marquee Banner / Pop-up Bounce)
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  useEffect(() => {
    bookshelfConfigRef.current = bookshelfConfig;
  }, [bookshelfConfig]);

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
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    isForcedFullscreenRef.current = isForcedFullscreen;
  }, [isForcedFullscreen]);

  useEffect(() => {
    designatedPresenterRef.current = designatedPresenter;
  }, [designatedPresenter]);

  useEffect(() => {
    activeGameSubmissionRef.current = activeGameSubmission;
  }, [activeGameSubmission]);

  // Clean up all WebRTC connections
  const cleanupWebRtc = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
    peerConnectionsRef.current.clear();

    if (viewerPcRef.current) {
      try { viewerPcRef.current.close(); } catch (e) {}
      viewerPcRef.current = null;
    }
  }, []);

  // Stop screen sharing function
  const stopScreenShare = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
    peerConnectionsRef.current.clear();

    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    setScreenStream(null);
    setScreenPresenterName(null);
    screenPresenterIdRef.current = null;

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'screenshare-stopped',
        payload: { presenterId: myPeerIdRef.current },
      });
    }

    setLastNotification('Sesi bagikan layar telah dihentikan');
  }, []);

  // Start screen sharing function
  const startScreenShare = useCallback(async () => {
    try {
      setScreenShareError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Browser tidak mendukung fitur Bagikan Layar (getDisplayMedia).');
      }

      // Constraints optimized for smooth 60 FPS game performance and clear slide text
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: false,
      });

      localStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      setScreenPresenterName(presenterName || 'Admin');
      screenPresenterIdRef.current = myPeerIdRef.current;

      // Handle user stopping via browser native floating bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'screenshare-started',
          payload: {
            presenterId: myPeerIdRef.current,
            presenterName: presenterName || 'Admin',
          },
        });
      }

      setLastNotification('Anda sedang membagikan layar ke papan tulis kelas');
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setScreenShareError(err.message || 'Gagal memulai bagikan layar');
      }
    }
  }, [presenterName, stopScreenShare]);

  useEffect(() => {
    if (!enabled || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

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
        setSyncedBy(payload.presenterName || 'Admin');
        setLastNotification(`Presenter berpindah ke Slide ${newSlide}`);
      })
      .on('broadcast', { event: 'url-change' }, ({ payload }) => {
        if (!payload || !payload.url) return;
        setPresentationUrl(payload.url);
        try {
          localStorage.setItem('virtual_presentation_url', payload.url);
        } catch (e) {}
        setLastNotification('Tampilan papan tulis telah diperbarui oleh Pengajar');
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
      .on('broadcast', { event: 'bookshelf-config-update' }, ({ payload }) => {
        if (!payload) return;
        setBookshelfConfig(payload);
        try {
          localStorage.setItem('virtual_bookshelf_config', JSON.stringify(payload));
        } catch (e) {}
      })
      .on('broadcast', { event: 'screenshare-started' }, async ({ payload }) => {
        if (!payload || payload.presenterId === myPeerIdRef.current) return;
        screenPresenterIdRef.current = payload.presenterId;
        setScreenPresenterName(payload.presenterName || 'Pengajar');
        setLastNotification(`${payload.presenterName || 'Pengajar'} sedang membagikan layar ke papan tulis`);

        // Request WebRTC offer from presenter
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'screenshare-request-offer',
            payload: {
              viewerId: myPeerIdRef.current,
              presenterId: payload.presenterId,
            },
          });
        }
      })
      .on('broadcast', { event: 'screenshare-request-offer' }, async ({ payload }) => {
        // Only the active presenter handles offer requests
        if (!payload || payload.presenterId !== myPeerIdRef.current || !localStreamRef.current) return;
        const viewerId = payload.viewerId;

        // Close any prior connection to this viewer
        if (peerConnectionsRef.current.has(viewerId)) {
          try { peerConnectionsRef.current.get(viewerId).close(); } catch (e) {}
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pc._pendingIceCandidates = [];
        peerConnectionsRef.current.set(viewerId, pc);

        localStreamRef.current.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStreamRef.current);
          if (track.kind === 'video' && sender) {
            try {
              const params = sender.getParameters();
              if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
              }
              // Limit upload bitrate to 900 kbps to preserve Supabase multiplayer network bandwidth
              params.encodings[0].maxBitrate = 900000;
              params.encodings[0].maxFramerate = 15;
              params.degradationPreference = 'maintain-resolution';
              sender.setParameters(params).catch(() => {});
            } catch (err) {}
          }
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screenshare-ice-candidate',
              payload: {
                to: viewerId,
                from: myPeerIdRef.current,
                candidate: event.candidate,
              },
            });
          }
        };

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screenshare-offer',
              payload: {
                to: viewerId,
                from: myPeerIdRef.current,
                sdp: offer,
              },
            });
          }
        } catch (err) {
          console.warn('WebRTC offer error:', err);
        }
      })
      .on('broadcast', { event: 'screenshare-offer' }, async ({ payload }) => {
        if (!payload || payload.to !== myPeerIdRef.current) return;

        if (viewerPcRef.current) {
          try { viewerPcRef.current.close(); } catch (e) {}
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pc._pendingIceCandidates = [];
        viewerPcRef.current = pc;

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setScreenStream(event.streams[0]);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screenshare-ice-candidate',
              payload: {
                to: payload.from,
                from: myPeerIdRef.current,
                candidate: event.candidate,
              },
            });
          }
        };

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          // Flush any pending candidates received before remote description was ready
          if (pc._pendingIceCandidates && pc._pendingIceCandidates.length > 0) {
            for (const cand of pc._pendingIceCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
            }
            pc._pendingIceCandidates = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screenshare-answer',
              payload: {
                to: payload.from,
                from: myPeerIdRef.current,
                sdp: answer,
              },
            });
          }
        } catch (err) {
          console.warn('WebRTC answer error:', err);
        }
      })
      .on('broadcast', { event: 'screenshare-answer' }, async ({ payload }) => {
        if (!payload || payload.to !== myPeerIdRef.current) return;
        const pc = peerConnectionsRef.current.get(payload.from);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            // Flush any pending candidates on presenter
            if (pc._pendingIceCandidates && pc._pendingIceCandidates.length > 0) {
              for (const cand of pc._pendingIceCandidates) {
                try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
              }
              pc._pendingIceCandidates = [];
            }
          } catch (err) {
            console.warn('Set remote description error on presenter:', err);
          }
        }
      })
      .on('broadcast', { event: 'screenshare-ice-candidate' }, async ({ payload }) => {
        if (!payload || payload.to !== myPeerIdRef.current || !payload.candidate) return;
        try {
          const pc = isScreenSharingRef.current
            ? peerConnectionsRef.current.get(payload.from)
            : viewerPcRef.current;
          if (!pc) return;

          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            if (!pc._pendingIceCandidates) pc._pendingIceCandidates = [];
            pc._pendingIceCandidates.push(payload.candidate);
          }
        } catch (err) {
          console.warn('Add ICE candidate error:', err);
        }
      })
      .on('broadcast', { event: 'screenshare-stopped' }, () => {
        if (viewerPcRef.current) {
          try { viewerPcRef.current.close(); } catch (e) {}
          viewerPcRef.current = null;
        }
        setScreenStream(null);
        setScreenPresenterName(null);
        screenPresenterIdRef.current = null;
        setLastNotification('Sesi bagikan layar telah selesai');
      })
      .on('broadcast', { event: 'force-fullscreen' }, ({ payload }) => {
        if (!payload) return;
        setIsForcedFullscreen(!!payload.forced);
        isForcedFullscreenRef.current = !!payload.forced;
        if (payload.forced) {
          setLastNotification('Admin mengaktifkan Mode Layar Penuh Wajib untuk seluruh siswa');
        } else {
          setLastNotification('Admin telah mengakhiri Mode Layar Penuh Wajib');
        }
      })
      .on('broadcast', { event: 'assign-presenter' }, ({ payload }) => {
        if (!payload) return;
        setDesignatedPresenter(payload);
        designatedPresenterRef.current = payload;
        setLastNotification(`Admin menunjuk ${payload.studentName} sebagai Presenter Kelas`);
      })
      .on('broadcast', { event: 'revoke-presenter' }, () => {
        setDesignatedPresenter(null);
        designatedPresenterRef.current = null;
        setLastNotification('Akses presenter kelas telah diakhiri oleh Admin');
      })
      .on('broadcast', { event: 'set-active-game-submission' }, ({ payload }) => {
        setActiveGameSubmission(payload?.submission || null);
        activeGameSubmissionRef.current = payload?.submission || null;
      })
      .on('broadcast', { event: 'admin-broadcast-announcement' }, ({ payload }) => {
        if (!payload) return;
        setActiveAnnouncement(payload);
      })
      .on('broadcast', { event: 'request-sync' }, () => {
        if (channelRef.current) {
          if (isScreenSharingRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'screenshare-started',
              payload: {
                presenterId: myPeerIdRef.current,
                presenterName: presenterName || 'Admin',
              },
            });
          } else if (isAdmin) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'sync-state-response',
              payload: {
                slide: currentSlideRef.current,
                url: presentationUrlRef.current,
                code: canvaLiveCodeRef.current,
                presenterName,
                isForcedFullscreen: isForcedFullscreenRef.current,
                designatedPresenter: designatedPresenterRef.current,
                activeGameSubmission: activeGameSubmissionRef.current,
              },
            });
          }
        }
      })
      .on('broadcast', { event: 'sync-state-response' }, ({ payload }) => {
        if (!payload) return;
        if (payload.slide) setCurrentSlide(payload.slide);
        if (payload.url) setPresentationUrl(payload.url);
        if (payload.code) setCanvaLiveCode(payload.code);
        if (payload.presenterName) setSyncedBy(payload.presenterName);
        if (typeof payload.isForcedFullscreen !== 'undefined') {
          setIsForcedFullscreen(!!payload.isForcedFullscreen);
        }
        if (typeof payload.designatedPresenter !== 'undefined') {
          setDesignatedPresenter(payload.designatedPresenter);
        }
        if (typeof payload.activeGameSubmission !== 'undefined') {
          setActiveGameSubmission(payload.activeGameSubmission);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'request-sync',
            payload: { timestamp: Date.now() },
          });
        }
      });

    return () => {
      cleanupWebRtc();
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [isAdmin, presenterName, cleanupWebRtc]);

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

  // Admin function: Toggle forced fullscreen for all students
  const toggleForceFullscreen = useCallback((forced) => {
    setIsForcedFullscreen(forced);
    isForcedFullscreenRef.current = forced;
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'force-fullscreen',
        payload: { forced, presenterName },
      });
    }
  }, [presenterName]);

  // Admin function: Assign student presenter access
  const assignPresenter = useCallback((data) => {
    setDesignatedPresenter(data);
    designatedPresenterRef.current = data;
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'assign-presenter',
        payload: data,
      });
    }
  }, []);

  // Admin function: Revoke student presenter access
  const revokePresenter = useCallback(() => {
    setDesignatedPresenter(null);
    designatedPresenterRef.current = null;
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'revoke-presenter',
        payload: {},
      });
    }
  }, []);

  // Function to set active game submission banner (on whiteboard & screenshare)
  const setGameSubmission = useCallback((submission) => {
    setActiveGameSubmission(submission);
    activeGameSubmissionRef.current = submission;
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'set-active-game-submission',
        payload: { submission },
      });
    }
  }, []);

  // Admin function: Send live announcement broadcast to all students
  const sendBroadcastAnnouncement = useCallback(({ text, type = 'banner', imageUrl = '', duration = 12000 }) => {
    const announcement = {
      id: `ann-${Date.now()}`,
      text: (text || '').trim(),
      type: type || 'banner',
      imageUrl: (imageUrl || '').trim(),
      duration: duration || 12000,
      senderName: presenterName || 'Admin',
      timestamp: Date.now(),
    };
    setActiveAnnouncement(announcement);
    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'admin-broadcast-announcement',
        payload: announcement,
      });
    }
  }, [presenterName]);

  const clearAnnouncement = useCallback(() => {
    setActiveAnnouncement(null);
  }, []);

  const clearNotification = useCallback(() => {
    setLastNotification(null);
  }, []);

  const updateBookshelfConfig = useCallback((newConfig) => {
    const merged = { ...bookshelfConfigRef.current, ...newConfig };
    setBookshelfConfig(merged);
    try {
      localStorage.setItem('virtual_bookshelf_config', JSON.stringify(merged));
    } catch (e) {}

    if (channelRef.current && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'bookshelf-config-update',
        payload: merged,
      });
    }
    setLastNotification('Target tab rak buku berhasil disimpan dan disiarkan');
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
    // WebRTC Screen Share
    isScreenSharing,
    screenStream,
    screenPresenterName,
    screenShareError,
    startScreenShare,
    stopScreenShare,
    // Forced Fullscreen
    isForcedFullscreen,
    toggleForceFullscreen,
    // Designated Student Presenter
    designatedPresenter,
    assignPresenter,
    revokePresenter,
    // Active Presentation Game Submission
    activeGameSubmission,
    setGameSubmission,
    // Live Broadcast Announcements
    activeAnnouncement,
    sendBroadcastAnnouncement,
    clearAnnouncement,
    // Bookshelf Target Configuration
    bookshelfConfig,
    updateBookshelfConfig,
  };
}
