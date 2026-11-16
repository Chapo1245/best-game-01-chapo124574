// EMBERDECK tuning: the deck, the lanes, the nights.
// Your deck is your town's wall: play cards to raise towers, then the
// Gloom walks the lanes. Draft one new card after every night.
export const STEP = 1 / 60;
export const CANVAS = { width: 1280, height: 720 };
export const LANES = 3;
export const COLS = 8;
export const CELL_W = 105;
export const CELL_H = 112;
export const BOARD_X = 150;
export const BOARD_Y = 116;
export const GATE_X = BOARD_X + COLS * CELL_W; // 990
export const HUD_H = 64;
export const HAND_Y = 486;
export const NIGHTS = 10;
export const HEART_MAX = 100;
export const START_GOLD = 90;
export const HAND_SIZE = 5;

// Cards. kind: 'tower' | 'wall' | 'brazier' | 'spell'. cost in gold.
// Towers share the DAWNBURG-style stat table (dmg, rate, range in cells).
export const CARDS = {
  arrow: { name: 'Arrow', kind: 'tower', cost: 50, blurb: 'Tower: fast arrows', tier: [ { dmg: 7, rate: 2.4, range: 2.8 }, { dmg: 11, rate: 2.8, range: 3.0 }, { dmg: 17, rate: 3.4, range: 3.4 } ] },
  frost: { name: 'Frost', kind: 'tower', cost: 70, blurb: 'Tower: chills foes', tier: [ { dmg: 4, rate: 1.2, range: 2.4, slow: 0.55, slowSecs: 1.6 }, { dmg: 7, rate: 1.4, range: 2.6, slow: 0.45, slowSecs: 2.0 }, { dmg: 11, rate: 1.6, range: 2.8, slow: 0.35, slowSecs: 2.4 } ] },
  cannon: { name: 'Cannon', kind: 'tower', cost: 90, blurb: 'Tower: splash shells', tier: [ { dmg: 22, rate: 0.55, range: 2.6, splash: 0.9 }, { dmg: 34, rate: 0.6, range: 2.8, splash: 1.0 }, { dmg: 52, rate: 0.7, range: 3.0, splash: 1.2 } ] },
  prism: { name: 'Prism', kind: 'tower', cost: 120, blurb: 'Tower: sunbeam chains', tier: [ { dmg: 10, rate: 1.0, range: 3.0, chain: 3 }, { dmg: 16, rate: 1.1, range: 3.2, chain: 4 }, { dmg: 26, rate: 1.3, range: 3.6, chain: 5 } ] },
  wall: { name: 'Wall', kind: 'wall', cost: 15, blurb: 'Blocks a lane cell', hp: 150 },
  brazier: { name: 'Brazier', kind: 'brazier', cost: 25, blurb: 'Light: slow +25% dmg' },
  ember: { name: 'Ember Burst', kind: 'spell', cost: 30, blurb: '40 damage to all foes', dmg: 40 },
  freeze: { name: 'Deep Freeze', kind: 'spell', cost: 20, blurb: 'Slow all foes 4s', slow: 0.5, secs: 4 },
  repair: { name: 'Mend the Flame', kind: 'spell', cost: 30, blurb: 'Heart +20 HP', heal: 20 },
  coin: { name: 'Gold Rush', kind: 'spell', cost: 0, blurb: '+30 gold, right now', gold: 30 },
  overcharge: { name: 'Overcharge', kind: 'spell', cost: 40, blurb: 'Towers +100% tonight', mult: 2, secs: 999 },
  reinforce: { name: 'Reinforce', kind: 'spell', cost: 60, blurb: 'Upgrade a tower +1 tier' },
};
export const DRAFT_POOL = ['arrow', 'frost', 'cannon', 'prism', 'wall', 'brazier', 'ember', 'freeze', 'repair', 'coin', 'overcharge', 'reinforce'];
export const START_DECK = ['arrow', 'arrow', 'wall', 'wall', 'brazier', 'frost', 'coin', 'coin', 'ember', 'repair'];
export const TOWER_KINDS = ['arrow', 'frost', 'cannon', 'prism'];
export const BRAZIER_RADIUS = 2.2;
export const BRAZIER_SLOW = 0.65;
export const BRAZIER_BONUS = 1.25;
export const SELL_BACK = 0.7;

export const ENEMIES = {
  wisp: { name: 'Wisp', hp: 20, speed: 62, bounty: 3, radius: 11, dmg: 6, color: '#7c5cff' },
  husk: { name: 'Husk', hp: 85, speed: 28, bounty: 6, radius: 15, dmg: 12, color: '#8a6d4b' },
  bat: { name: 'Gloom Bat', hp: 30, speed: 80, bounty: 5, radius: 12, dmg: 8, flying: true, color: '#5b6b8c' },
  shade: { name: 'Shade', hp: 38, speed: 104, bounty: 7, radius: 12, dmg: 8, color: '#3d4a6b' },
  brute: { name: 'Gloom Brute', hp: 380, speed: 24, bounty: 40, radius: 19, dmg: 20, color: '#6b3d5e' },
  king: { name: 'Hollow King', hp: 1700, speed: 18, bounty: 250, radius: 27, dmg: 30, slowResist: 0.5, color: '#2e1a4d' },
};
export function nightComp(night) {
  const comp = [];
  comp.push(['wisp', 5 + night * 2]);
  if (night >= 2) comp.push(['husk', 1 + night]);
  if (night >= 3) comp.push(['bat', night]);
  if (night >= 4) comp.push(['shade', night - 2]);
  if (night === 5 || night === 8) comp.push(['brute', 1]);
  if (night === 10) comp.push(['king', 1]);
  return comp;
}
export function nightHpScale(night) {
  return 1 + (night - 1) * 0.22;
}
export const PAL = {
  paper: '#f7ead0',
  panel: '#fff8e6',
  ink: '#2b2620',
  inkSoft: '#6b5d4a',
  red: '#b03a2e',
  gold: '#e8a100',
  teal: '#2e7f86',
  laneA: '#cfe3b0',
  laneB: '#bcd6a0',
  gate: '#3a2c22',
  cardBack: '#8a6d4b',
  nightTint: 'rgba(43,58,103,0.5)',
};
