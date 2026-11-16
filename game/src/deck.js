// The deck for EMBERDECK: draw a hand of five each dawn, reshuffle the
// discard when the deck runs dry, and draft one new card after each night.
import { HAND_SIZE, DRAFT_POOL, START_DECK } from './config.js';
import { shuffle } from './random.js';

let nextUid = 1;
export function freshDeck(rng) {
  return shuffle(rng, START_DECK);
}
export function drawHand(state) {
  for (const c of state.hand) state.discard.push(c.key);
  state.hand = [];
  for (let i = 0; i < HAND_SIZE; i += 1) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle(state.rng, state.discard);
      state.discard = [];
    }
    state.hand.push({ key: state.deck.pop(), uid: nextUid });
    nextUid += 1;
  }
}
export function discardHandCard(state, handIndex) {
  const [card] = state.hand.splice(handIndex, 1);
  if (card) state.discard.push(card.key);
}
export function rollDraft(state) {
  const pool = shuffle(state.rng, DRAFT_POOL);
  state.draftChoices = pool.slice(0, 3);
  state.draftPicked = null;
  state.draftRemoving = false;
}
export function pickDraft(state, choiceIndex) {
  const key = state.draftChoices[choiceIndex];
  if (!key || state.draftPicked) return false;
  state.deck.push(key);
  state.draftPicked = key;
  state.draftRemoving = true;
  return true;
}
export function removeFromDeck(state, key) {
  const i = state.deck.indexOf(key);
  if (i < 0) return false;
  state.deck.splice(i, 1);
  return true;
}
export function deckCounts(state) {
  const counts = {};
  for (const k of state.deck) counts[k] = (counts[k] || 0) + 1;
  return counts;
}
