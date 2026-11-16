// Enemies: spawn, walk the path, take damage, leak at the gate.
// One job: everything a wisp/brute/boss does.
import { ENEMIES, BOSSES, isNightWave } from './config.js';
import { clamp } from './random.js';

let nextId = 1;

export class Enemy {
  constructor(type, hpMul, waypoints, night, isBoss) {
    const def = isBoss ? BOSSES[type] : ENEMIES[type];
    this.id = nextId++;
    this.type = type;
    this.name = def.name;
    this.isBoss = !!isBoss;
    this.waypoints = waypoints;
    this.wp = 0;
    this.x = waypoints[0].x - 30;
    this.y = waypoints[0].y;
    let hp = def.hp * hpMul;
    let speed = def.speed;
    if (night) { hp *= 1.35; speed *= 1.15; }
    this.maxHp = hp; this.hp = hp;
    this.speed = speed;
    this.baseSpeed = speed;
    this.gold = def.gold * (night ? 1.5 : 1);
    this.size = def.size;
    this.color = def.color;
    this.armored = !!def.armored;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.frozenUntil = 0;
    this.knock = 0; // distance pushed back along path
    this.dist = 0; // total distance travelled (targeting: furthest along)
    this.dead = false;
    this.leaked = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
  }
  slowUntilTime(now, dur, factor) {
    this.slowUntil = now + dur;
    this.slowFactor = Math.min(this.slowFactor, factor);
  }
  freezeUntil(now, dur) { this.frozenUntil = Math.max(this.frozenUntil, now + dur); }
  pushBack(px) { this.knock += px; }
  damage(amount, now, lit) {
    let dmg = amount;
    if (lit) dmg *= 1.25; // burning in the light
    if (this.armored && !lit) dmg *= 0.6; // shades shrug off blows in the dark
    this.hp -= dmg;
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.dead = true;
    return dmg;
  }
  update(dt, now) {
    if (this.dead || this.leaked) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (now < this.frozenUntil) return; // frozen solid
    let sp = this.speed;
    if (now < this.slowUntil) sp *= this.slowFactor;
    // Knockback: slide back along the path.
    if (this.knock > 0) {
      const back = Math.min(this.knock, sp * dt * 2.2);
      this.knock -= back;
      this.dist -= back;
      // Recompute position from dist by walking backwards is costly; instead
      // move toward the previous waypoint.
      const target = this.waypoints[Math.max(0, this.wp - 1)];
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = Math.min(d, back);
      this.x += (dx / d) * step; this.y += (dy / d) * step;
      return;
    }
    const target = this.waypoints[this.wp + 1] || this.waypoints[this.waypoints.length - 1];
    const dx = target.x - this.x, dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = sp * dt;
    if (d <= step) {
      this.x = target.x; this.y = target.y;
      this.wp++;
      if (this.wp >= this.waypoints.length - 1) { this.leaked = true; return; }
    } else {
      this.x += (dx / d) * step; this.y += (dy / d) * step;
    }
    this.dist += step;
    this.wobble += dt * 4;
  }
  draw(ctx, now) {
    const bob = Math.sin(this.wobble) * 2;
    const x = this.x, y = this.y + bob;
    // Shadow-glow body.
    const g = ctx.createRadialGradient(x, y, 2, x, y, this.size + 8);
    g.addColorStop(0, this.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, this.size + 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
    ctx.beginPath(); ctx.arc(x, y, this.size, 0, Math.PI * 2); ctx.fill();
    // Eyes — two pale dots facing along the path.
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath(); ctx.arc(x - this.size * 0.35, y - 2, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + this.size * 0.35, y - 2, 2.6, 0, Math.PI * 2); ctx.fill();
    if (this.isBoss) {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, this.size + 6, 0, Math.PI * 2); ctx.stroke();
      // Crown spikes.
      ctx.fillStyle = '#ffd94d';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 10 - 5, y - this.size - 2);
        ctx.lineTo(x + i * 10, y - this.size - 14);
        ctx.lineTo(x + i * 10 + 5, y - this.size - 2);
        ctx.fill();
      }
    }
    // Frozen tint.
    if (now < this.frozenUntil) {
      ctx.fillStyle = 'rgba(127,212,255,0.45)';
      ctx.beginPath(); ctx.arc(x, y, this.size + 2, 0, Math.PI * 2); ctx.fill();
    }
    // HP bar (only when hurt).
    if (this.hp < this.maxHp) {
      const w = this.size * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - w / 2, y - this.size - 12, w, 5);
      ctx.fillStyle = this.isBoss ? '#ff5d5d' : '#7dff8a';
      ctx.fillRect(x - w / 2, y - this.size - 12, w * clamp(this.hp / this.maxHp, 0, 1), 5);
    }
  }
}
