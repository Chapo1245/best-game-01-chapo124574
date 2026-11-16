// WebAudio synth: every sound is generated, no audio files.
// One job: sound effects + a quiet ambient music loop, with mute.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  toggleMute() { this.muted = !this.muted; return this.muted; }
  tone(freq, dur, type, vol, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol, filterFreq) {
    if (this.muted) return;
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq || 1200;
    const g = ctx.createGain(); g.gain.value = vol || 0.2;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }
  shoot() { this.tone(720 + Math.random() * 160, 0.09, 'square', 0.05, 320); }
  hit() { this.noise(0.08, 0.08, 2400); }
  die() { this.tone(300, 0.22, 'triangle', 0.12, 60); this.noise(0.12, 0.1, 900); }
  coin() { this.tone(1180, 0.07, 'sine', 0.1); setTimeout(() => this.tone(1560, 0.1, 'sine', 0.1), 60); }
  build() { this.tone(220, 0.14, 'triangle', 0.14, 440); this.noise(0.1, 0.08, 1600); }
  upgrade() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.12), i * 70)); }
  leak() { this.tone(180, 0.4, 'sawtooth', 0.16, 70); }
  horn() { this.tone(196, 0.5, 'sawtooth', 0.1, 196); setTimeout(() => this.tone(294, 0.5, 'sawtooth', 0.1), 120); }
  boss() { this.tone(90, 0.9, 'sawtooth', 0.2, 45); this.noise(0.7, 0.14, 500); }
  meteor() { this.noise(0.5, 0.25, 700); this.tone(120, 0.5, 'sawtooth', 0.14, 40); }
  freeze() { this.tone(1400, 0.4, 'sine', 0.1, 2200); }
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.14), i * 130)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.13), i * 180)); }
  click() { this.tone(900, 0.05, 'square', 0.06); }
  denied() { this.tone(140, 0.15, 'square', 0.1, 110); }
  startMusic() {
    if (this.musicTimer) return;
    const scale = [220, 261.6, 329.6, 392, 440, 523.3];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const f = scale[this.musicStep % scale.length];
      this.tone(f, 1.6, 'sine', 0.035);
      if (this.musicStep % 3 === 0) this.tone(f / 2, 2.2, 'triangle', 0.03);
      this.musicStep++;
    }, 900);
  }
}
