// Button and card rectangles for EMBERDECK, shared by the world (hit tests)
// and the renderer (drawing) so they can never drift apart.
import { HAND_Y, BOARD_X, BOARD_Y, CELL_W, CELL_H, LANES, COLS } from './config.js';

export function handCardRect(i) {
  return { x: 150 + i * 200, y: HAND_Y, w: 190, h: 190 };
}
export function beginRect() {
  return { x: 1108, y: 12, w: 156, h: 40 };
}
export function speedRect() {
  return { x: 940, y: 12, w: 52, h: 40 };
}
export function pauseRect() {
  return { x: 1000, y: 12, w: 52, h: 40 };
}
export function muteRect() {
  return { x: 1056, y: 12, w: 44, h: 40 };
}
export function startRect() {
  return { x: 500, y: 478, w: 280, h: 64 };
}
export function againRect() {
  return { x: 500, y: 540, w: 280, h: 64 };
}
export function draftCardRect(i) {
  return { x: 260 + i * 260, y: 190, w: 240, h: 280 };
}
export function keepRect() {
  return { x: 500, y: 620, w: 280, h: 52 };
}
export function deckChipRect(i) {
  return { x: 190 + (i % 6) * 160, y: 520 + Math.floor(i / 6) * 42, w: 150, h: 34 };
}
export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
export function boardCellAt(x, y) {
  const col = Math.floor((x - BOARD_X) / CELL_W);
  const lane = Math.floor((y - BOARD_Y) / CELL_H);
  if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return null;
  return { lane, col };
}
