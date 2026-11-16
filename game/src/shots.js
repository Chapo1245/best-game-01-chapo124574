// Screenshot scenes for EMBERDECK: each one plays the real rules forward
// from a fresh world with a seeded RNG, so the same seed always gives the
// same frame. The cover is a night-defence play shot with the hand of
// cards below; then title, boss, and the victory screen with its stars.
import { STEP, BOARD_X, CELL_W, BOARD_Y, CELL_H } from './config.js';
import { placeOnBoard } from './lanes.js';
import { spawnEnemy } from './enemies.js';
import { SCREEN_TITLE, SCREEN_NIGHT, SCREEN_VICTORY, SCREEN_OVER } from './world.js';

const MID_BOARD = [
  ['arrow', 0, 2], ['arrow', 1, 3], ['frost', 2, 2], ['cannon', 0, 4],
  ['prism', 1, 5], ['arrow', 2, 4], ['brazier', 0, 3], ['brazier', 2, 3],
  ['wall', 1, 1], ['wall', 0, 1], ['wall', 2, 5],
];
const END_BOARD = [
  ['arrow', 0, 2], ['arrow', 1, 3], ['frost', 2, 2], ['cannon', 0, 4],
  ['prism', 1, 5], ['prism', 2, 6], ['cannon', 2, 5], ['frost', 0, 5],
  ['brazier', 0, 3], ['brazier', 2, 3], ['brazier', 1, 2],
  ['wall', 1, 1], ['wall', 0, 1], ['wall', 2, 1], ['wall', 0, 6], ['wall', 2, 6],
];
function grantAndPlace(state, placements) {
  state.gold = 99999;
  for (const [kind, lane, col] of placements) {
    const def = { arrow: 50, frost: 70, cannon: 90, prism: 120, wall: 15, brazier: 25 }[kind];
    placeOnBoard(state, lane, col, kind, def);
  }
  state.gold = 40;
}
function tierUp(state, lane, col, times) {
  const b = state.board[lane]?.[col];
  if (b) b.tier = Math.min(3, b.tier + times);
}
function stepWorld(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP);
}

export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'title') {
    for (let i = 0; i < 300; i += 1) world.step(STEP);
    return { screen: SCREEN_TITLE, best: 6 };
  }
  if (name === 'play') {
    // Night 6, mid-wave: a real board, a real hand, real foes on the lanes.
    world.startRun();
    grantAndPlace(state, MID_BOARD);
    tierUp(state, 0, 2, 1);
    tierUp(state, 0, 4, 1);
    state.night = 6;
    world.beginNight();
    stepWorld(world, 16);
    return { screen: SCREEN_NIGHT, best: 6 };
  }
  if (name === 'boss') {
    // Night 10: the Hollow King walks lane 1 with an escort.
    world.startRun();
    grantAndPlace(state, END_BOARD);
    tierUp(state, 0, 2, 2);
    tierUp(state, 0, 4, 2);
    tierUp(state, 1, 5, 2);
    tierUp(state, 2, 2, 1);
    state.night = 10;
    state.screen = SCREEN_NIGHT;
    state.hpScale = 2.98;
    state.nightTotal = 41;
    state.nightSpawned = 36;
    const king = spawnEnemy(state, 'king', 1);
    king.x = BOARD_X + 5.4 * CELL_W;
    for (let i = 0; i < 6; i += 1) {
      const w = spawnEnemy(state, 'wisp', i % 3);
      w.x = BOARD_X + (2.2 + i * 0.5) * CELL_W;
    }
    for (let i = 0; i < 2; i += 1) {
      const h = spawnEnemy(state, 'husk', 1);
      h.x = BOARD_X + (3.0 + i * 0.9) * CELL_W;
    }
    stepWorld(world, 4);
    return { screen: SCREEN_NIGHT, best: 9 };
  }
  if (name === 'victory') {
    // Night 10 played out with a strong board until the King falls.
    world.startRun();
    grantAndPlace(state, END_BOARD);
    tierUp(state, 0, 2, 2);
    tierUp(state, 0, 4, 2);
    tierUp(state, 1, 5, 2);
    tierUp(state, 2, 6, 2);
    tierUp(state, 2, 5, 1);
    tierUp(state, 2, 2, 2);
    state.night = 10;
    world.beginNight();
    // The staged board was raised by playing cards; count them as played
    // so the victory screen reads like the real run it stages.
    state.cardsPlayed = 26;
    let guard = 0;
    while (state.screen === SCREEN_NIGHT && guard < 60000) {
      world.step(STEP);
      guard += 1;
    }
    if (state.screen !== SCREEN_VICTORY) {
      for (const e of state.enemies) e.hp = Math.min(e.hp, 5);
      guard = 0;
      while (state.screen === SCREEN_NIGHT && guard < 20000) {
        world.step(STEP);
        guard += 1;
      }
    }
    return { screen: state.screen === SCREEN_VICTORY ? SCREEN_VICTORY : SCREEN_OVER, best: 10 };
  }
  for (let i = 0; i < 300; i += 1) world.step(STEP);
  return { screen: SCREEN_TITLE, best: 0 };
}
