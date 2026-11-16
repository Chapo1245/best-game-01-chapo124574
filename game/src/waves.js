// Waves: spawn queue, boss schedule, economy (bounty, interest, bonus).
// One job: turning a wave number into enemies on the path, and paying for it.
import { waveComp, isNightWave, WAVE_CLEAR_BONUS, INTEREST_RATE, INTEREST_CAP } from './config.js';
import { Enemy } from './enemies.js';

export class WaveDirector {
  constructor(game) {
    this.game = game;
    this.wave = 0;
    this.queue = []; // [{type, at}] spawn events in seconds from wave start
    this.spawnedBoss = false;
    this.boss = null;
    this.waveTime = 0;
    this.waveActive = false;
    this.betweenTimer = 0; // auto-start countdown between waves
  }
  get night() { return this.wave > 0 && isNightWave(this.wave); }
  startWave(n) {
    const comp = waveComp(n);
    this.wave = n;
    this.waveActive = true;
    this.waveTime = 0;
    this.queue = [];
    this.spawnedBoss = false;
    this.boss = null;
    let t = 0.5;
    for (const g of comp.groups) {
      for (let i = 0; i < g.count; i++) {
        this.queue.push({ type: g.type, at: t });
        t += g.gap;
      }
      t += 1.2;
    }
    this.bossType = comp.boss;
    this.bossAt = t + 2;
    this.totalToSpawn = this.queue.length + (this.bossType ? 1 : 0);
    this.spawned = 0;
  }
  update(dt, now) {
    if (!this.waveActive) {
      this.betweenTimer -= dt;
      if (this.betweenTimer <= 0 && this.wave < 40) this.game.beginWave(this.wave + 1);
      return;
    }
    this.waveTime += dt;
    while (this.queue.length && this.queue[0].at <= this.waveTime) {
      const s = this.queue.shift();
      this.spawnEnemy(s.type, false);
    }
    if (this.bossType && !this.spawnedBoss && this.waveTime >= this.bossAt) {
      this.spawnedBoss = true;
      this.spawnEnemy(this.bossType, true);
    }
    if (this.spawned >= this.totalToSpawn && this.game.enemies.length === 0) {
      this.waveActive = false;
      this.game.onWaveCleared();
    }
  }
  spawnEnemy(type, isBoss) {
    const comp = waveComp(this.wave);
    const e = new Enemy(type, comp.hpMul, this.game.map.waypoints, this.night, isBoss);
    this.game.enemies.push(e);
    this.spawned++;
    if (isBoss) { this.boss = e; this.game.onBossSpawn(e); }
  }
  // Called when an enemy dies: bounty + score. Idempotent — a kill is
  // reported from several places (projectile hit, beam, update loop).
  onKill(e) {
    if (e.counted) return;
    e.counted = true;
    const g = this.game;
    const bounty = Math.round(e.gold);
    g.gold += bounty;
    g.score += e.isBoss ? 500 : 10;
    g.kills++;
    g.particles.burst(e.x, e.y, e.color, e.isBoss ? 40 : 12, 160, 0.6, 3);
    if (e.isBoss) {
      g.particles.ring(e.x, e.y, '#ffd94d', 160);
      g.shake = 10;
      g.sound.boss();
    }
    g.particles.floatText(e.x, e.y - 18, '+' + bounty + 'g', '#ffe9a8');
  }
  onLeak(e) {
    const g = this.game;
    const cost = e.isBoss ? 5 : 1;
    g.lives -= cost;
    g.sound.leak();
    g.shake = 6;
    g.particles.floatText(e.x, e.y - 20, '-' + cost + ' ♥', '#ff7a7a');
    if (g.lives <= 0) g.gameOver(false);
  }
  waveEndPayout() {
    const g = this.game;
    const interest = Math.min(Math.floor(g.gold * INTEREST_RATE), INTEREST_CAP);
    const bonus = WAVE_CLEAR_BONUS + this.wave * 2;
    g.gold += interest + bonus;
    g.score += 100 + this.wave * 10;
    return { interest, bonus };
  }
}
