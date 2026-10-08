/**
 * Tiny synthesized sound effects (Web Audio API) – no audio files to ship.
 * Muted state persists in localStorage; it's a UI preference, not progress.
 */
const MUTE_KEY = "habla:muted";
let ctx: AudioContext | null = null;

export const isMuted = () => typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
export const setMuted = (muted: boolean) => localStorage.setItem(MUTE_KEY, muted ? "1" : "0");

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

function play(notes: [number, number, number, OscillatorType?][]) {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    ctx ??= new AudioContext();
    notes.forEach(([f, s, d, t]) => tone(f, s, d, t));
  } catch {
    // Audio is decoration; never let it break the lesson.
  }
}

export const sfx = {
  correct: () => play([[660, 0, 0.12], [990, 0.09, 0.22]]),
  wrong: () => play([[220, 0, 0.18, "triangle"], [180, 0.12, 0.25, "triangle"]]),
  complete: () => play([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1047, 0.36, 0.4]]),
};
