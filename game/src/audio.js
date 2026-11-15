// All sound is synthesized with WebAudio — no audio files, no network.
// A tiny synth: tones, sweeps and filtered noise, plus a quiet night drone.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    drone: null,
  };
  return audio;
}

function ensureContext(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audio.ctx = new Ctor();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.5;
  audio.master.connect(audio.ctx.destination);
  return audio.ctx;
}

function tone(audio, { freq = 440, to = null, dur = 0.15, type = 'sine', vol = 0.2, when = 0 }) {
  const ctx = ensureContext(audio);
  if (!ctx || audio.muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(audio, { dur = 0.2, vol = 0.15, freq = 1200, when = 0 }) {
  const ctx = ensureContext(audio);
  if (!ctx || audio.muted) return;
  const t0 = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  src.start(t0);
}

export const sfx = {
  pickup(audio) {
    tone(audio, { freq: 880, to: 1320, dur: 0.12, type: 'sine', vol: 0.16 });
  },
  burn(audio) {
    noiseBurst(audio, { dur: 0.14, vol: 0.1, freq: 2400 });
    tone(audio, { freq: 320, to: 90, dur: 0.16, type: 'triangle', vol: 0.1 });
  },
  flare(audio) {
    noiseBurst(audio, { dur: 0.35, vol: 0.22, freq: 900 });
    tone(audio, { freq: 180, to: 720, dur: 0.3, type: 'sawtooth', vol: 0.08 });
  },
  lightBrazier(audio) {
    [523, 659, 784, 1047].forEach((f, i) => tone(audio, { freq: f, dur: 0.5, type: 'sine', vol: 0.16, when: i * 0.09 }));
  },
  hurt(audio) {
    tone(audio, { freq: 220, to: 55, dur: 0.35, type: 'sawtooth', vol: 0.22 });
    noiseBurst(audio, { dur: 0.2, vol: 0.14, freq: 300 });
  },
  denied(audio) {
    tone(audio, { freq: 160, dur: 0.12, type: 'square', vol: 0.08 });
  },
  night(audio) {
    [392, 494].forEach((f, i) => tone(audio, { freq: f, dur: 0.4, type: 'triangle', vol: 0.12, when: i * 0.12 }));
  },
  win(audio) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(audio, { freq: f, dur: 0.6, type: 'sine', vol: 0.16, when: i * 0.13 }));
  },
  lose(audio) {
    [392, 330, 262, 196].forEach((f, i) => tone(audio, { freq: f, dur: 0.55, type: 'triangle', vol: 0.14, when: i * 0.18 }));
  },
  click(audio) {
    tone(audio, { freq: 660, dur: 0.07, type: 'sine', vol: 0.12 });
  },
};

// A soft two-oscillator night drone that starts on the first user gesture.
export function startDrone(audio) {
  const ctx = ensureContext(audio);
  if (!ctx || audio.drone) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  gain.connect(audio.master);
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = 55;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = 82.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  o1.connect(gain);
  o2.connect(gain);
  o1.start();
  o2.start();
  lfo.start();
  audio.drone = { o1, o2, lfo, gain };
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
  return audio.muted;
}
