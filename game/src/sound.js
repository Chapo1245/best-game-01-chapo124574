// Tiny WebAudio synth for EMBERDECK: no assets, all beeps are oscillators.
// Lazy AudioContext (created on first user gesture), every call guarded.
let ctx = null;
let muted = false;
export function setMuted(m) {
  muted = m;
}
export function isMuted() {
  return muted;
}
function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
export function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + when);
    o.stop(c.currentTime + when + dur + 0.02);
  } catch {
    // Audio is decoration; never break the game.
  }
}
export const sfx = {
  click: () => tone(660, 0.06, 'triangle', 0.05),
  place: () => { tone(392, 0.09, 'triangle', 0.09); tone(587, 0.12, 'triangle', 0.07, 0.06); },
  coin: () => { tone(988, 0.07, 'sine', 0.06); tone(1319, 0.1, 'sine', 0.05, 0.05); },
  shoot: () => tone(880, 0.04, 'square', 0.02),
  die: () => tone(330, 0.12, 'triangle', 0.06),
  draft: () => { tone(523, 0.12, 'sine', 0.07); tone(784, 0.16, 'sine', 0.07, 0.08); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.12)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.05, i * 0.14)); },
};
