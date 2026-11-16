// EMBERWARD — game state machine, main loop, projectiles, abilities, shots.
// One job: own the state and advance it; rendering lives in render.js.
import { VIEW_W, VIEW_H, TOWERS, TOWER_ORDER, ABILITIES, TOTAL_WAVES, START_GOLD, START_LIVES } from './config.js';
import { GameMap } from './map.js';
import { Tower } from './towers.js';
import { Enemy } from './enemies.js';
import { WaveDirector } from './waves.js';
import { Particles } from './particles.js';
import { SoundBank } from './audio.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { clamp } from './random.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = new GameMap();
    this.particles = new Particles();
    this.sound = new SoundBank();
    this.renderer = new Renderer(this);
    this.director = new WaveDirector(this);
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.state = 'title'; // title | playing | paused | victory | defeat
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.score = 0;
    this.kills = 0;
    this.speed = 1;
    this.shake = 0;
    this.time = 0;
    this.banner = null;
    this.selectedBuild = null;
    this.selectedTower = null;
    this.hoverPad = null;
    this.mouse = { x: 0, y: 0 };
    this.abilityCd = { meteor: 0, frostnova: 0 };
    this.best = 0;
    try { this.best = parseInt(localStorage.getItem('emberward_best') || '0', 10) || 0; } catch (e) { /* no storage */ }
    this.shotMode = null;
    new Input(this, canvas);
  }
  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try { localStorage.setItem('emberward_best', String(this.best)); } catch (e) { /* ignore */ }
    }
  }
  // ---- state transitions ----
  startGame() {
    this.reset();
    this.state = 'playing';
    this.sound.ensure();
    this.sound.startMusic();
    this.showBanner('NIGHT 1 — THE DARK STIRS', 'Build your towers, then press SPACE to call the wave', '#ffd94d');
  }
  reset() {
    this.map = new GameMap();
    this.enemies = []; this.towers = []; this.projectiles = [];
    this.gold = START_GOLD; this.lives = START_LIVES;
    this.score = 0; this.kills = 0; this.speed = 1;
    this.abilityCd = { meteor: 0, frostnova: 0 };
    this.selectedBuild = null; this.selectedTower = null;
    this.director = new WaveDirector(this);
    this.director.betweenTimer = 0;
  }
  beginWave(n) {
    if (this.state !== 'playing') return;
    this.director.startWave(n);
    const night = this.director.night;
    this.sound.horn();
    this.showBanner(
      (night ? 'NIGHT WAVE ' : 'WAVE ') + n + (this.director.bossType ? ' — BOSS' : ''),
      night ? 'The dark deepens. Light is your only shield.' : 'Hold the line, Keeper.',
      night ? '#b06bff' : '#ffd94d',
    );
  }
  onWaveCleared() {
    const { interest, bonus } = this.director.waveEndPayout();
    this.particles.floatText(VIEW_W / 2, 120, 'Wave bonus +' + bonus + 'g  ·  interest +' + interest + 'g', '#7dff8a');
    this.sound.coin();
    if (this.director.wave >= TOTAL_WAVES) { this.gameOver(true); return; }
    this.director.betweenTimer = 18;
    this.showBanner('WAVE ' + this.director.wave + ' CLEARED', 'Banked +' + bonus + 'g, interest +' + interest + 'g. Rebuild, then SPACE.', '#7dff8a');
  }
  onBossSpawn(boss) {
    this.sound.boss();
    this.showBanner(boss.name.toUpperCase() + ' APPROACHES', 'A boss walks the path. Focus fire!', '#ff5d5d');
  }
  gameOver(won) {
    this.state = won ? 'victory' : 'defeat';
    this.saveBest();
    if (won) this.sound.win(); else this.sound.lose();
  }
  showBanner(title, sub, color) { this.banner = { title, sub, color, at: this.time }; }
  // ---- economy / building ----
  tryBuild(defId, pad) {
    const def = TOWERS[defId];
    if (!pad || pad.tower) return false;
    if (this.gold < def.cost) { this.sound.denied(); return false; }
    this.gold -= def.cost;
    const t = new Tower(defId, pad);
    pad.tower = t;
    this.towers.push(t);
    this.sound.build();
    this.particles.burst(t.x, t.y - 8, def.color, 14, 120, 0.5, 3);
    return true;
  }
  tryUpgrade() {
    const t = this.selectedTower;
    if (!t) return;
    const c = t.upgradeCost();
    if (c === null || this.gold < c) { this.sound.denied(); return; }
    this.gold -= c;
    t.upgrade();
    this.sound.upgrade();
    this.particles.ring(t.x, t.y - 8, '#ffd94d', 60);
  }
  trySell() {
    const t = this.selectedTower;
    if (!t) return;
    this.gold += t.sellValue();
    t.pad.tower = null;
    this.towers = this.towers.filter((x) => x !== t);
    this.selectedTower = null;
    this.sound.coin();
  }
  useAbility(id) {
    const ab = ABILITIES[id];
    if (!ab || this.state !== 'playing') return;
    if ((this.abilityCd[id] || 0) > 0 || this.gold < ab.cost) { this.sound.denied(); return; }
    this.gold -= ab.cost;
    this.abilityCd[id] = ab.cooldown;
    if (id === 'meteor') {
      const cx = this.mouse.x, cy = this.mouse.y;
      this.sound.meteor();
      this.shake = 12;
      this.particles.burst(cx, cy, '#ff9a3c', 40, 260, 0.8, 4);
      this.particles.ring(cx, cy, '#ffd94d', 190);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - cx, e.y - cy) < 190) {
          e.damage(220, this.time, this.map.litAt(e.x, e.y, this.towers, this.director.night));
          if (e.dead) this.director.onKill(e);
        }
      }
      this.enemies = this.enemies.filter((e) => !e.dead);
    } else {
      this.sound.freeze();
      for (const e of this.enemies) e.freezeUntil(this.time, 3);
      this.particles.ring(VIEW_W / 2, 360, '#7fd4ff', 500);
    }
  }
  // ---- input routing ----
  onHover(x, y) {
    this.mouse = { x, y };
    this.hoverPad = this.map.padAtPixel(x, y);
  }
  onClick(x, y) {
    if (this.state === 'title') { this.startGame(); return; }
    if (this.state === 'victory' || this.state === 'defeat') { this.startGame(); return; }
    if (this.state !== 'playing') return;
    this.sound.ensure();
    // Shop card click?
    if (y >= 648) {
      const cardW = 138, gap = 6;
      let cx = 10;
      for (const id of TOWER_ORDER) {
        if (x >= cx && x <= cx + cardW) {
          this.selectedBuild = this.selectedBuild === id ? null : id;
          this.selectedTower = null;
          this.sound.click();
          return;
        }
        cx += cardW + gap;
      }
      return;
    }
    // Tower click?
    let hit = null;
    for (const t of this.towers) {
      if (Math.hypot(x - t.x, y - t.y) < 30) { hit = t; break; }
    }
    if (hit) {
      this.selectedTower = hit;
      this.selectedBuild = null;
      this.sound.click();
      return;
    }
    const pad = this.map.padAtPixel(x, y);
    if (pad && !pad.tower && this.selectedBuild) {
      if (this.tryBuild(this.selectedBuild, pad)) this.selectedBuild = null;
      return;
    }
    this.selectedTower = null;
  }
  onKey(key) {
    if (key === 'enter') {
      if (this.state === 'title' || this.state === 'victory' || this.state === 'defeat') this.startGame();
      return;
    }
    if (key === 'r' && (this.state === 'victory' || this.state === 'defeat')) { this.startGame(); return; }
    if (this.state === 'playing' || this.state === 'paused') {
      if (key === 'p') {
        this.state = this.state === 'playing' ? 'paused' : 'playing';
        this.sound.click();
        return;
      }
      if (this.state !== 'playing') return;
      if (key === 'm') { this.sound.toggleMute(); return; }
      if (key === ' ') {
        if (!this.director.waveActive && this.director.wave < TOTAL_WAVES) {
          this.beginWave(this.director.wave + 1);
        } else {
          this.speed = this.speed === 1 ? 2 : 1;
        }
        return;
      }
      if (key === 'q') { this.useAbility('meteor'); return; }
      if (key === 'e') { this.useAbility('frostnova'); return; }
      if (key === 'u') { this.tryUpgrade(); return; }
      if (key === 'x') { this.trySell(); return; }
      const defId = TOWER_ORDER.find((id) => TOWERS[id].key === key);
      if (defId) {
        this.selectedBuild = this.selectedBuild === defId ? null : defId;
        this.selectedTower = null;
        this.sound.click();
      }
    }
  }
  // ---- combat ----
  fireTower(tower, target) {
    const def = tower.def;
    const buff = this.towers.reduce((s, t) => s + t.buffAt(tower.x, tower.y), 0);
    const lit = this.map.litAt(target.x, target.y, this.towers, this.director.night);
    const dmg = tower.damage() * (1 + buff);
    if (def.id === 'frost') {
      this.projectiles.push(new Projectile(tower.x, tower.y - 8, target, dmg, def.color, 'frost', this));
    } else if (def.id === 'prism') {
      // Instant beam: hit every enemy on the line to the target and beyond.
      const ang = Math.atan2(target.y - tower.y, target.x - tower.x);
      for (const e of this.enemies) {
        const dx = e.x - tower.x, dy = e.y - tower.y;
        const along = dx * Math.cos(ang) + dy * Math.sin(ang);
        const perp = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
        if (along > 0 && along < tower.range() + 40 && perp < e.size + 8) {
          e.damage(dmg, this.time, this.map.litAt(e.x, e.y, this.towers, this.director.night));
          if (e.dead) { this.director.onKill(e); tower.kills++; }
        }
      }
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.projectiles.push(new Beam(tower.x, tower.y - 8, target.x, target.y, def.color));
      this.sound.shoot();
    } else {
      this.projectiles.push(new Projectile(tower.x, tower.y - 8, target, dmg, def.color, def.id, this));
      this.sound.shoot();
    }
    void lit;
  }
  update(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 22);
    for (const k of Object.keys(this.abilityCd)) {
      this.abilityCd[k] = Math.max(0, this.abilityCd[k] - dt);
    }
    if (this.state !== 'playing') {
      this.particles.update(dt);
      return;
    }
    const sdt = dt * this.speed;
    this.director.update(sdt, this.time);
    for (const t of this.towers) t.update(sdt, this.enemies, this.time, (tw, tg) => this.fireTower(tw, tg));
    for (const e of this.enemies) e.update(sdt, this.time);
    for (const p of this.projectiles) p.update(sdt);
    this.projectiles = this.projectiles.filter((p) => !p.done);
    // Resolve deaths and leaks.
    for (const e of this.enemies) {
      if (e.dead) this.director.onKill(e);
      else if (e.leaked) this.director.onLeak(e);
    }
    this.enemies = this.enemies.filter((e) => !e.dead && !e.leaked);
    this.particles.update(sdt);
    // Ambient ember drift from towers.
    if (Math.random() < dt * 6 && this.towers.length) {
      const t = this.towers[Math.floor(Math.random() * this.towers.length)];
      this.particles.emberTrail(t.x, t.y - 14);
    }
  }
  frame(nowMs) {
    const now = nowMs / 1000;
    if (!this._last) this._last = now;
    let dt = Math.min(0.05, now - this._last);
    this._last = now;
    if (this.shotMode) { this.update(1 / 60); this.renderer.draw(this.ctx, this.shotTime); return; }
    this.update(dt);
    this.renderer.draw(this.ctx, this.time);
  }
  // ---- deterministic screenshots ----
  // Builds a fixed scene for ?shot=<scene>&seed=<n> and renders it once.
  setupShot(scene, seed) {
    this.shotMode = scene;
    this.shotTime = 4.2; // fixed simulated clock so renders are identical
    const rng = (s => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })(seed || 20261116);
    this.reset();
    // A lived-in mid-game board: 10 towers on sensible pads.
    const layout = [
      ['spitter', 9], ['frost', 12], ['cannon', 4], ['gale', 13], ['prism', 21],
      ['warden', 17], ['brazier', 6], ['spitter', 24], ['cannon', 27], ['frost', 30],
    ];
    for (const [id, padIdx] of layout) {
      const pad = this.map.pads[padIdx];
      if (!pad) continue;
      const t = new Tower(id, pad);
      if (id === 'cannon' || id === 'prism') t.tier = 1;
      if (id === 'spitter') t.tier = 2;
      pad.tower = t;
      this.towers.push(t);
    }
    this.gold = 486; this.lives = 17; this.score = 4820; this.kills = 214;
    if (scene === 'title') {
      this.state = 'title';
      this.director.wave = 0;
      this.gold = START_GOLD; this.lives = START_LIVES; this.score = 0; this.kills = 0;
    } else if (scene === 'play') {
      this.state = 'playing';
      this.director.wave = 12;
      this.director.waveActive = true;
      this.director.totalToSpawn = 40; this.director.spawned = 26;
      this.spawnShotEnemies(rng, 12, 14);
    } else if (scene === 'boss') {
      this.state = 'playing';
      this.director.wave = 20;
      this.director.waveActive = true;
      this.director.totalToSpawn = 46; this.director.spawned = 40;
      this.spawnShotEnemies(rng, 20, 8);
      const boss = new Enemy('dreadwisp', 1 + 20 * 0.16, this.map.waypoints, false, true);
      boss.x = this.map.waypoints[12].x; boss.y = this.map.waypoints[12].y; boss.wp = 12; boss.dist = 1200;
      this.enemies.push(boss);
      this.showBanner('DREADWISP APPROACHES', 'A boss walks the path. Focus fire!', '#ff5d5d');
    } else if (scene === 'win') {
      this.state = 'victory';
      this.director.wave = 40;
      this.score = 18420; this.kills = 812; this.lives = 14;
      this.best = 18420;
    } else if (scene === 'over') {
      this.state = 'defeat';
      this.director.wave = 23;
      this.score = 7310; this.kills = 388; this.lives = 0;
    }
    // Advance a few fixed steps so particles/projectiles exist in the frame.
    for (let i = 0; i < 30; i++) this.update(1 / 60);
    this.state = scene === 'title' ? 'title' : this.state;
    window.__shotReady = true;
  }
  spawnShotEnemies(rng, wave, count) {
    const types = ['wisp', 'wisp', 'crawler', 'dart', 'shade', 'brute'];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(rng() * types.length)];
      const e = new Enemy(type, 1 + wave * 0.16, this.map.waypoints, false, false);
      // Scatter along the first two-thirds of the path.
      const frac = 0.15 + rng() * 0.55;
      const seg = Math.floor(frac * (this.map.waypoints.length - 1));
      const a = this.map.waypoints[seg], b = this.map.waypoints[Math.min(seg + 1, this.map.waypoints.length - 1)];
      e.x = a.x + (b.x - a.x) * rng(); e.y = a.y + (b.y - a.y) * rng();
      e.wp = seg; e.dist = frac * 1000;
      this.enemies.push(e);
    }
  }
  world() {
    return {
      gold: this.gold, lives: this.lives, score: this.score, kills: this.kills,
      wave: this.director.wave, waveActive: this.director.waveActive,
      enemies: this.enemies.length, towers: this.towers.length,
    };
  }
}

