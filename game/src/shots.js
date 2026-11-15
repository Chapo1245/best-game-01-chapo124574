// Deterministic shot scenes for screenshots: ?shot=title|play|win|over&seed=N
// Each scene builds a fixed world from a seed and steps it a fixed number of
// frames, so the render is the same every run. No wall clock is used.
import { createWorld, startGame, updateWorld } from './world.js';
import { VIEW_W, VIEW_H } from './config.js';

function stepWorld(world, frames, input) {
  const idle = { up: false, down: false, left: false, right: false, flare: false, light: false, confirm: false, pause: false };
  for (let i = 0; i < frames; i++) updateWorld(world, { ...idle, ...(input || {}) }, 1 / 60);
}

function seedWorld(seed, night, lit, embers, score) {
  const world = createWorld(seed);
  startGame(world);
  world.night = night;
  world.nightTime = 12;
  world.embers = embers;
  world.score = score;
  world.braziers.forEach((b, i) => {
    b.lit = i < lit;
  });
  return world;
}

function scatterPlay(world) {
  // A lively mid-game moment: wisps closing in, embers on the ground, two
  // braziers already burning, the Keeper near the Heart Brazier.
  const rng = world.rng;
  world.player.x = 560;
  world.player.y = 400;
  const spots = [
    { kind: 'wisp', x: 420, y: 300 },
    { kind: 'wisp', x: 700, y: 320 },
    { kind: 'wisp', x: 620, y: 520 },
    { kind: 'wisp', x: 480, y: 470 },
    { kind: 'brute', x: 820, y: 430 },
    { kind: 'wisp', x: 900, y: 260 },
    { kind: 'wisp', x: 350, y: 560 },
    { kind: 'wisp', x: 760, y: 180 },
  ];
  for (const s of spots) {
    world.wisps.push({
      kind: s.kind,
      x: s.x, y: s.y,
      hp: s.kind === 'brute' ? 3 : 1,
      maxHp: s.kind === 'brute' ? 3 : 1,
      speed: 60,
      r: s.kind === 'brute' ? 22 : 13,
      burn: s.kind === 'brute' ? 0.4 : 0.7,
      wobble: rng() * Math.PI * 2,
      wobbleSpeed: 2,
    });
  }
  for (const [x, y] of [[500, 430], [640, 470], [700, 380], [580, 340], [860, 500]]) {
    world.emberDrops.push({ x, y, vx: 0, vy: 0, phase: rng() * Math.PI * 2 });
  }
  world.flares.push({ x: 560, y: 400, r: 10, life: 0.2, maxLife: 0.45 });
  world.particles.push(
    { x: 420, y: 300, vx: 20, vy: -40, life: 0.6, maxLife: 0.6, r: 3, color: '#ffc94d' },
    { x: 700, y: 320, vx: -15, vy: -30, life: 0.5, maxLife: 0.5, r: 2.5, color: '#8f7bff' },
  );
  stepWorld(world, 24);
}

export function buildShotScene(scene, seed) {
  if (scene === 'title') {
    const world = seedWorld(seed, 1, 1, 0, 0);
    world.state = 'title';
    world.player.x = 640;
    world.player.y = 430;
    world.wisps.push({
      kind: 'wisp', x: 420, y: 300, hp: 1, maxHp: 1, speed: 50, r: 13,
      burn: 0, wobble: 1, wobbleSpeed: 2,
    });
    world.wisps.push({
      kind: 'wisp', x: 880, y: 330, hp: 1, maxHp: 1, speed: 50, r: 13,
      burn: 0, wobble: 2.4, wobbleSpeed: 2,
    });
    stepWorld(world, 30);
    world.state = 'title';
    return world;
  }
  if (scene === 'play') {
    const world = seedWorld(seed, 3, 2, 5, 1240);
    world.hearts = 2;
    scatterPlay(world);
    return world;
  }
  if (scene === 'win') {
    const world = seedWorld(seed, 5, 5, 4, 4860);
    world.state = 'win';
    world.endReason = 'Every brazier burns. Dawn breaks over the Ember Vale.';
    world.winBonus = 420;
    world.score += world.winBonus;
    world.stats = { burned: 61, braziersLit: 5, flares: 7, nightsSurvived: 4 };
    world.newBest = true;
    world.best = world.score;
    stepWorld(world, 12);
    world.state = 'win';
    return world;
  }
  if (scene === 'over') {
    const world = seedWorld(seed, 4, 3, 1, 2310);
    world.hearts = 0;
    world.state = 'over';
    world.endReason = 'The dark took the Keeper. The last lantern gutters out.';
    world.stats = { burned: 34, braziersLit: 3, flares: 4, nightsSurvived: 3 };
    world.wisps.push({
      kind: 'brute', x: 700, y: 420, hp: 3, maxHp: 3, speed: 40, r: 22,
      burn: 0.2, wobble: 0.5, wobbleSpeed: 2,
    });
    stepWorld(world, 12);
    world.state = 'over';
    return world;
  }
  return null;
}

export function shotSize() {
  return { w: VIEW_W, h: VIEW_H };
}
