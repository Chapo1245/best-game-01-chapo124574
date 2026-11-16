// EMBERWARD — config: every number that tunes the game lives here.
// One clear job: constants, tower/enemy definitions, wave table.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TILE = 80;
export const COLS = 16;
export const ROWS = 9;

export const START_GOLD = 220;
export const START_LIVES = 20;
export const TOTAL_WAVES = 40;
export const WAVE_CLEAR_BONUS = 25;
export const INTEREST_RATE = 0.05;
export const INTEREST_CAP = 30;
export const SELL_RATE = 0.7;

// The serpentine path enemies walk, in tile coords (x, y).
// Enters left at row 1, snakes down, exits right at row 7.
export const PATH_TILES = [
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1],
  [8, 2], [8, 3],
  [7, 3], [6, 3], [5, 3], [4, 3], [3, 3], [2, 3],
  [2, 4], [2, 5],
  [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5],
  [13, 6], [13, 7],
  [14, 7], [15, 7],
];

// Build pads: free tiles next to the path where towers may stand.
export const PAD_TILES = [
  [1, 0], [3, 0], [5, 0], [7, 0], [9, 2], [10, 1], [11, 1], [12, 1],
  [4, 2], [6, 2], [1, 2], [3, 4], [5, 4], [7, 4], [9, 4], [11, 4],
  [1, 4], [4, 6], [6, 6], [8, 6], [10, 6], [12, 6], [14, 6], [10, 7],
  [11, 7], [12, 7], [14, 5], [9, 7], [7, 7], [5, 7], [3, 6], [1, 6],
  [0, 0], [15, 0], [15, 2], [0, 4], [15, 4], [0, 8], [15, 8], [8, 8],
];

// Towers: id, name, hotkey, cost, range(px), damage, rate(shots/s), color,
// light radius, and a short line the shop card shows.
export const TOWERS = {
  spitter: {
    id: 'spitter', name: 'Ember Spitter', key: '1', cost: 50,
    range: 150, damage: 9, rate: 2.4, color: '#ff9a3c', light: 110,
    blurb: 'Fast ember bolts. Cheap and reliable.',
  },
  frost: {
    id: 'frost', name: 'Frost Lantern', key: '2', cost: 80,
    range: 140, damage: 4, rate: 1.0, color: '#7fd4ff', light: 130,
    blurb: 'Chills every wisp it touches. Slows 45%.',
  },
  cannon: {
    id: 'cannon', name: 'Sun Cannon', key: '3', cost: 140,
    range: 170, damage: 26, rate: 0.7, color: '#ffd94d', light: 120,
    splash: 70, blurb: 'Lobbed sunfire. Splashes a wide ring.',
  },
  gale: {
    id: 'gale', name: 'Gale Fan', key: '4', cost: 110,
    range: 160, damage: 6, rate: 1.2, color: '#b8f5c8', light: 115,
    knock: 46, blurb: 'Wind bursts shove wisps back down the path.',
  },
  prism: {
    id: 'prism', name: 'Prism Lance', key: '5', cost: 200,
    range: 260, damage: 34, rate: 0.8, color: '#e6a8ff', light: 140,
    pierce: true, blurb: 'A piercing beam through the whole line.',
  },
  warden: {
    id: 'warden', name: 'Warden Totem', key: '6', cost: 160,
    range: 0, damage: 0, rate: 0, color: '#ffe9a8', light: 210,
    buff: 0.3, blurb: 'No attack. +30% damage to nearby towers.',
  },
  brazier: {
    id: 'brazier', name: 'Brazier', key: '7', cost: 40,
    range: 0, damage: 0, rate: 0, color: '#ffb347', light: 240,
    blurb: 'Pure light. Wisps in its glow burn +25%.',
  },
};
export const TOWER_ORDER = ['spitter', 'frost', 'cannon', 'gale', 'prism', 'warden', 'brazier'];

// Upgrade tiers: multiplier on damage/rate and extra light, per tier.
export const UPGRADE_TIERS = [
  null,
  { costMul: 0.8, dmgMul: 1.6, rateMul: 1.15, lightAdd: 25 },
  { costMul: 1.1, dmgMul: 2.6, rateMul: 1.3, lightAdd: 50 },
  { costMul: 1.5, dmgMul: 4.2, rateMul: 1.5, lightAdd: 80 },
];

