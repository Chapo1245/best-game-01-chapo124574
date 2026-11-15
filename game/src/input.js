// Keyboard + mouse state, one object the world reads each frame.
export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    flare: false, // Space, edge-triggered by the world
    light: false, // E, edge-triggered by the world
    confirm: false, // Enter, edge-triggered
    pause: false, // P or Escape, edge-triggered
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    // Keys held down right now, by code.
    keys: new Set(),
  };
}

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function attachInput(input, element) {
  const press = (code) => {
    if (code === 'Space') input.flare = true;
    if (code === 'KeyE') input.light = true;
    if (code === 'Enter') input.confirm = true;
    if (code === 'KeyP' || code === 'Escape') input.pause = true;
  };

  window.addEventListener('keydown', (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'Space') event.preventDefault();
    if (!event.repeat) press(event.code);
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
    input.keys.clear();
  });
  element.addEventListener('mousemove', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * 720;
  });
  element.addEventListener('mousedown', (event) => {
    input.mouseDown = true;
    const rect = element.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * 720;
    event.preventDefault();
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
}

// Edge-triggered flags are eaten by the world after one frame.
export function clearEdgeTriggers(input) {
  input.flare = false;
  input.light = false;
  input.confirm = false;
  input.pause = false;
}