// A moving shot: bolt, frost orb, cannon shell, gale gust.
class Projectile {
  constructor(x, y, target, dmg, color, kind, game) {
    this.x = x; this.y = y; this.target = target;
    this.dmg = dmg; this.color = color; this.kind = kind; this.game = game;
    this.speed = kind === 'cannon' ? 420 : kind === 'gale' ? 520 : 640;
    this.done = false;
    this.splash = kind === 'cannon' ? 70 : 0;
  }
  update(dt) {
    const t = this.target;
    if (!t || t.dead || t.leaked) { this.done = true; return; }
    const dx = t.x - this.x, dy = t.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (d <= step + t.size) { this.hit(); return; }
    this.x += (dx / d) * step; this.y += (dy / d) * step;
  }
  hit() {
    const g = this.game;
    const t = this.target;
    const lit = g.map.litAt(t.x, t.y, g.towers, g.director.night);
    if (this.kind === 'frost') {
      t.slowUntilTime(g.time, 1.6, 0.55);
      t.damage(this.dmg, g.time, lit);
      g.particles.burst(t.x, t.y, '#7fd4ff', 6, 90, 0.4, 2.5);
    } else if (this.kind === 'gale') {
      t.damage(this.dmg, g.time, lit);
      t.pushBack(46);
      g.particles.burst(t.x, t.y, '#b8f5c8', 6, 110, 0.4, 2.5);
    } else if (this.kind === 'cannon') {
      g.particles.burst(t.x, t.y, '#ffd94d', 18, 200, 0.5, 3.5);
      g.particles.ring(t.x, t.y, '#ff9a3c', this.splash);
      for (const e of g.enemies) {
        if (Math.hypot(e.x - t.x, e.y - t.y) < this.splash + e.size) {
          e.damage(this.dmg, g.time, g.map.litAt(e.x, e.y, g.towers, g.director.night));
        }
      }
      g.sound.hit();
    } else {
      t.damage(this.dmg, g.time, lit);
      g.particles.burst(t.x, t.y, this.color, 4, 80, 0.3, 2);
    }
    if (t.dead) { g.director.onKill(t); }
    this.done = true;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.kind === 'cannon' ? 7 : 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill();
  }
}

// An instant prism beam, fading over a few frames.
class Beam {
  constructor(x1, y1, x2, y2, color) {
    this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; this.color = color;
    this.life = 0.18; this.done = false;
  }
  update(dt) { this.life -= dt; if (this.life <= 0) this.done = true; }
  draw(ctx) {
    ctx.globalAlpha = clamp(this.life / 0.18, 0, 1);
    ctx.strokeStyle = this.color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
