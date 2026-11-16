// The map: path geometry, build pads, and the light map.
// One job: where things are, and which ground is lit.
import { PATH_TILES, PAD_TILES, TILE, VIEW_W, VIEW_H } from './config.js';
import { clamp } from './random.js';

export class GameMap {
  constructor() {
    // Waypoints in pixels (tile centres).
    this.waypoints = PATH_TILES.map(([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }));
    this.pathSet = new Set(PATH_TILES.map(([tx, ty]) => tx + ',' + ty));
    this.pads = PAD_TILES.map(([tx, ty]) => ({
      tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, tower: null,
    }));
    this.padByKey = new Map(this.pads.map((p) => [p.tx + ',' + p.ty, p]));
  }
  padAtPixel(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return this.padByKey.get(tx + ',' + ty) || null;
  }
  // Distance from a point to the path polyline (for light/shade checks).
  distToPath(x, y) {
    let best = Infinity;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i], b = this.waypoints[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
      t = clamp(t, 0, 1);
      const px = a.x + dx * t, py = a.y + dy * t;
      best = Math.min(best, Math.hypot(x - px, y - py));
    }
    return best;
  }
  // Is a point lit by any tower/brazier light? Towers is the live list.
  litAt(x, y, towers, night) {
    for (const t of towers) {
      const light = t.lightRadius() * (night ? 0.7 : 1);
      if (Math.hypot(x - t.x, y - t.y) <= light) return true;
    }
    return false;
  }
  drawGround(ctx, time) {
    // Night sky gradient + vignette base.
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#0d1030'); g.addColorStop(0.55, '#141a3d'); g.addColorStop(1, '#0a0c22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Stars.
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 70; i++) {
      const sx = (i * 173) % VIEW_W, sy = (i * 97) % 300;
      const tw = 0.3 + 0.2 * Math.sin(time * 2 + i);
      ctx.globalAlpha = Math.max(0.1, tw);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Grass tufts / ground texture dots.
    ctx.fillStyle = 'rgba(90,140,90,0.16)';
    for (let i = 0; i < 130; i++) {
      const gx = (i * 211) % VIEW_W, gy = 320 + ((i * 137) % 380);
      ctx.fillRect(gx, gy, 3, 6);
    }
    // The path: warm cobbles.
    ctx.strokeStyle = '#3d2b1a'; ctx.lineWidth = 52; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    this.waypoints.forEach((w, i) => (i === 0 ? ctx.moveTo(w.x, w.y) : ctx.lineTo(w.x, w.y)));
    ctx.stroke();
    ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 44;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,190,90,0.25)'; ctx.lineWidth = 2;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    this.waypoints.forEach((w, i) => (i === 0 ? ctx.moveTo(w.x, w.y) : ctx.lineTo(w.x, w.y)));
    ctx.stroke();
    ctx.setLineDash([]);
    // Gate (exit) and spawn portal (entry).
    const s = this.waypoints[0], e = this.waypoints[this.waypoints.length - 1];
    ctx.fillStyle = '#1a0f2e';
    ctx.beginPath(); ctx.arc(s.x - 18, s.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8f7bff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#c9b8ff'; ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('DARK', s.x - 18, s.y + 4);
    ctx.fillStyle = '#3a2a12';
    ctx.fillRect(e.x - 6, e.y - 34, 12, 68);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(e.x, e.y - 40, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5c14'; ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText('VALE', e.x, e.y + 52);
  }
  drawPads(ctx, hoverPad, selectedId, towers) {
    for (const p of this.pads) {
      if (p.tower) continue;
      ctx.fillStyle = 'rgba(255,220,140,0.10)';
      ctx.strokeStyle = 'rgba(255,220,140,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,220,140,0.5)';
      ctx.font = '16px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('+', p.x, p.y + 6);
    }
    if (hoverPad && !hoverPad.tower) {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hoverPad.x, hoverPad.y, 28, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