// Enemies: hp, speed (px/s), gold bounty, size, color, and traits.
export const ENEMIES = {
  wisp:    { hp: 30,  speed: 52, gold: 4,  size: 13, color: '#8f7bff', name: 'Wisp' },
  crawler: { hp: 70,  speed: 38, gold: 6,  size: 16, color: '#5ec98a', name: 'Crawler' },
  dart:    { hp: 22,  speed: 95, gold: 6,  size: 11, color: '#ff7ad9', name: 'Dart' },
  brute:   { hp: 260, speed: 30, gold: 14, size: 22, color: '#ff5d5d', name: 'Brute' },
  shade:   { hp: 120, speed: 60, gold: 10, size: 15, color: '#3a3f6b', name: 'Shade', armored: true },
  spitter: { hp: 90,  speed: 44, gold: 9,  size: 14, color: '#c9ff5d', name: 'Spitter' },
};
export const BOSSES = {
  gloomfiend:  { hp: 2400, speed: 26, gold: 150, size: 34, color: '#b06bff', name: 'Gloomfiend' },
  dreadwisp:   { hp: 5200, speed: 30, gold: 220, size: 38, color: '#ff4d6d', name: 'Dreadwisp' },
  nightherald: { hp: 9500, speed: 34, gold: 320, size: 42, color: '#4dc9ff', name: 'Night Herald' },
  gloomking:   { hp: 16000, speed: 28, gold: 600, size: 50, color: '#ffd94d', name: 'The Gloom King' },
};

// Night waves: every 5th wave the dark deepens — enemies +35% hp, +15% speed,
// light radii shrink 30%, but bounties pay +50%.
export function isNightWave(n) { return n % 5 === 0; }

// Wave composition builder: deterministic from the wave number.
// Returns [{type, count, gap}] spawn groups plus an optional boss id.
export function waveComp(n) {
  const groups = [];
  const hpMul = 1 + (n - 1) * 0.16 + Math.pow(n, 1.6) * 0.012;
  const push = (type, count, gap) => groups.push({ type, count, gap });
  if (n === 1) { push('wisp', 8, 0.9); }
  else if (n === 2) { push('wisp', 12, 0.75); }
  else if (n === 3) { push('wisp', 10, 0.6); push('crawler', 4, 1.0); }
  else if (n === 4) { push('crawler', 8, 0.8); push('wisp', 8, 0.5); }
  else if (n <= 6) {
    push('wisp', 10 + n, 0.5); push('dart', 3 + n, 0.7); push('crawler', 4 + n, 0.9);
  } else if (n <= 9) {
    push('dart', 6 + n, 0.55); push('crawler', 6 + n, 0.7); push('wisp', 12, 0.4);
    if (n >= 8) push('shade', 3, 1.2);
  } else if (n <= 14) {
    push('brute', 2 + Math.floor(n / 3), 1.6); push('dart', 8 + n, 0.45);
    push('shade', 4 + Math.floor(n / 2), 0.9); push('wisp', 14, 0.35);
  } else if (n <= 19) {
    push('brute', 4 + Math.floor(n / 3), 1.4); push('spitter', 5 + n, 0.8);
    push('shade', 6 + Math.floor(n / 2), 0.8); push('dart', 10 + n, 0.4);
  } else if (n <= 29) {
    push('brute', 5 + Math.floor(n / 2), 1.2); push('spitter', 8 + n, 0.7);
    push('shade', 8 + Math.floor(n / 2), 0.7); push('dart', 12 + n, 0.35);
    push('wisp', 16, 0.3);
  } else {
    push('brute', 8 + Math.floor(n / 2), 1.0); push('spitter', 10 + n, 0.6);
    push('shade', 10 + Math.floor(n / 2), 0.6); push('dart', 14 + n, 0.3);
    push('wisp', 20, 0.25);
  }
  const boss = n === 10 ? 'gloomfiend' : n === 20 ? 'dreadwisp'
    : n === 30 ? 'nightherald' : n === 40 ? 'gloomking' : null;
  return { groups, boss, hpMul };
}

export const ABILITIES = {
  meteor: { key: 'q', name: 'Meteor', cost: 100, cooldown: 18, blurb: 'A burning rock smashes a wide ring.' },
  frostnova: { key: 'e', name: 'Frost Nova', cost: 80, cooldown: 22, blurb: 'Freezes every wisp on the path for 3s.' },
};
