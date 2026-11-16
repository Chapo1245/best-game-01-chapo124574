// EMBERWARD — entry point. Boots the game, wires the frame loop,
// and exposes the debug + screenshot hooks the maker uses to play-test.
import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

function loop(nowMs) {
  game.frame(nowMs);
  requestAnimationFrame(loop);
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const seed = parseInt(params.get('seed') || '20261116', 10);
  game.setupShot(shot, seed);
  game.frame(performance.now());
} else {
  requestAnimationFrame(loop);
}

// Debug + test hooks (also how screenshots are taken).
window.__game = game;
window.__shotReady = window.__shotReady || false;
