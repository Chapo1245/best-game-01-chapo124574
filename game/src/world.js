// EMBERDECK world: the state machine. Title -> plan (play cards) -> night
// (the Gloom walks the lanes) -> draft (pick one, thin one) -> next plan ...
// -> victory after night 10, or game over when the Heartflame falls.
import { STEP, NIGHTS, HEART_MAX, START_GOLD, CARDS, nightComp, nightHpScale } from './config.js';
import { createRandom } from './random.js';
import { emptyBoard, rebuildLight, sellOnBoard } from './lanes.js';
import { freshDeck, drawHand, discardHandCard, rollDraft, pickDraft, removeFromDeck, deckCounts } from './deck.js';
import { cardDef, isTargeted, castSpell, playTargeted } from './cards.js';
import { spawnEnemy, stepEnemy } from './enemies.js';
import { stepCombat } from './combat.js';
import { sfx, setMuted, isMuted } from './sound.js';
import { handCardRect, beginRect, speedRect, pauseRect, muteRect, startRect, againRect, draftCardRect, keepRect, deckChipRect, inRect, boardCellAt } from './ui.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAN = 'plan';
export const SCREEN_NIGHT = 'night';
export const SCREEN_DRAFT = 'draft';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_OVER = 'over';
const DAWN_TITHE = 20;

