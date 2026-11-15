// Lumenkeeper — the world: player, wisps, embers, braziers, nights, scoring.
// The world is a plain object; updateWorld steps it and returns sound events.
import {
  VIEW_W, VIEW_H, NIGHT_LENGTH, TOTAL_NIGHTS, BRAZIER_COUNT, EMBERS_TO_LIGHT,
  FLARE_COST, MAX_CARRY, START_HEARTS, PLAYER_SPEED, PLAYER_RADIUS,
  AURA_BASE, AURA_PER_BRAZIER, FLARE_RADIUS, WISP_HP, BRUTE_HP, BOSS_HP,
  NIGHTS, SCORES, BRAZIER_SPOTS, BEST_KEY,
} from './config.js';
import { makeRng, rangeRng, clamp, distance, angleTo } from './random.js';

export function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Storage unavailable in some contexts — best score just isn't kept.
  }
}

export function createWorld(seed = 20261116) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    time: 0,
    night: 1,
    nightTime: 0,
    spawnTimer: 1.2,
    bossSpawned: false,
    state: 'title', // title | playing | paused | over | win
    player: { x: VIEW_W / 2, y: VIEW_H / 2 + 40, vx: 0, vy: 0, face: 0, invuln: 0, walkPhase: 0 },
    hearts: START_HEARTS,
    embers: 0,
    score: 0,
    best: loadBest(),
    braziers: BRAZIER_SPOTS.map((spot) => ({ ...spot, lit: false, flicker: rng() * 10 })),
    wisps: [],
    emberDrops: [],
    particles: [],
    spores: [],
    flares: [],
    floaters: [], // floating score text
    shake: 0,
    flash: 0,
    stats: { burned: 0, braziersLit: 0, flares: 0, nightsSurvived: 0 },
    endReason: '',
    winBonus: 0,
    newBest: false,
  };
}

export function auraRadius(world) {
  return AURA_BASE + AURA_PER_BRAZIER * world.braziers.filter((b) => b.lit).length;
}

export function litCount(world) {
  return world.braziers.filter((b) => b.lit).length;
}

function spawnSpores(world) {
  for (let i = 0; i < 46; i++) {
    world.spores.push({
      x: world.rng() * VIEW_W,
      y: world.rng() * VIEW_H,
      r: 1 + world.rng() * 2.2,
      drift: 6 + world.rng() * 14,
      phase: world.rng() * Math.PI * 2,
    });
  }
}

export function startGame(world) {
  const fresh = createWorld((world.seed + 7919) >>> 0);
  Object.assign(world, fresh, { state: 'playing', best: world.best });
  spawnSpores(world);
}

function edgeSpawn(world, kind) {
  const rng = world.rng;
  const side = Math.floor(rng() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) { x = -30; y = rng() * VIEW_H; }
  if (side === 1) { x = VIEW_W + 30; y = rng() * VIEW_H; }
  if (side === 2) { x = rng() * VIEW_W; y = -30; }
  if (side === 3) { x = rng() * VIEW_W; y = VIEW_H + 30; }
  const tune = NIGHTS[world.night - 1];
  const speed = tune.wispSpeed * rangeRng(rng, 0.85, 1.2);
  const wisp = {
    kind,
    x, y,
    hp: kind === 'brute' ? BRUTE_HP : kind === 'boss' ? BOSS_HP : WISP_HP,
    maxHp: kind === 'brute' ? BRUTE_HP : kind === 'boss' ? BOSS_HP : WISP_HP,
    speed: kind === 'boss' ? 46 : kind === 'brute' ? speed * 0.7 : speed,
    r: kind === 'boss' ? 34 : kind === 'brute' ? 22 : 13,
    burn: 0,
    wobble: rng() * Math.PI * 2,
    wobbleSpeed: 1.5 + rng() * 2,
  };
  world.wisps.push(wisp);
  return wisp;
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2;
    const s = speed * (0.3 + world.rng() * 0.7);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.5 + world.rng() * 0.5,
      maxLife: 1,
      r: 1.5 + world.rng() * 2.5,
      color,
    });
  }
  if (world.particles.length > 420) world.particles.splice(0, world.particles.length - 420);
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function dropEmber(world, x, y) {
  world.emberDrops.push({
    x: clamp(x, 24, VIEW_W - 24),
    y: clamp(y, 24, VIEW_H - 24),
    vx: rangeRng(world.rng, -30, 30),
    vy: rangeRng(world.rng, -30, 30),
    phase: world.rng() * Math.PI * 2,
  });
}

