// Towers: placement, targeting, firing, upgrades, selling.
// One job: everything a tower does once it stands on a pad.
import { TOWERS, UPGRADE_TIERS, SELL_RATE } from './config.js';
import { clamp } from './random.js';

let nextId = 1;

export class Tower {
  constructor(defId, pad) {
    this.id = nextId++;
    this.defId = defId;
    this.def = TOWERS[defId];
    this.pad = pad;
    this.x = pad.x; this.y = pad.y;
    this.tier = 0;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.invested = this.def.cost;
    this.kills = 0;
    this.flash = 0;
  }
  damage() {
    const t = UPGRADE_TIERS[this.tier];
    return this.def.damage * (t ? t.dmgMul : 1);
  }
  rate() {
    const t = UPGRADE_TIERS[this.tier];
    return this.def.rate * (t ? t.rateMul : 1);
  }
  range() {
    if (this.defId === 'warden') return 190 + this.tier * 25;
    return this.def.range + this.tier * 12;
  }
  lightRadius() {
    const t = UPGRADE_TIERS[this.tier];
    return this.def.light + (t ? t.lightAdd : 0);
  }
  // Warden buff: +30% damage per warden tier to towers in its range.
  buffAt(x, y) {
    if (this.defId !== 'warden') return 0;
    const d = Math.hypot(x - this.x, y - this.y);
    return d <= this.range() ? this.def.buff + this.tier * 0.1 : 0;
  }
  upgradeCost() {
    if (this.tier >= 3) return null;
    return Math.round(this.def.cost * UPGRADE_TIERS[this.tier + 1].costMul);
  }
  upgrade() {
    const c = this.upgradeCost();
    if (c === null) return false;
    this.invested += c;
    this.tier++;
    return true;
  }
  sellValue() { return Math.floor(this.invested * SELL_RATE); }
  // Pick the enemy furthest along the path within range.
  acquire(enemies) {
    let best = null;
    for (const e of enemies) {
      if (e.dead || e.leaked) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) > this.range()) continue;
      if (!best || e.dist > best.dist) best = e;
    }
    return best;
  }
  // Fire one shot. Returns a projectile description or null.
  // damageFn is applied by the game (buffs, light) — towers report raw hits.
  update(dt, enemies, now, fire) {
    this.flash = Math.max(0, this.flash - dt);
    this.cooldown -= dt;
    if (this.defId === 'warden' || this.defId === 'brazier') return;
    const target = this.acquire(enemies);
    if (!target) return;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    if (this.cooldown > 0) return;
    this.cooldown = 1 / this.rate();
    this.flash = 0.08;
    fire(this, target);
  }
  draw(ctx, now, showRange) {
    const x = this.x, y = this.y;
    if (showRange) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = this.def.color;
      ctx.beginPath(); ctx.arc(x, y, this.range(), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = this.def.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, this.range(), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Light halo.
    const lg = ctx.createRadialGradient(x, y, 4, x, y, this.lightRadius());
    lg.addColorStop(0, this.def.color + '55');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(x, y, this.lightRadius(), 0, Math.PI * 2); ctx.fill();
    // Stone base.
    ctx.fillStyle = '#4a4038';
    ctx.beginPath(); ctx.arc(x, y + 6, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b5d4f';
    ctx.beginPath(); ctx.arc(x, y + 4, 18, 0, Math.PI * 2); ctx.fill();
    // Body by kind.
    if (this.defId === 'brazier') {
      ctx.fillStyle = '#2e2118';
      ctx.fillRect(x - 10, y - 8, 20, 16);
      ctx.fillStyle = this.def.color;
      const fl = 6 + Math.sin(now * 6 + this.id) * 2;
      ctx.beginPath(); ctx.arc(x, y - 12, fl, 0, Math.PI * 2); ctx.fill();
    } else if (this.defId === 'warden') {
      ctx.fillStyle = '#8a6d3b';
      ctx.fillRect(x - 8, y - 26, 16, 30);
      ctx.fillStyle = this.def.color;
      ctx.beginPath(); ctx.arc(x, y - 30, 9, 0, Math.PI * 2); ctx.fill();
    } else {
      // Rotating barrel / crystal aimed at the last target.
      ctx.save();
      ctx.translate(x, y - 8);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.def.color;
      ctx.fillRect(0, -5, 24, 10);
      ctx.restore();
      ctx.fillStyle = this.def.color;
      ctx.beginPath(); ctx.arc(x, y - 8, 11 + this.tier * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(x, y - 8, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Tier pips.
    for (let i = 0; i < this.tier; i++) {
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(x - 10 + i * 10, y + 16, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (this.flash > 0) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y - 8, 14, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
