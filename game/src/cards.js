// Card play for EMBERDECK: what each card does when it leaves the hand.
// Towers, walls and braziers need a lane cell; spells resolve at once.
import { CARDS, TOWER_KINDS } from './config.js';
import { cellAt, placeOnBoard, upgradeOnBoard } from './lanes.js';
import { sfx } from './sound.js';

export function cardDef(key) {
  return CARDS[key];
}
export function isTargeted(key) {
  const def = CARDS[key];
  return def.kind === 'tower' || def.kind === 'wall' || def.kind === 'brazier' || key === 'reinforce';
}
// Resolve a spell that needs no target. Returns true when it resolved.
export function castSpell(state, key) {
  const def = CARDS[key];
  if (state.gold < def.cost) return false;
  if (key === 'ember') {
    if (state.enemies.length === 0) return false;
    state.gold -= def.cost;
    for (const e of [...state.enemies]) damageFoe(state, e, def.dmg);
    state.floats.push({ x: 640, y: 200, text: 'EMBER BURST!', life: 1, max: 1, color: '#d64541' });
    sfx.die();
  } else if (key === 'freeze') {
    if (state.enemies.length === 0) return false;
    state.gold -= def.cost;
    for (const e of state.enemies) {
      e.slowUntil = state.time + def.secs;
      e.slowFactor = def.slow * (e.def.slowResist ?? 1);
    }
    sfx.click();
  } else if (key === 'repair') {
    if (state.heartHp >= state.heartMax) return false;
    state.gold -= def.cost;
    state.heartHp = Math.min(state.heartMax, state.heartHp + def.heal);
    sfx.coin();
  } else if (key === 'coin') {
    state.gold += def.gold;
    sfx.coin();
  } else if (key === 'overcharge') {
    state.gold -= def.cost;
    state.overchargeUntil = state.time + 9999;
    sfx.draft();
  } else {
    return false;
  }
  return true;
}
// Play a targeted card on a board cell. Returns true when it resolved.
export function playTargeted(state, key, lane, col) {
  const def = CARDS[key];
  if (state.gold < def.cost) return false;
  if (key === 'reinforce') {
    const b = state.board[lane]?.[col];
    if (!b || !TOWER_KINDS.includes(b.kind) || b.tier >= 3) return false;
    state.gold -= def.cost;
    upgradeOnBoard(state, lane, col);
    sfx.place();
    return true;
  }
  if (!placeOnBoard(state, lane, col, key, def.cost)) return false;
  sfx.place();
  return true;
}
// Damage one foe, with the brazier-light bonus, bounty and burst on death.
export function damageFoe(state, e, dmg) {
  const cell = cellAt(e.x, e.y);
  if (cell && state.litCache && state.litCache[cell.lane] && state.litCache[cell.lane][cell.col]) dmg *= 1.25;
  e.hp -= dmg;
  e.hitFlash = 0.12;
  if (e.hp <= 0) {
    state.kills += 1;
    state.gold += e.def.bounty;
    state.goldEarned += e.def.bounty;
    state.floats.push({ x: e.x, y: e.y - 16, text: `+${e.def.bounty}g`, life: 0.9, max: 0.9, color: '#e8a100' });
    for (let i = 0; i < 8; i += 1) {
      state.particles.push({ x: e.x, y: e.y, vx: (state.rng() - 0.5) * 120, vy: (state.rng() - 0.5) * 120, life: 0.5, max: 0.5, color: e.def.color, size: 4 });
    }
    sfx.die();
  }
}