function killWisp(world, wisp, events) {
  const idx = world.wisps.indexOf(wisp);
  if (idx >= 0) world.wisps.splice(idx, 1);
  const color = wisp.kind === 'boss' ? '#ff4d6d' : wisp.kind === 'brute' ? '#b44dff' : '#8f7bff';
  burst(world, wisp.x, wisp.y, color, wisp.kind === 'boss' ? 42 : 16, 150);
  burst(world, wisp.x, wisp.y, '#ffc94d', 8, 90);
  world.stats.burned++;
  if (wisp.kind === 'boss') {
    world.score += SCORES.bossBurned;
    addFloater(world, wisp.x, wisp.y, `+${SCORES.bossBurned}`, '#ffe9a8');
    for (let i = 0; i < 5; i++) dropEmber(world, wisp.x + rangeRng(world.rng, -40, 40), wisp.y + rangeRng(world.rng, -40, 40));
    world.shake = Math.max(world.shake, 10);
  } else if (wisp.kind === 'brute') {
    world.score += SCORES.bruteBurned;
    addFloater(world, wisp.x, wisp.y, `+${SCORES.bruteBurned}`, '#c9bfff');
    if (world.rng() < 0.85) dropEmber(world, wisp.x, wisp.y);
    if (world.rng() < 0.5) dropEmber(world, wisp.x + 20, wisp.y);
  } else {
    world.score += SCORES.wispBurned;
    addFloater(world, wisp.x, wisp.y, `+${SCORES.wispBurned}`, '#c9bfff');
    if (world.rng() < 0.6) dropEmber(world, wisp.x, wisp.y);
  }
  events.push('burn');
}

function endGame(world, won, reason) {
  world.state = won ? 'win' : 'over';
  world.endReason = reason;
  if (won) {
    const remaining = (TOTAL_NIGHTS - world.night) * NIGHT_LENGTH + (NIGHT_LENGTH - world.nightTime);
    world.winBonus = Math.round(remaining) * SCORES.winTimeBonusPerSecond;
    world.score += world.winBonus;
  }
  if (world.score > world.best) {
    world.best = world.score;
    world.newBest = true;
    saveBest(world.score);
  }
}

function nearestUnlitBrazier(world) {
  let bestBrazier = null;
  let bestDist = Infinity;
  for (const b of world.braziers) {
    if (b.lit) continue;
    const d = distance(world.player.x, world.player.y, b.x, b.y);
    if (d < bestDist) {
      bestDist = d;
      bestBrazier = b;
    }
  }
  return bestBrazier === null ? null : { brazier: bestBrazier, dist: bestDist };
}

