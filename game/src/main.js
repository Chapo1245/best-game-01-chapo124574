// EMBERDECK boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there.
// The game moves between title, plan, night, draft, victory and game over.
//
// ?seed=N fixes the deck shuffle and the night's spawn pattern.
// ?shot=title|play|boss|victory (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, SCREEN_TITLE, SCREEN_PLAN, SCREEN_NIGHT, SCREEN_DRAFT, SCREEN_VICTORY, SCREEN_OVER } from './world.js';
import { ACTION_PAUSE, ACTION_BEGIN, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'emberdeck-best-night';
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

// Debug probe for scripted playtests (?debug=1): reads live state only.
if (params.get('debug') === '1') {
  window.__probe = () => {
    const s = world.state;
    return { screen: s.screen, night: s.night, gold: s.gold, heartHp: Math.ceil(s.heartHp), enemies: s.enemies.length, kills: s.kills, spawned: s.nightSpawned, hand: s.hand.map((c) => c.key), deck: s.deck.length };
  };
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}
function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { x: -1, y: -1 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const s = world.state;
    for (const ev of input.takeEvents()) {
      if (ev.type === 'click') world.handleClick(ev.x, ev.y);
      else if (ev.type === 'key') world.handleKey(ev.card ?? -2, ev.action ?? 0);
    }
    if (s.screen === SCREEN_VICTORY || s.screen === SCREEN_OVER) {
      const reached = s.screen === SCREEN_VICTORY ? 10 : Math.max(0, s.night - 1);
      if (reached > best) {
        best = reached;
        saveBest(best);
      }
    }
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const active = s.screen === SCREEN_TITLE || s.screen === SCREEN_PLAN || s.screen === SCREEN_NIGHT;
    while (accumulator >= STEP && active) {
      for (let i = 0; i < s.speed; i += 1) world.step(STEP);
      accumulator -= STEP;
    }
    if (!active) accumulator = 0;
    if (s.screen === SCREEN_PLAN) announce(`Night ${s.night}. Play cards, then begin the night.`);
    else if (s.screen === SCREEN_NIGHT) announce(`Night ${s.night} of 10. Defend the Heartflame!`);
    else if (s.screen === SCREEN_DRAFT) announce(`Night ${s.night} survived. Draft a card!`);
    renderer.draw(s, s.screen, best, input.mouse());
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (world.state.screen === SCREEN_PLAN || world.state.screen === SCREEN_NIGHT)) world.state.paused = true;
  });
  announce('Emberdeck. Your deck is your town’s wall. Click Shuffle Up to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
