// Lumenkeeper — tuning and palette in one place.
// The Vale is 1280x720. Nights last 45 seconds; five nights, then dawn.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const NIGHT_LENGTH = 45; // seconds per night
export const TOTAL_NIGHTS = 5;
export const BRAZIER_COUNT = 5;
export const EMBERS_TO_LIGHT = 3;
export const FLARE_COST = 2;
export const MAX_CARRY = 9;
export const START_HEARTS = 3;

export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 16;
export const AURA_BASE = 112;
export const AURA_PER_BRAZIER = 12;
export const FLARE_RADIUS = 230;

export const WISP_HP = 1;
export const BRUTE_HP = 3;
export const BOSS_HP = 9;

// Spawn pacing per night: base interval shrinks, speed grows.
export const NIGHTS = [
  { spawnEvery: 2.4, wispSpeed: 52, bruteChance: 0.0, maxAlive: 7 },
  { spawnEvery: 1.9, wispSpeed: 62, bruteChance: 0.08, maxAlive: 10 },
  { spawnEvery: 1.5, wispSpeed: 72, bruteChance: 0.16, maxAlive: 13 },
  { spawnEvery: 1.2, wispSpeed: 82, bruteChance: 0.24, maxAlive: 16 },
  { spawnEvery: 0.95, wispSpeed: 92, bruteChance: 0.32, maxAlive: 20 },
];

export const SCORES = {
  wispBurned: 10,
  bruteBurned: 30,
  bossBurned: 200,
  ember: 25,
  brazier: 150,
  nightSurvived: 50,
  winTimeBonusPerSecond: 5,
};

// Five braziers: a ring around the Vale, one at the heart of it.
export const BRAZIER_SPOTS = [
  { x: 640, y: 360, name: 'Heart Brazier' },
  { x: 210, y: 170, name: 'Northwest Brazier' },
  { x: 1070, y: 170, name: 'Northeast Brazier' },
  { x: 210, y: 550, name: 'Southwest Brazier' },
  { x: 1070, y: 550, name: 'Southeast Brazier' },
];

export const PALETTE = {
  night: '#0b0e24',
  nightDeep: '#070818',
  ground: '#12162e',
  groundLight: '#1a2044',
  gold: '#ffc94d',
  goldBright: '#ffe9a8',
  ember: '#ff9a3c',
  flame: '#ff7a1a',
  wisp: '#8f7bff',
  wispCore: '#c9bfff',
  brute: '#b44dff',
  boss: '#ff4d6d',
  heart: '#ff5d7a',
  text: '#f4ecd8',
  dim: '#9a94c2',
  panel: 'rgba(10, 12, 32, 0.82)',
  panelEdge: 'rgba(255, 201, 77, 0.45)',
};

export const BEST_KEY = 'lumenkeeper-best';
