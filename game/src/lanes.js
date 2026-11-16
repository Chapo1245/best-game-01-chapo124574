// The lane board for EMBERDECK: 3 lanes x 8 cells, the Heartflame gate
// at the right, and the light / overcharge auras towers read.
import { LANES, COLS, CELL_W, CELL_H, BOARD_X, BOARD_Y, GATE_X, CARDS, TOWER_KINDS, BRAZIER_RADIUS, SELL_BACK } from './config.js';

export function emptyBoard() {
  const b = [];
  for (let l = 0; l < LANES; l += 1) b.push(new Array(COLS).fill(null));
  return b;
}
export function cellCenter(lane, col) {
  return { x: BOARD_X + col * CELL_W + CELL_W / 2, y: BOARD_Y + lane * CELL_H + CELL_H / 2 };
}
export function cellAt(x, y) {
  const col = Math.floor((x - BOARD_X) / CELL_W);
  const lane = Math.floor((y - BOARD_Y) / CELL_H);
  if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return null;
  return { lane, col };
}
export function cellDist(l1, c1, l2, c2) {
  const dx = (c1 - c2) * CELL_W;
  const dy = (l1 - l2) * CELL_H;
  return Math.hypot(dx, dy);
}
export function placeOnBoard(state, lane, col, kind, cost) {
  if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return false;
  if (state.board[lane][col]) return false;
  if (state.gold < cost) return false;
  state.gold -= cost;
  const def = CARDS[kind];
  state.board[lane][col] = { kind, tier: 1, invested: cost, cooldown: 0, hp: def.hp || 0, maxHp: def.hp || 0 };
  state.buildingsBuilt += 1;
  return true;
}
export function upgradeOnBoard(state, lane, col) {
  const b = state.board[lane]?.[col];
  if (!b || !TOWER_KINDS.includes(b.kind) || b.tier >= 3) return false;
  b.tier += 1;
  b.invested += 60;
  return true;
}
export function sellOnBoard(state, lane, col) {
  const b = state.board[lane]?.[col];
  if (!b) return 0;
  const back = Math.floor(b.invested * SELL_BACK);
  state.gold += back;
  state.board[lane][col] = null;
  return back;
}
// Rebuild the lit-cell cache: braziers light a radius of cells.
export function rebuildLight(state) {
  const lit = [];
  for (let l = 0; l < LANES; l += 1) lit.push(new Array(COLS).fill(false));
  for (let l = 0; l < LANES; l += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const b = state.board[l][c];
      if (b && b.kind === 'brazier') {
        for (let l2 = 0; l2 < LANES; l2 += 1) {
          for (let c2 = 0; c2 < COLS; c2 += 1) {
            if (cellDist(l, c, l2, c2) <= BRAZIER_RADIUS * CELL_W) lit[l2][c2] = true;
          }
        }
      }
    }
  }
  state.litCache = lit;
}
export function towerDamageMult(state, lane, col) {
  let mult = 1;
  if (state.time < state.overchargeUntil) mult *= 2;
  return mult;
}
