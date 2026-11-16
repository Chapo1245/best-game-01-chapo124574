// Mouse + keyboard input for EMBERDECK: clicks become card picks, cell
// picks or button actions; Space pauses, B begins the night, 1-5 pick cards.
export const ACTION_PAUSE = 2;
export const ACTION_BEGIN = 4;

export function createInput(canvas) {
  const queue = [];
  let mouse = { x: 0, y: 0 };
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    queue.push({ type: 'click', x, y });
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'p') queue.push({ type: 'key', action: ACTION_PAUSE });
    else if (k === 'b') queue.push({ type: 'key', action: ACTION_BEGIN });
    else if (k >= '1' && k <= '5') queue.push({ type: 'key', card: Number(k) - 1 });
    else if (k === 'escape') queue.push({ type: 'key', card: -1 });
    else if (k === 'enter') queue.push({ type: 'key', action: 1 });
  });
  return {
    takeEvents() {
      return queue.splice(0, queue.length);
    },
    mouse() {
      return mouse;
    },
  };
}
