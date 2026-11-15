// Lumenkeeper — entry point: boot, game loop, screens, shot mode.
// Shot mode: open index.html?shot=title|play|win|over&seed=N for a fixed,
// deterministic render. window.__shotReady is set once the frame is drawn.
import { VIEW_W, VIEW_H } from './config.js';
import { createWorld, startGame, updateWorld } from './world.js';
import { drawWorld } from './render.js';
import { createInput, attachInput, clearEdgeTriggers } from './input.js';
import { createAudio, sfx, startDrone, toggleMute } from './audio.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
const shotSeed = Number(params.get('seed') || 20261116) >>> 0;

const input = createInput();
attachInput(input, canvas);
const audio = createAudio();

let world;
let shotMode = false;

if (shotScene) {
  shotMode = true;
  world = buildShotScene(shotScene, shotSeed) || createWorld(shotSeed);
} else {
  world = createWorld();
  startGame(world);
  world.state = 'title';
  // A few drifting wisps behind the title so the menu feels alive.
  world.wisps.push(
    { kind: 'wisp', x: 300, y: 220, hp: 1, maxHp: 1, speed: 44, r: 13, burn: 0, wobble: 0.7, wobbleSpeed: 1.6 },
    { kind: 'wisp', x: 980, y: 250, hp: 1, maxHp: 1, speed: 44, r: 13, burn: 0, wobble: 2.1, wobbleSpeed: 1.6 },
  );
}

function playEvents(events) {
  for (const e of events) {
    if (e === 'pickup') sfx.pickup(audio);
    else if (e === 'burn') sfx.burn(audio);
    else if (e === 'flare') sfx.flare(audio);
    else if (e === 'lightBrazier') sfx.lightBrazier(audio);
    else if (e === 'hurt') sfx.hurt(audio);
    else if (e === 'denied') sfx.denied(audio);
    else if (e === 'night') sfx.night(audio);
    else if (e === 'win') sfx.win(audio);
    else if (e === 'lose') sfx.lose(audio);
  }
}

function beginPlay() {
  startDrone(audio);
  sfx.click(audio);
  startGame(world);
}

function handleMenuInput() {
  const clicked = input.mouseDown;
  if (input.confirm || clicked) {
    input.mouseDown = false;
    if (world.state === 'title') beginPlay();
    else if (world.state === 'over' || world.state === 'win') beginPlay();
  }
  if (input.pause && world.state === 'paused') {
    world.state = 'playing';
    sfx.click(audio);
  }
}

let last = performance.now();
let frameCount = 0;

function frame(now) {
  // Shot mode: the scene was already stepped a fixed number of frames when it
  // was built, so draw it exactly once with no wall-clock input. This keeps
  // every screenshot byte-identical across renders of the same scene+seed.
  if (shotMode) {
    drawWorld(ctx, world);
    window.__shotReady = true;
    return;
  }
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  frameCount++;

  if (world.state === 'playing') {
    const events = updateWorld(world, input, dt);
    playEvents(events);
    if (input.pause) {
      world.state = 'paused';
      sfx.click(audio);
    }
  } else if (world.state === 'title' || world.state === 'over' || world.state === 'win') {
    // Ambient drift behind the menus.
    updateWorld(world, input, dt);
    handleMenuInput();
  } else if (world.state === 'paused') {
    if (input.pause) {
      world.state = 'playing';
      sfx.click(audio);
    }
    if (input.confirm) {
      world.state = 'playing';
      sfx.click(audio);
    }
  }
  clearEdgeTriggers(input);

  drawWorld(ctx, world);

  requestAnimationFrame(frame);
}

// First user gesture unlocks audio (browsers require one).
window.addEventListener('pointerdown', () => startDrone(audio), { once: true });
window.addEventListener('keydown', () => startDrone(audio), { once: true });
// M mutes the synth without pausing the game.
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM' && !event.repeat) toggleMute(audio);
});

// Exposed for play-testing: state, score and a way to force the end screens.
window.__game = {
  world: () => world,
  state: () => world.state,
  score: () => world.score,
  frames: () => frameCount,
};

requestAnimationFrame(frame);