export function createWorld(rng) {
  const state = freshState(rng);
  function freshState(r) {
    return {
      rng: r, screen: SCREEN_TITLE, time: 0,
      night: 1, gold: START_GOLD, heartHp: HEART_MAX, heartMax: HEART_MAX,
      board: emptyBoard(), litCache: null, enemies: [], projectiles: [], beams: [],
      particles: [], floats: [],
      deck: [], hand: [], discard: [],
      selectedHand: null, selectedCell: null,
      spawnQueue: [], spawnTimer: 0, spawnInterval: 1, nightTotal: 0, nightSpawned: 0,
      hpScale: 1, speed: 1, paused: false,
      kills: 0, goldEarned: 0, cardsPlayed: 0, buildingsBuilt: 0,
      overchargeUntil: 0, lastShootSfx: 0, stars: 0,
      draftChoices: [], draftPicked: null, draftRemoving: false,
    };
  }
  function reset() {
    const keep = state.rng;
    Object.assign(state, freshState(keep));
  }
  function startRun() {
    state.deck = freshDeck(state.rng);
    state.discard = [];
    drawHand(state);
    state.screen = SCREEN_PLAN;
    sfx.draft();
  }
  function beginNight() {
    state.screen = SCREEN_NIGHT;
    state.hpScale = nightHpScale(state.night);
    state.overchargeUntil = 0;
    state.spawnQueue = [];
    for (const [kind, count] of nightComp(state.night)) {
      for (let i = 0; i < count; i += 1) state.spawnQueue.push(kind);
    }
    const boss = state.spawnQueue.filter((k) => k === 'king' || k === 'brute');
    const rest = state.spawnQueue.filter((k) => k !== 'king' && k !== 'brute');
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(state.rng() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    state.spawnQueue = [...rest, ...boss];
    state.spawnTimer = 0.5;
    state.spawnInterval = Math.max(0.35, 1.1 - state.night * 0.06);
    state.nightTotal = state.spawnQueue.length;
    state.nightSpawned = 0;
    rebuildLight(state);
    sfx.click();
  }
  function endNight() {
    if (state.night >= NIGHTS) {
      state.screen = SCREEN_VICTORY;
      state.stars = state.heartHp >= HEART_MAX * 0.8 ? 3 : state.heartHp >= HEART_MAX * 0.5 ? 2 : 1;
      sfx.win();
      return;
    }
    rollDraft(state);
    state.screen = SCREEN_DRAFT;
    sfx.draft();
  }
  function finishDraft() {
    state.night += 1;
    state.gold += DAWN_TITHE;
    state.goldEarned += DAWN_TITHE;
    state.floats.push({ x: 640, y: 220, text: `Dawn tithe +${DAWN_TITHE}g`, life: 1.6, max: 1.6, color: '#e8a100' });
    drawHand(state);
    state.selectedHand = null;
    state.selectedCell = null;
    state.screen = SCREEN_PLAN;
  }
  function gameOver() {
    state.screen = SCREEN_OVER;
    sfx.lose();
  }
  function step(dt) {
    state.time += dt;
    if (state.paused) return;
    if (state.screen !== SCREEN_NIGHT) return;
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = state.spawnInterval;
        const kind = state.spawnQueue.shift();
        spawnEnemy(state, kind, Math.floor(state.rng() * 3));
        state.nightSpawned += 1;
      }
    }
    stepCombat(state, dt);
    for (const e of state.enemies) stepEnemy(state, e, dt);
    state.enemies = state.enemies.filter((e) => e.hp > 0);
    if (state.heartHp <= 0) {
      state.heartHp = 0;
      gameOver();
      return;
    }
    if (state.spawnQueue.length === 0 && state.enemies.length === 0) endNight();
  }
  function playSelectedOnCell(lane, col) {
    const idx = state.selectedHand;
    if (idx === null || idx >= state.hand.length) return;
    const key = state.hand[idx].key;
    if (playTargeted(state, key, lane, col)) {
      state.cardsPlayed += 1;
      discardHandCard(state, idx);
      state.selectedHand = null;
      state.selectedCell = { lane, col };
      rebuildLight(state);
    } else {
      sfx.click();
    }
  }
  function handleClick(x, y) {
    if (state.screen === SCREEN_TITLE) {
      if (inRect(x, y, startRect())) startRun();
      return;
    }
    if (state.screen === SCREEN_VICTORY || state.screen === SCREEN_OVER) {
      if (inRect(x, y, againRect())) reset();
      return;
    }
    if (state.screen === SCREEN_DRAFT) {
      if (!state.draftPicked) {
        for (let i = 0; i < 3; i += 1) {
          if (inRect(x, y, draftCardRect(i)) && pickDraft(state, i)) {
            sfx.draft();
            return;
          }
        }
        return;
      }
      // Thin the deck (optional): click a chip to remove one copy.
      const counts = deckCounts(state);
      const keys = Object.keys(counts);
      for (let i = 0; i < keys.length; i += 1) {
        if (inRect(x, y, deckChipRect(i))) {
          removeFromDeck(state, keys[i]);
          sfx.click();
          return;
        }
      }
      if (inRect(x, y, keepRect())) finishDraft();
      return;
    }
    if (inRect(x, y, muteRect())) { setMuted(!isMuted()); return; }
    if (inRect(x, y, pauseRect())) { state.paused = !state.paused; return; }
    if (inRect(x, y, speedRect())) { state.speed = state.speed === 1 ? 2 : 1; return; }
    if (state.screen === SCREEN_PLAN && inRect(x, y, beginRect())) { beginNight(); return; }
    // Hand of cards.
    for (let i = 0; i < state.hand.length; i += 1) {
      if (inRect(x, y, handCardRect(i))) {
        const key = state.hand[i].key;
        if (state.selectedHand === i) {
          state.selectedHand = null;
          return;
        }
        if (!isTargeted(key)) {
          if (castSpell(state, key)) {
            state.cardsPlayed += 1;
            discardHandCard(state, i);
          }
          state.selectedHand = null;
          return;
        }
        state.selectedHand = i;
        sfx.click();
        return;
      }
    }
    // Board cells.
    const cell = boardCellAt(x, y);
    if (cell) {
      if (state.selectedHand !== null) {
        playSelectedOnCell(cell.lane, cell.col);
        return;
      }
      state.selectedCell = state.board[cell.lane][cell.col] ? { lane: cell.lane, col: cell.col } : null;
      sfx.click();
    }
  }
  function handleKey(cardIndex, action) {
    if (action === 2) {
      if (state.screen === SCREEN_PLAN || state.screen === SCREEN_NIGHT) state.paused = !state.paused;
      return;
    }
    if (action === 4) {
      if (state.screen === SCREEN_PLAN) beginNight();
      return;
    }
    if (cardIndex >= 0 && cardIndex < state.hand.length) {
      const key = state.hand[cardIndex].key;
      if (!isTargeted(key)) {
        if (castSpell(state, key)) {
          state.cardsPlayed += 1;
          discardHandCard(state, cardIndex);
        }
        state.selectedHand = null;
      } else {
        state.selectedHand = state.selectedHand === cardIndex ? null : cardIndex;
      }
    } else if (cardIndex === -1) {
      state.selectedHand = null;
      state.selectedCell = null;
    }
  }
  return {
    state, reset, step, handleClick, handleKey, startRun, beginNight, finishDraft,
    deckCounts: () => deckCounts(state),
    CARDS,
  };
}
export { STEP };
