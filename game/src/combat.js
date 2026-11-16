// Tower combat for EMBERDECK: towers cool down and fire along the lanes,
// projectiles home in, splash and chains land, chills stick.
import { CARDS, CELL_W, GATE_X } from './config.js';
import { cellCenter, cellDist, towerDamageMult } from './lanes.js';
import { damageFoe } from './cards.js';
import { sfx } from './sound.js';

function towerStat(b) {
  return CARDS[b.kind].tier[b.tier - 1];
}
function inRange(bx, by, e, rangeCells) {
  const dx = e.x - bx;
  const dy = e.y - by;
  return dx * dx + dy * dy <= (rangeCells * CELL_W) ** 2;
}
function pickTarget(state, bx, by, rangeCells) {
  // Furthest right first (closest to the gate), then nearest.
  let best = null;
  let bestScore = -Infinity;
  for (const e of state.enemies) {
    if (e.hp <= 0 || !inRange(bx, by, e, rangeCells)) continue;
    const score = e.x * 10 - Math.hypot(e.x - bx, e.y - by);
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best;
}
function fireTower(state, b, lane, col) {
  const stat = towerStat(b);
  const pos = cellCenter(lane, col);
  const target = pickTarget(state, pos.x, pos.y, stat.range);
  if (!target) return false;
  const dmg = stat.dmg * towerDamageMult(state, lane, col);
  if (b.kind === 'prism') {
    let from = target;
    let dealt = dmg;
    const hit = new Set([target.id]);
    damageFoe(state, target, dealt);
    state.beams.push({ x1: pos.x, y1: pos.y - 12, x2: target.x, y2: target.y, life: 0.15, max: 0.15 });
    for (let i = 1; i < stat.chain; i += 1) {
      let next = null;
      let nd = Infinity;
      for (const e of state.enemies) {
        if (e.hp <= 0 || hit.has(e.id)) continue;
        const d = Math.hypot(e.x - from.x, e.y - from.y);
        if (d < nd) { nd = d; next = e; }
      }
      if (!next || nd > 2.2 * CELL_W) break;
      dealt *= 0.8;
      damageFoe(state, next, dealt);
      state.beams.push({ x1: from.x, y1: from.y, x2: next.x, y2: next.y, life: 0.15, max: 0.15 });
      hit.add(next.id);
      from = next;
    }
  } else if (b.kind === 'frost') {
    state.projectiles.push({ x: pos.x, y: pos.y - 12, tx: target, speed: 320, dmg, kind: 'frost', slow: stat.slow * (target.def.slowResist ?? 1), slowSecs: stat.slowSecs, radius: 5 });
  } else {
    state.projectiles.push({ x: pos.x, y: pos.y - 12, tx: target, speed: b.kind === 'cannon' ? 260 : 520, dmg, kind: b.kind, splash: stat.splash || 0, radius: b.kind === 'cannon' ? 7 : 4 });
  }
  if (state.time - (state.lastShootSfx || 0) > 0.12) {
    state.lastShootSfx = state.time;
    sfx.shoot();
  }
  return true;
}
export function stepCombat(state, dt) {
  for (let lane = 0; lane < state.board.length; lane += 1) {
    for (let col = 0; col < state.board[lane].length; col += 1) {
      const b = state.board[lane][col];
      if (!b || !CARDS[b.kind].tier) continue;
      b.cooldown -= dt;
      if (b.cooldown <= 0) {
        const fired = fireTower(state, b, lane, col);
        b.cooldown = fired ? 1 / towerStat(b).rate : 0.08;
      }
    }
  }
  for (const p of state.projectiles) {
    if (!p.tx || p.tx.hp <= 0) { p.dead = true; continue; }
    const dx = p.tx.x - p.x;
    const dy = p.tx.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + p.tx.def.radius) {
      if (p.kind === 'frost') {
        damageFoe(state, p.tx, p.dmg);
        p.tx.slowUntil = state.time + p.slowSecs;
        p.tx.slowFactor = p.slow;
      } else if (p.splash) {
        for (const e of state.enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - p.tx.x, e.y - p.tx.y) <= p.splash * CELL_W) damageFoe(state, e, p.dmg);
        }
      } else {
        damageFoe(state, p.tx, p.dmg);
      }
      p.dead = true;
    } else {
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.dead);
  state.beams = state.beams.filter((b) => (b.life -= dt) > 0);
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floats) {
    f.y -= 24 * dt;
    f.life -= dt;
  }
  state.floats = state.floats.filter((f) => f.life > 0);
}
