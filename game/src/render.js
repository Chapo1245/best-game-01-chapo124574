// Rendering: every pixel the player sees — world, HUD, shop, screens.
// One job: draw the current state. No game logic lives here.
import { VIEW_W, VIEW_H, TOWERS, TOWER_ORDER, ABILITIES, TOTAL_WAVES } from './config.js';
import { fmtGold } from './random.js';

const SHOP_Y = 648;
const SHOP_H = 64;

export class Renderer {
  constructor(game) { this.game = game; }
  draw(ctx, now) {
    const g = this.game;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    if (g.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    }
    g.map.drawGround(ctx, now);
    // Light overlay: darken ground that no tower lights (night only deepens it).
    this.drawDarkness(ctx, now);
    g.map.drawPads(ctx, g.hoverPad, g.selectedBuild, g.towers);
    for (const t of g.towers) t.draw(ctx, now, g.selectedTower === t || g.hoverPad === t.pad);
    for (const e of g.enemies) e.draw(ctx, now);
    for (const p of g.projectiles) p.draw(ctx);
    g.particles.draw(ctx);
    ctx.restore();
    this.drawHud(ctx, now);
    this.drawShop(ctx, now);
    if (g.selectedTower) this.drawTowerPanel(ctx, now);
    if (g.state === 'title') this.drawTitle(ctx, now);
    if (g.state === 'paused') this.drawPaused(ctx);
    if (g.state === 'victory') this.drawEnd(ctx, true);
    if (g.state === 'defeat') this.drawEnd(ctx, false);
    if (g.banner) this.drawBanner(ctx, now);
  }
  drawDarkness(ctx, now) {
    const g = this.game;
    // A dark veil on an offscreen canvas, with holes punched where towers shine,
    // then composited over the world. Never touches the ground beneath.
    if (!this._veil) {
      this._veil = document.createElement('canvas');
      this._veil.width = VIEW_W; this._veil.height = VIEW_H;
    }
    const v = this._veil.getContext('2d');
    v.clearRect(0, 0, VIEW_W, VIEW_H);
    v.fillStyle = g.director.night ? 'rgba(4,6,20,0.42)' : 'rgba(4,6,20,0.22)';
    v.fillRect(0, 0, VIEW_W, VIEW_H);
    v.globalCompositeOperation = 'destination-out';
    for (const t of g.towers) {
      const r = t.lightRadius() * (g.director.night ? 0.7 : 1);
      const grad = v.createRadialGradient(t.x, t.y, 10, t.x, t.y, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      v.fillStyle = grad;
      v.beginPath(); v.arc(t.x, t.y, r, 0, Math.PI * 2); v.fill();
    }
    v.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._veil, 0, 0);
  }
  drawHud(ctx, now) {
    const g = this.game;
    ctx.fillStyle = 'rgba(8,10,26,0.85)';
    ctx.fillRect(0, 0, VIEW_W, 44);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText('EMBERWARD', 14, 30);
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('🪙 ' + fmtGold(g.gold) + 'g', 190, 29);
    ctx.fillStyle = '#ff7a7a';
    ctx.fillText('♥'.repeat(Math.max(0, g.lives)) + (g.lives > 20 ? ' +' + (g.lives - 20) : ''), 320, 29);
    ctx.fillStyle = '#c9b8ff';
    const waveLabel = g.director.waveActive
      ? 'Wave ' + g.director.wave + '/' + TOTAL_WAVES + (g.director.night ? ' — NIGHT' : '')
      : (g.director.wave === 0 ? 'Build, then press SPACE' : 'Wave ' + g.director.wave + ' cleared');
    ctx.fillText(waveLabel, 520, 29);
    ctx.fillStyle = '#b8f5c8';
    ctx.fillText('Score ' + g.score, 830, 29);
    ctx.fillStyle = '#7fd4ff';
    ctx.fillText('Kills ' + g.kills, 960, 29);
    ctx.fillStyle = '#9aa3c7';
    const speedLabel = g.speed === 2 ? '⏩ 2×' : '▶ 1×';
    ctx.fillText(speedLabel + '  [P] pause  [M] sound ' + (g.sound.muted ? 'off' : 'on'), 1040, 29);
    // Wave progress bar.
    if (g.director.waveActive && g.director.totalToSpawn > 0) {
      const pct = g.director.spawned / g.director.totalToSpawn;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 44, VIEW_W, 5);
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(0, 44, VIEW_W * pct, 5);
    }
    // Between-wave countdown.
    if (!g.director.waveActive && g.state === 'playing' && g.director.wave > 0 && g.director.wave < TOTAL_WAVES) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('Next wave in ' + Math.ceil(Math.max(0, g.director.betweenTimer)) + 's — press SPACE to start now', VIEW_W / 2, 70);
    }
  }
  drawShop(ctx, now) {
    const g = this.game;
    ctx.fillStyle = 'rgba(8,10,26,0.9)';
    ctx.fillRect(0, SHOP_Y, VIEW_W, SHOP_H + 8);
    const cardW = 138, gap = 6;
    let x = 10;
    ctx.textAlign = 'left';
    for (const id of TOWER_ORDER) {
      const d = TOWERS[id];
      const afford = g.gold >= d.cost;
      const selected = g.selectedBuild === id;
      ctx.fillStyle = selected ? 'rgba(255,217,77,0.28)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = selected ? '#ffd94d' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(x, SHOP_Y + 6, cardW, SHOP_H - 12, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.arc(x + 18, SHOP_Y + 26, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = afford ? '#ffffff' : '#8a8fa8';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText(d.name, x + 34, SHOP_Y + 22);
      ctx.font = '12px Georgia, serif';
      ctx.fillStyle = afford ? '#ffe9a8' : '#8a8fa8';
      ctx.fillText(d.cost + 'g  [' + d.key + ']', x + 34, SHOP_Y + 40);
      ctx.fillStyle = '#9aa3c7';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(d.blurb, x + 8, SHOP_Y + 56, cardW - 12);
      x += cardW + gap;
    }
    // Abilities on the right.
    let ax = x + 4;
    for (const [id, ab] of Object.entries(ABILITIES)) {
      const cd = g.abilityCd[id] || 0;
      const afford = g.gold >= ab.cost && cd <= 0;
      ctx.fillStyle = afford ? 'rgba(127,212,255,0.18)' : 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = afford ? '#7fd4ff' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.roundRect(ax, SHOP_Y + 6, 88, SHOP_H - 12, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = afford ? '#ffffff' : '#8a8fa8';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillText(ab.name + ' [' + ab.key.toUpperCase() + ']', ax + 8, SHOP_Y + 24);
      ctx.font = '11px Georgia, serif';
      ctx.fillText(cd > 0 ? 'ready in ' + Math.ceil(cd) + 's' : ab.cost + 'g', ax + 8, SHOP_Y + 42);
      ax += 94;
    }
  }
  drawTowerPanel(ctx, now) {
    const g = this.game;
    const t = g.selectedTower;
    const px = 980, py = 60, pw = 280, ph = 150;
    ctx.fillStyle = 'rgba(8,10,26,0.92)';
    ctx.strokeStyle = t.def.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText(t.def.name + '  ·  Tier ' + t.tier + '/3', px + 14, py + 26);
    ctx.font = '13px Georgia, serif'; ctx.fillStyle = '#c9cfe8';
    const dmg = t.def.damage > 0 ? 'Damage ' + Math.round(t.damage()) + '  ·  Rate ' + t.rate().toFixed(1) + '/s' : 'Support tower — no attack';
    ctx.fillText(dmg, px + 14, py + 50);
    ctx.fillText('Range ' + Math.round(t.range()) + '  ·  Light ' + Math.round(t.lightRadius()), px + 14, py + 70);
    ctx.fillText('Kills ' + t.kills + '  ·  Invested ' + fmtGold(t.invested) + 'g', px + 14, py + 90);
    const uc = t.upgradeCost();
    ctx.fillStyle = uc !== null && g.gold >= uc ? '#7dff8a' : '#8a8fa8';
    ctx.fillText(uc !== null ? '[U] Upgrade — ' + uc + 'g' : 'Max tier reached', px + 14, py + 116);
    ctx.fillStyle = '#ff9a9a';
    ctx.fillText('[X] Sell — +' + fmtGold(t.sellValue()) + 'g', px + 14, py + 138);
  }
  drawBanner(ctx, now) {
    const g = this.game;
    const age = now - g.banner.at;
    if (age > 2.4) { g.banner = null; return; }
    const a = age < 0.3 ? age / 0.3 : age > 1.9 ? (2.4 - age) / 0.5 : 1;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(8,10,26,0.8)';
    ctx.fillRect(0, 300, VIEW_W, 84);
    ctx.fillStyle = g.banner.color || '#ffd94d';
    ctx.font = 'bold 40px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(g.banner.title, VIEW_W / 2, 340);
    ctx.font = '17px Georgia, serif'; ctx.fillStyle = '#e8ecff';
    ctx.fillText(g.banner.sub || '', VIEW_W / 2, 368);
    ctx.globalAlpha = 1;
  }
  drawTitle(ctx, now) {
    const g = this.game;
    ctx.fillStyle = 'rgba(4,6,20,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('EMBERWARD', VIEW_W / 2, 170);
    ctx.fillStyle = '#ffb347';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('Keep the last light burning. Hold the Vale through 40 waves of night.', VIEW_W / 2, 208);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '17px Georgia, serif';
    const lines = [
      'Wisps crawl in from the dark and march on the Vale gate. Build lantern-towers on the stone pads.',
      'Towers burn brighter in the light: enemies in the glow take +25% damage, shades hide their armor in the dark.',
      'Every 5th wave is a NIGHT wave — faster, tougher, richer. Every 10th wave brings a boss.',
      'Earn gold for every kill, bank interest between waves, upgrade towers, call a Meteor [Q] or Frost Nova [E].',
      'Lose all 20 hearts and the dark takes the Vale. Survive wave 40 and dawn breaks — you win.',
    ];
    lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 258 + i * 28));
    ctx.fillStyle = '#7dff8a';
    ctx.font = 'bold 20px Georgia, serif';
    const pulse = 0.7 + 0.3 * Math.sin(now * 3);
    ctx.globalAlpha = pulse;
    ctx.fillText('Press ENTER or click to begin  ·  Best score ' + g.best, VIEW_W / 2, 440);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#9aa3c7';
    ctx.font = '15px Georgia, serif';
    ctx.fillText('Mouse: select pads & towers  ·  1–7: build  ·  U: upgrade  ·  X: sell  ·  Space: start wave / speed  ·  P: pause', VIEW_W / 2, 480);
    ctx.fillText('7 tower kinds  ·  3 upgrade tiers  ·  6 enemy kinds  ·  4 bosses  ·  40 waves  ·  night waves  ·  interest economy', VIEW_W / 2, 508);
  }
  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(4,6,20,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 330);
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Press P to resume', VIEW_W / 2, 372);
  }
  drawEnd(ctx, won) {
    const g = this.game;
    ctx.fillStyle = won ? 'rgba(20,26,8,0.78)' : 'rgba(20,6,10,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#ffd94d' : '#ff7a7a';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(won ? 'DAWN BREAKS — YOU WIN' : 'THE DARK TAKES THE VALE', VIEW_W / 2, 240);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '20px Georgia, serif';
    const stats = 'Score ' + g.score + '   ·   Waves cleared ' + g.director.wave + '/' + TOTAL_WAVES +
      '   ·   Kills ' + g.kills + '   ·   Hearts left ' + Math.max(0, g.lives);
    ctx.fillText(stats, VIEW_W / 2, 292);
    if (won) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 30px Georgia, serif';
      const stars = g.lives >= 15 ? '★★★' : g.lives >= 8 ? '★★' : '★';
      ctx.fillText(stars, VIEW_W / 2, 340);
    }
    ctx.fillStyle = '#7dff8a';
    ctx.font = 'bold 20px Georgia, serif';
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 300);
    ctx.globalAlpha = pulse;
    ctx.fillText('Press R to play again  ·  Best score ' + g.best, VIEW_W / 2, 400);
    ctx.globalAlpha = 1;
  }
}
