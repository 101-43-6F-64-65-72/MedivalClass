/**
 * Auto-classifier for student game submissions.
 * Automatically identifies platform, category, and display styling from the URL alone.
 * User only needs to provide the game URL.
 */

export const GAME_CATEGORIES = [
  'Semua Kategori',
  'Next.js / Web Multiplayer',
  'Scratch / Block Game',
  'Itch.io Indie Game',
  'Roblox Experience',
  'GitHub Web Game',
  'Netlify Web Game',
  'Gameplay & Demo Video',
  'Build File / Game Package',
  'Game Design & Prototype',
  'Web Game / HTML5'
];

export function classifyGameUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      category: 'Web Game / HTML5',
      platform: 'Web Kustom',
      badgeClass: 'bg-blue-950 text-blue-300 border-blue-700',
      tag: 'HTML5',
      cleanUrl: ''
    };
  }

  const clean = url.trim();
  const lower = clean.toLowerCase();

  // Scratch
  if (lower.includes('scratch.mit.edu')) {
    return {
      category: 'Scratch / Block Game',
      platform: 'Scratch',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
      tag: 'Scratch',
      cleanUrl: clean
    };
  }

  // Itch.io
  if (lower.includes('itch.io')) {
    return {
      category: 'Itch.io Indie Game',
      platform: 'Itch.io',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-700',
      tag: 'Itch.io',
      cleanUrl: clean
    };
  }

  // Roblox
  if (lower.includes('roblox.com')) {
    return {
      category: 'Roblox Experience',
      platform: 'Roblox',
      badgeClass: 'bg-purple-950 text-purple-300 border-purple-700',
      tag: 'Roblox',
      cleanUrl: clean
    };
  }

  // Vercel / Next.js
  if (lower.includes('vercel.app')) {
    return {
      category: 'Next.js / Web Multiplayer',
      platform: 'Vercel Next.js',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      tag: 'Web Multiplayer',
      cleanUrl: clean
    };
  }

  // GitHub Pages or Repository
  if (lower.includes('github.io') || lower.includes('github.com')) {
    return {
      category: 'GitHub Web Game',
      platform: 'GitHub Pages',
      badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-700',
      tag: 'GitHub',
      cleanUrl: clean
    };
  }

  // Netlify
  if (lower.includes('netlify.app')) {
    return {
      category: 'Netlify Web Game',
      platform: 'Netlify',
      badgeClass: 'bg-teal-950 text-teal-300 border-teal-700',
      tag: 'Netlify Web',
      cleanUrl: clean
    };
  }

  // YouTube gameplay video demo
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      category: 'Gameplay & Demo Video',
      platform: 'YouTube',
      badgeClass: 'bg-red-950 text-red-300 border-red-700',
      tag: 'Video Demo',
      cleanUrl: clean
    };
  }

  // Google Drive
  if (lower.includes('drive.google.com')) {
    return {
      category: 'Build File / Game Package',
      platform: 'Google Drive',
      badgeClass: 'bg-yellow-950 text-yellow-300 border-yellow-700',
      tag: 'Build Package',
      cleanUrl: clean
    };
  }

  // Canva
  if (lower.includes('canva.com')) {
    return {
      category: 'Game Design & Prototype',
      platform: 'Canva',
      badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-700',
      tag: 'Prototype',
      cleanUrl: clean
    };
  }

  // Fallback
  return {
    category: 'Web Game / HTML5',
    platform: 'Web Kustom',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-700',
    tag: 'Web Game',
    cleanUrl: clean
  };
}