// One fixed step of the live game. Returns sound-event names for the caller.
export function updateWorld(world, input, dt) {
  const events = [];
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt * 26);
  world.flash = Math.max(0, world.flash - dt * 2.2);

  for (const spore of world.spores) {
    spore.phase += dt * 0.6;
    spore.y -= spore.drift * dt * 0.25;
    if (spore.y < -6) {
      spore.y = VIEW_H + 6;
      spore.x = world.rng() * VIEW_W;
    }
  }
  for (const p of world.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - 2.4 * dt;
    p.vy *= 1 - 2.4 * dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floaters) f.life -= dt;
  world.floaters = world.floaters.filter((f) => f.life > 0);
  for (const f of world.flares) f.life -= dt;
  world.flares = world.flares.filter((f) => f.life > 0);

  if (world.state !== 'playing') return events;

  // --- night clock ---
  world.nightTime += dt;
  if (world.nightTime >= NIGHT_LENGTH) {
    world.nightTime = 0;
    if (world.night >= TOTAL_NIGHTS) {
      endGame(world, false, 'Dawn came, but the braziers stayed dark. The Vale sleeps in shadow.');
      events.push('lose');
      return events;
    }
    world.night++;
    world.stats.nightsSurvived++;
    world.score += SCORES.nightSurvived;
    addFloater(world, world.player.x, world.player.y - 40, `Night ${world.night} — +${SCORES.nightSurvived}`, '#ffe9a8');
    events.push('night');
    if (world.night === TOTAL_NIGHTS) {
      const boss = edgeSpawn(world, 'boss');
      boss.x = VIEW_W / 2;
      boss.y = -40;
      world.bossSpawned = true;
      addFloater(world, VIEW_W / 2, 90, 'The Gloomfiend stirs…', '#ff4d6d');
    }
  }

  // --- player movement ---
  const p = world.player;
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    p.face = Math.atan2(my, mx);
    p.walkPhase += dt * 11;
  }
  p.x = clamp(p.x + mx * PLAYER_SPEED * dt, 28, VIEW_W - 28);
  p.y = clamp(p.y + my * PLAYER_SPEED * dt, 28, VIEW_H - 28);
  p.invuln = Math.max(0, p.invuln - dt);

  // --- flare ---
  if (input.flare) {
    if (world.embers >= FLARE_COST) {
      world.embers -= FLARE_COST;
      world.stats.flares++;
      world.flares.push({ x: p.x, y: p.y, r: 10, life: 0.45, maxLife: 0.45 });
      world.flash = 0.8;
      world.shake = Math.max(world.shake, 6);
      for (const wisp of [...world.wisps]) {
        if (distance(p.x, p.y, wisp.x, wisp.y) <= FLARE_RADIUS + wisp.r) killWisp(world, wisp, events);
      }
      events.push('flare');
    } else {
      events.push('denied');
    }
  }

  // --- light a brazier ---
  if (input.light) {
    const near = nearestUnlitBrazier(world);
    if (near && near.dist < 74 && world.embers >= EMBERS_TO_LIGHT) {
      world.embers -= EMBERS_TO_LIGHT;
      near.brazier.lit = true;
      world.stats.braziersLit++;
      world.score += SCORES.brazier;
      addFloater(world, near.brazier.x, near.brazier.y - 52, `+${SCORES.brazier} Brazier lit!`, '#ffe9a8');
      burst(world, near.brazier.x, near.brazier.y, '#ffc94d', 36, 190);
      burst(world, near.brazier.x, near.brazier.y, '#ff9a3c', 20, 120);
      world.flash = 0.5;
      events.push('lightBrazier');
      if (litCount(world) >= BRAZIER_COUNT) {
        endGame(world, true, 'Every brazier burns. Dawn breaks over the Ember Vale.');
        events.push('win');
        return events;
      }
    } else {
      events.push('denied');
    }
  }

  // --- spawning ---
  const tune = NIGHTS[world.night - 1];
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && world.wisps.length < tune.maxAlive) {
    world.spawnTimer = tune.spawnEvery * rangeRng(world.rng, 0.7, 1.3);
    const kind = world.rng() < tune.bruteChance ? 'brute' : 'wisp';
    edgeSpawn(world, kind);
  }

  // --- wisps drift toward the Keeper, burn inside the lantern aura ---
  const aura = auraRadius(world);
  for (const wisp of [...world.wisps]) {
    wisp.wobble += dt * wisp.wobbleSpeed;
    const targetX = p.x;
    const targetY = p.y;
    const ang = angleTo(wisp.x, wisp.y, targetX, targetY) + Math.sin(wisp.wobble) * 0.45;
    wisp.x += Math.cos(ang) * wisp.speed * dt;
    wisp.y += Math.sin(ang) * wisp.speed * dt;
    const dPlayer = distance(wisp.x, wisp.y, p.x, p.y);
    if (dPlayer < aura) {
      wisp.burn += dt * (wisp.kind === 'boss' ? 0.55 : 1.6);
      if (world.rng() < dt * 14) {
        world.particles.push({
          x: wisp.x + rangeRng(world.rng, -wisp.r, wisp.r),
          y: wisp.y + rangeRng(world.rng, -wisp.r, wisp.r),
          vx: rangeRng(world.rng, -20, 20),
          vy: rangeRng(world.rng, -60, -10),
          life: 0.5, maxLife: 0.5, r: 1.5 + world.rng() * 2, color: '#ffc94d',
        });
      }
      if (wisp.burn >= 1) {
        killWisp(world, wisp, events);
        continue;
      }
    } else {
      wisp.burn = Math.max(0, wisp.burn - dt * 0.8);
    }
    // Touching the Keeper hurts, unless briefly invulnerable.
    if (dPlayer < wisp.r + PLAYER_RADIUS - 2 && p.invuln <= 0) {
      world.hearts--;
      p.invuln = 1.4;
      world.shake = Math.max(world.shake, 12);
      burst(world, p.x, p.y, '#ff5d7a', 22, 170);
      events.push('hurt');
      // Knock the wisp back so it cannot chain-hit.
      const ka = angleTo(p.x, p.y, wisp.x, wisp.y);
      wisp.x += Math.cos(ka) * 46;
      wisp.y += Math.sin(ka) * 46;
      if (world.hearts <= 0) {
        endGame(world, false, 'The dark took the Keeper. The last lantern gutters out.');
        events.push('lose');
        return events;
      }
    }
  }

  // --- ember pickups ---
  for (const ember of [...world.emberDrops]) {
    ember.phase += dt * 5;
    ember.x += ember.vx * dt;
    ember.y += ember.vy * dt;
    ember.vx *= 1 - 3 * dt;
    ember.vy *= 1 - 3 * dt;
    if (distance(p.x, p.y, ember.x, ember.y) < PLAYER_RADIUS + 14) {
      const idx = world.emberDrops.indexOf(ember);
      if (idx >= 0) world.emberDrops.splice(idx, 1);
      if (world.embers < MAX_CARRY) {
        world.embers++;
        world.score += SCORES.ember;
        addFloater(world, ember.x, ember.y - 14, `+${SCORES.ember}`, '#ff9a3c');
        events.push('pickup');
      }
    }
  }

  return events;
}
