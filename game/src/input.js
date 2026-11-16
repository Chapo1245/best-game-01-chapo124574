// Input: mouse + keyboard, routed to game actions. One job: translate events.
export class Input {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.mouseX = 0; this.mouseY = 0;
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
      game.onHover(this.mouseX, this.mouseY);
    });
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top) * (canvas.height / r.height);
      game.onClick(x, y);
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      game.onKey(e.key.toLowerCase());
      if ([' ', 'arrowup', 'arrowdown'].includes(e.key.toLowerCase())) e.preventDefault();
    });
  }
}
