// Lane walkers for EMBERDECK: enemies enter from the left, march right
// along their lane, chew through walls that block the cell ahead, and bite
// the Heartflame gate. Bats fly over walls.
import { ENEMIES, BOARD_X, BOARD_Y, CELL_W, CELL_H, GATE_X, COLS } from './config.js';
import { cellCenter } from './lanes.js';

let nextId = 1;
export function spawnEnemy(state, kind, lane) {
  const def = ENEMIES[kind];
  const hp = Math.round(def.hp * state.hpScale);
  const y = BOARD_Y + lane * CELL_H + CELL_H / 2 + (state.rng() - 0.5) * 20;
  const e = {
    id: nextId, kind, def, hp, maxHp: hp, lane,
    x: BOARD_X - 40 - state.rng() * 30, y,
    slowUntil: 0, slowFactor: 1, hitFlash: 0, attackCd: 0,
  };
  nextId += 1;
  state.enemies.push(e);
  return e;
}
function wallAhead(state, e) {
  if (e.def.flying) return null;
  const col = Math.floor((e.x + e.def.radius + 4 - BOARD_X) / CELL_W);
  if (col < 0 || col >= COLS) return null;
  const b = state.board[e.lane][col];
  return b && b.kind === 'wall' ? { b, lane: e.lane, col } : null;
}
export function stepEnemy(state, e, dt) {
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  if (state.time >= e.slowUntil) e.slowFactor = 1;
  const wall = wallAhead(state, e);
  if (wall) {
    e.attackCd -= dt;
    if (e.attackCd <= 0) {
      e.attackCd = 0.8;
      wall.b.hp -= e.def.dmg;
      state.particles.push({ x: e.x + e.def.radius, y: e.y, vx: 30, vy: -20, life: 0.4, max: 0.4, color: '#8a6d4b', size: 5 });
      if (wall.b.hp <= 0) state.board[wall.lane][wall.col] = null;
    }
    return 'attack';
  }
  const speed = e.def.speed * e.slowFactor;
  e.x += speed * dt;
  if (e.def.flying) e.y += Math.sin(state.time * 3 + e.id) * 10 * dt;
  if (e.x >= GATE_X + 34) {
    state.heartHp -= e.def.dmg;
    state.particles.push({ x: e.x, y: e.y, vx: 0, vy: -30, life: 0.6, max: 0.6, color: '#ff9d2e', size: 7 });
    e.hp = 0;
    e.reachedHeart = true;
    return 'heart';
  }
  return 'walk';
}
