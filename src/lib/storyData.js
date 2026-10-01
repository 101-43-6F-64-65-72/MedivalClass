/**
 * Complete Story Narratives
 * All dialog, narration, and story content
 */

import { STORY_DURATIONS as DURATIONS } from './constants';

export const STORY_PHASE_1 = {
  id: 'phase_1',
  title: 'Departure & Journey',
  scenes: [
    {
      id: 'phase_1_scene_1',
      name: 'Departure Intro',
      background: '/assets/backgrounds/harbor_dawn.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Selamat pagi, para pemberani! Aku Pleton, penasihat kapal ini.\nKami akan berlayar menuju petualangan yang mengubah segalanya.\nPerjalanan ini bukan sekadar petualangan biasa...`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_1_scene_2',
      name: 'Character Intro',
      background: '/assets/backgrounds/ocean_morning.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Kalian berempat adalah kru terbaik yang pernah aku lihat.\nMasing-masing kalian punya potensi luar biasa.\nMari kita berlayar ke lautan lepas!`,
      narration: `Mereka berlayar dengan penuh harapan,\nmenikmati indahnya laut yang tenang...`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_1_scene_3',
      name: 'The Open Sea',
      background: '/assets/backgrounds/ocean_open.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Lihatlah ke depan cakrawala. Di sanalah tempat dunia baru yang akan kita bangun bersama. Bersiaplah untuk segala kemungkinan!`,
      duration: DURATIONS.SCENE_MEDIUM,
    },
    {
      id: 'phase_1_scene_4',
      name: 'Ominous Skies',
      background: '/assets/backgrounds/storm_approaching.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_alert.png',
        position: 'left',
      },
      dialog: `Tunggu sebentar... Angin mendadak berubah arah. Langit menghitam dengan cepat! Pegangan semuanya!`,
      narration: `Awan kelam menggulung langit, ombak mulai meninggi dan mengguncang kapal!`,
      duration: DURATIONS.SCENE_LONG,
    },
  ],
};

export const STORY_PHASE_2 = {
  id: 'phase_2',
  title: 'Storm Event',
  scenes: [
    {
      id: 'phase_2_scene_1',
      name: 'Brutal Storm Strikes',
      background: '/assets/backgrounds/storm_intense.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_worried.png',
        position: 'left',
      },
      dialog: `Badai ini terlalu ganas! Kemudi tidak merespons! Jaga posisi kalian masing-masing!`,
      narration: `Petir menyambar geladak kapal, angin menderu memekakkan telinga!`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_2_scene_2',
      name: 'Ship Crashing',
      background: '/assets/backgrounds/storm_wreck.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_desperate.png',
        position: 'left',
      },
      dialog: `Karang di depan! Kita tidak bisa menghindar lagi! SEMUA BERTAHAN!`,
      narration: `KRAAASH! Lambung kapal menghantam batu karang besar dan terbelah...`,
      duration: DURATIONS.SCENE_EXTRA_LONG,
    },
    {
      id: 'phase_2_scene_3',
      name: 'Waiting For Rescue',
      background: '/assets/backgrounds/storm_fading.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_injured.png',
        position: 'left',
      },
      dialog: `Apakah kalian semua selamat?! Cepat periksa rekan-rekanmu!`,
      narration: `Menunggu konfirmasi admin untuk memastikan semua selamat...`,
      duration: DURATIONS.SCENE_LONG,
    },
  ],
};

export const STORY_PHASE_3 = {
  id: 'phase_3',
  title: 'Aftermath & Role Division',
  scenes: [
    {
      id: 'phase_3_scene_1',
      name: 'Washed Ashore',
      background: '/assets/backgrounds/beach_morning.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Syukurlah... Kita terdampar di pulau tak bertuan, tapi kita semua masih hidup.`,
      duration: DURATIONS.SCENE_MEDIUM,
    },
    {
      id: 'phase_3_scene_2',
      name: 'Survival Mission',
      background: '/assets/backgrounds/beach_camp.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Untuk bisa bertahan dan membangun peradaban baru di sini, kita butuh spesialisasi tugas. Kita harus berbagi peran!`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_3_scene_3',
      name: 'Assigning Roles',
      background: '/assets/backgrounds/beach_camp.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_proud.png',
        position: 'left',
      },
      dialog: `Ada yang memimpin koordinasi (Leader), merancang visual (Designer), membangun sistem (Mechanic), dan merajut kisah (Narrative).`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_3_scene_4',
      name: 'Ready to Plan',
      background: '/assets/backgrounds/beach_sunset.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Kini saatnya berdiskusi di meja strategi dan merumuskan Master Prompt game kita bersama!`,
      duration: DURATIONS.SCENE_MEDIUM,
    },
  ],
};

export const STORY_PHASE_4 = {
  id: 'phase_4',
  title: 'Discussion & Master Prompt',
  scenes: [
    {
      id: 'phase_4_scene_1',
      name: 'Brainstorming Table',
      background: '/assets/backgrounds/strategy_table.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_normal.png',
        position: 'left',
      },
      dialog: `Gunakan ruang obrolan untuk berdiskusi dengan timmu. Rumuskan ide game, mekanik inti, dan target permainan dengan teliti!`,
      duration: DURATIONS.SCENE_LONG,
    },
  ],
};

export const STORY_PHASE_5 = {
  id: 'phase_5',
  title: 'Tragedy & Farewell',
  scenes: [
    {
      id: 'phase_5_scene_1',
      name: 'The Mission Complete',
      background: '/assets/backgrounds/beacon_lit.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_proud.png',
        position: 'left',
      },
      dialog: `Kalian berhasil menyusun Master Prompt yang luar biasa! Fondasi dunia baru telah tercipta.`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_5_scene_2',
      name: 'Fading Light',
      background: '/assets/backgrounds/mystic_glow.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_mystic.png',
        position: 'left',
      },
      dialog: `Namun... waktuku di dunia ini telah habis. Tubuhku perlahan memudar...`,
      narration: `Cahaya mistis menyelimuti sosok Pleton, partikel cahaya berterbangan di udara.`,
      duration: DURATIONS.SCENE_EXTRA_LONG,
    },
    {
      id: 'phase_5_scene_3',
      name: 'The Final Gift',
      background: '/assets/backgrounds/mystic_glow.png',
      character: {
        name: 'Pleton',
        portrait: '/assets/characters/pleton_smile.png',
        position: 'left',
      },
      dialog: `Jangan bersedih. Karya dan mimpi kalian kini ada di tangan kalian sendiri. Teruslah berkreasi!`,
      duration: DURATIONS.SCENE_LONG,
    },
    {
      id: 'phase_5_scene_4',
      name: 'The Disappearance',
      background: '/assets/backgrounds/beach_dawn_empty.png',
      character: null,
      dialog: '',
      narration: `Pleton pun menghilang bersama semilir angin fajar, meninggalkan cetak biru dunia baru untuk kalian wujudkan.`,
      duration: DURATIONS.SCENE_EXTRA_LONG,
    },
    {
      id: 'phase_5_scene_5',
      name: 'The Journey Continues',
      background: '/assets/backgrounds/epilogue.png',
      character: null,
      dialog: '',
      narration: `Perjalanan sesungguhnya baru saja dimulai...\nSelamat berjuang, Tim Kreator!`,
      duration: DURATIONS.SCENE_EXTRA_LONG,
    },
  ],
};

// Export all story data
export const ALL_STORIES = {
  phase_1: STORY_PHASE_1,
  phase_2: STORY_PHASE_2,
  phase_3: STORY_PHASE_3,
  phase_4: STORY_PHASE_4,
  phase_5: STORY_PHASE_5,
};
