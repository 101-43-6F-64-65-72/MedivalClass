// Native Web Audio API Sound Synthesizer for Retro RPG & Visual Novel Effects
// Zero external files, zero latency, 100% browser native

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Visual Novel dialogue typing chatter (Animalese / Retro RPG voice blip)
 */
export function playTypewriterBlip(char = '') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Skip spaces or punctuation for natural conversational cadence
    if (!char || char === ' ' || char === '\n') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Natural randomized vocal pitch variation around 390Hz - 440Hz
    const baseFreq = 410;
    const variation = (Math.random() - 0.5) * 50;
    osc.frequency.setValueAtTime(baseFreq + variation, ctx.currentTime);

    // Warm friendly triangle wave (like classic SNES / GBA RPG dialogue)
    osc.type = 'triangle';

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch (e) {
    // Ignore audio errors gracefully
  }
}

/**
 * Cheerful dialog open chime when interacting with Qeebos
 */
export function playDialogueOpen() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554, 659]; // A4, C#5, E5 (Major triad)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.045;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.07, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.19);
    });
  } catch (e) {}
}

/**
 * Subtle tick when hovering dialogue options
 */
export function playChoiceHover() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {}
}

/**
 * Satisfying wooden click on dialogue option select
 */
export function playChoiceClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  } catch (e) {}
}

/**
 * Magical ascending arpeggio when opening the Scroll Prompt
 */
export function playScrollOpen() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Ascending arpeggio)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  } catch (e) {}
}

/**
 * Cute twinkling blush sound for "Tolong ya sayang"
 */
export function playBlushChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 880, 1174.66]; // E5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.07, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  } catch (e) {}
}

/**
 * Soft close / decline sound
 */
export function playCloseSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
}

/**
 * Copy to clipboard success chime
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 880]; // D5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.07, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.23);
    });
  } catch (e) {}
}
