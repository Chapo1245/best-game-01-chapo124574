// Particles + floating combat text. One job: juice — embers, bursts, rings.
export class Particles {
  constructor() { this.list = []; this.texts = []; }
  burst(x, y, color, n, speed, life, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3,
        life: life * (0.6 + Math.random() * 0.7), maxLife: life,
        size: size * (0.6 + Math.random() * 0.8), color,
      });
    }
  }
  ring(x, y, color, maxR) {
    this.list.push({ x, y, ring: true, r: 8, maxR, life: 0.45, maxLife: 0.45, color });
  }
  emberTrail(x, y) {
    this.list.push({
      x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 12, vy: -18 - Math.random() * 20,
      life: 0.7, maxLife: 0.7, size: 2.5, color: '#ffb347',
    });
  }
  floatText(x, y, text, color) {
    this.texts.push({ x, y, text, color: color || '#ffe9a8', life: 0.9, maxLife: 0.9 });
  }
  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      if (p.ring) { p.r += (p.maxR - p.r) * dt * 10; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= (1 - dt * 1.5);
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 34 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
  }
  draw(ctx) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.maxLife);
      if (p.ring) {
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = p.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
