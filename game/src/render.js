// Lumenkeeper — all drawing: the Vale, the Keeper, wisps, HUD and screens.
// Nothing here touches game state; it only reads the world.
import { VIEW_W, VIEW_H, PALETTE, NIGHT_LENGTH, TOTAL_NIGHTS, BRAZIER_COUNT, EMBERS_TO_LIGHT, FLARE_COST, MAX_CARRY } from './config.js';
import { auraRadius, litCount } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGround(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PALETTE.night);
  g.addColorStop(0.55, PALETTE.ground);
  g.addColorStop(1, PALETTE.nightDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Faint standing stones and grass tufts, fixed by the world's seed.
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 173 + 61) % VIEW_W);
    const y = 90 + ((i * 97 + 31) % 520);
    ctx.fillStyle = '#1d2347';
    ctx.beginPath();
    ctx.ellipse(x, y, 26 + (i % 3) * 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Drifting spores of light.
  for (const s of world.spores) {
    const tw = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(s.phase));
    ctx.globalAlpha = tw;
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBrazier(ctx, world, b) {
  const lit = b.lit;
  const flick = lit ? 1 + 0.14 * Math.sin(world.time * 7 + b.flicker) : 0;
  if (lit) {
    const glow = ctx.createRadialGradient(b.x, b.y - 18, 8, b.x, b.y - 18, 150 * flick);
    glow.addColorStop(0, 'rgba(255, 201, 77, 0.55)');
    glow.addColorStop(0.5, 'rgba(255, 154, 60, 0.18)');
    glow.addColorStop(1, 'rgba(255, 154, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(b.x, b.y - 18, 150 * flick, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stone bowl.
  ctx.fillStyle = '#2a2f52';
  ctx.beginPath();
  ctx.moveTo(b.x - 26, b.y - 6);
  ctx.lineTo(b.x + 26, b.y - 6);
  ctx.lineTo(b.x + 16, b.y + 16);
  ctx.lineTo(b.x - 16, b.y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a4066';
  ctx.fillRect(b.x - 6, b.y + 16, 12, 14);
  if (lit) {
    // Flame: three layered teardrops.
    ctx.save();
    ctx.translate(b.x, b.y - 8);
    ctx.scale(1, 1.5 * flick);
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(14, -6, 0, 6);
    ctx.quadraticCurveTo(-14, -6, 0, -26);
    ctx.fill();
    ctx.fillStyle = '#ffc94d';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(8, -2, 0, 6);
    ctx.quadraticCurveTo(-8, -2, 0, -16);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Unlit: a cold bowl with a faint "3 embers" hint ring.
    ctx.strokeStyle = 'rgba(154, 148, 194, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(b.x, b.y - 8, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3 embers', b.x, b.y - 34);
  }
}

function drawWisp(ctx, world, w) {
  const burnFrac = w.burn;
  const bob = Math.sin(world.time * 3 + w.wobble) * 3;
  const x = w.x;
  const y = w.y + bob;
  const base = w.kind === 'boss' ? '#ff4d6d' : w.kind === 'brute' ? '#b44dff' : '#8f7bff';
  const core = w.kind === 'boss' ? '#ffd3da' : '#c9bfff';
  // Body glow.
  const glow = ctx.createRadialGradient(x, y, 2, x, y, w.r * 2.4);
  glow.addColorStop(0, base);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.5 + burnFrac * 0.4;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, w.r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Body.
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y, w.r, 0, Math.PI * 2);
  ctx.fill();
  // Eyes: two pale slits that track the Keeper.
  const ang = Math.atan2(world.player.y - y, world.player.x - x);
  ctx.fillStyle = core;
  for (const side of [-1, 1]) {
    const ex = x + Math.cos(ang) * w.r * 0.35 + Math.cos(ang + Math.PI / 2) * side * w.r * 0.38;
    const ey = y + Math.sin(ang) * w.r * 0.35 + Math.sin(ang + Math.PI / 2) * side * w.r * 0.38;
    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(2, w.r * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }
  // Burn ring: the lantern is eating it.
  if (burnFrac > 0.02) {
    ctx.strokeStyle = '#ffc94d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, w.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * burnFrac);
    ctx.stroke();
  }
  // Boss health bar.
  if (w.kind === 'boss') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 34, y - w.r - 18, 68, 7);
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(x - 33, y - w.r - 17, 66 * (w.hp / w.maxHp), 5);
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const aura = auraRadius(world);
  // Lantern aura.
  const glow = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, aura);
  glow.addColorStop(0, 'rgba(255, 201, 77, 0.34)');
  glow.addColorStop(0.6, 'rgba(255, 170, 60, 0.13)');
  glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, aura, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 201, 77, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, aura, 0, Math.PI * 2);
  ctx.stroke();

  const blink = p.invuln > 0 && Math.floor(world.time * 14) % 2 === 0;
  if (!blink) {
    const bob = Math.sin(p.walkPhase) * 2;
    // Cloak.
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 18 + bob);
    ctx.quadraticCurveTo(p.x + 15, p.y + 4 + bob, p.x + 11, p.y + 18 + bob);
    ctx.lineTo(p.x - 11, p.y + 18 + bob);
    ctx.quadraticCurveTo(p.x - 15, p.y + 4 + bob, p.x, p.y - 18 + bob);
    ctx.fill();
    // Hood.
    ctx.fillStyle = '#5a4028';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 12 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    // Face glow.
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.face) * 3, p.y - 12 + bob + Math.sin(p.face) * 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // The lantern, held out to the facing side.
    const lx = p.x + Math.cos(p.face) * 24;
    const ly = p.y + 2 + bob + Math.sin(p.face) * 6;
    ctx.strokeStyle = '#8a6a35';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.face) * 12, p.y + 6 + bob);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    const lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 16);
    lg.addColorStop(0, '#fff3c4');
    lg.addColorStop(0.6, '#ffc94d');
    lg.addColorStop(1, 'rgba(255, 122, 26, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1f14';
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEmbers(ctx, world) {
  for (const e of world.emberDrops) {
    const pulse = 1 + 0.2 * Math.sin(e.phase);
    const g = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, 14 * pulse);
    g.addColorStop(0, '#ffe9a8');
    g.addColorStop(0.5, '#ff9a3c');
    g.addColorStop(1, 'rgba(255, 122, 26, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 14 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.flares) {
    const t = 1 - f.life / f.maxLife;
    ctx.strokeStyle = `rgba(255, 233, 168, ${0.9 * (1 - t)})`;
    ctx.lineWidth = 5 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 20 + t * FLARE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    ctx.fillStyle = f.color;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - (1 - f.life / f.maxLife) * 34);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx, world) {
  // Darkness presses in from the edges; lit braziers hold it back a little.
  const lit = litCount(world);
  const strength = 0.62 - lit * 0.05;
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  g.addColorStop(0, 'rgba(4, 5, 18, 0)');
  g.addColorStop(1, `rgba(4, 5, 18, ${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 233, 168, ${world.flash * 0.22})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -10, 0, -5);
  ctx.bezierCurveTo(6, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.heart : 'rgba(255, 93, 122, 0.22)';
  ctx.fill();
  ctx.restore();
}

function drawHUD(ctx, world) {
  // Top bar.
  ctx.fillStyle = 'rgba(7, 8, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 58);
  ctx.strokeStyle = 'rgba(255, 201, 77, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 58.5);
  ctx.lineTo(VIEW_W, 58.5);
  ctx.stroke();

  // Hearts.
  for (let i = 0; i < 3; i++) heart(ctx, 34 + i * 30, 30, 22, i < world.hearts);

  // Embers carried.
  ctx.fillStyle = '#ff9a3c';
  ctx.beginPath();
  ctx.arc(150, 29, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(150, 29, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${world.embers} / ${MAX_CARRY}`, 164, 36);

  // Braziers lit.
  ctx.textAlign = 'center';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('BRAZIERS', VIEW_W / 2 - 130, 24);
  for (let i = 0; i < BRAZIER_COUNT; i++) {
    const x = VIEW_W / 2 - 66 + i * 34;
    const lit = i < litCount(world);
    ctx.fillStyle = lit ? '#ffc94d' : 'rgba(154, 148, 194, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.quadraticCurveTo(x + 7, 34, x, 42);
    ctx.quadraticCurveTo(x - 7, 34, x, 24);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(`${litCount(world)} / ${BRAZIER_COUNT}`, VIEW_W / 2 + 84, 38);

  // Night + timer (right-aligned block).
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(`NIGHT ${world.night} / ${TOTAL_NIGHTS}`, VIEW_W - 24, 24);
  const frac = 1 - world.nightTime / NIGHT_LENGTH;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(VIEW_W - 164, 32, 140, 8);
  ctx.fillStyle = frac > 0.3 ? '#8f7bff' : '#ff5d7a';
  ctx.fillRect(VIEW_W - 164, 32, 140 * frac, 8);

  // Score sits left of the night block so it never overlaps the timer bar.
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${world.score}`, VIEW_W - 188, 36);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`BEST ${Math.max(world.best, world.score)}`, VIEW_W - 24, 54);

  // Context hint at the bottom.
  let hint = 'WASD / Arrows — move    •    SPACE — flare (2 embers)    •    P — pause';
  const near = nearestUnlit(world);
  if (near && near.dist < 74) {
    hint = world.embers >= EMBERS_TO_LIGHT
      ? 'Press E — LIGHT THE BRAZIER  (3 embers)'
      : `Need ${EMBERS_TO_LIGHT - world.embers} more ember${EMBERS_TO_LIGHT - world.embers === 1 ? '' : 's'} to light this brazier`;
  }
  ctx.fillStyle = 'rgba(7, 8, 24, 0.6)';
  const w = ctx.measureText(hint).width + 28;
  ctx.fillRect((VIEW_W - w) / 2, VIEW_H - 40, w, 28);
  ctx.fillStyle = near && near.dist < 74 ? '#ffe9a8' : PALETTE.dim;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hint, VIEW_W / 2, VIEW_H - 21);
}

function nearestUnlit(world) {
  let bestBrazier = null;
  let bestDist = Infinity;
  for (const b of world.braziers) {
    if (b.lit) continue;
    const dx = world.player.x - b.x;
    const dy = world.player.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      bestBrazier = b;
    }
  }
  return bestBrazier === null ? null : { brazier: bestBrazier, dist: bestDist };
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(5, 6, 18, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 330, 96, 660, 480);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc94d';
  ctx.font = '700 21px system-ui, sans-serif';
  ctx.fillText('— A GAME OF LIGHT AGAINST THE DARK —', VIEW_W / 2, 140);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 74px Georgia, serif';
  ctx.fillText('LUMENKEEPER', VIEW_W / 2, 218);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '400 19px system-ui, sans-serif';
  ctx.fillText('You are the last Keeper of the Ember Vale.', VIEW_W / 2, 258);
  ctx.fillText('Shadow wisps crawl in from the dark. Your lantern burns them;', VIEW_W / 2, 286);
  ctx.fillText('their embers light the five braziers. Light them all before', VIEW_W / 2, 314);
  ctx.fillText('the fifth night ends — or the Vale is lost to the dark.', VIEW_W / 2, 342);

  ctx.fillStyle = '#ffe9a8';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText('WASD / ARROWS — move      E — light a brazier (3 embers)', VIEW_W / 2, 392);
  ctx.fillText('SPACE — flare, burn everything near (2 embers)      P — pause', VIEW_W / 2, 420);

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '400 15px system-ui, sans-serif';
  ctx.fillText('Burn wisps to gather embers. Lit braziers push the dark back', VIEW_W / 2, 458);
  ctx.fillText('and widen your lantern’s light. Three hearts. Five nights. One dawn.', VIEW_W / 2, 480);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffc94d';
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER OR CLICK TO BEGIN', VIEW_W / 2, 540);
  ctx.globalAlpha = 1;

  if (world.best > 0) {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(`Best score: ${world.best}`, VIEW_W / 2, 566);
  }
}

function drawPause(ctx, world) {
  ctx.fillStyle = 'rgba(5, 6, 18, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 220, 250, 440, 190);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 44px Georgia, serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 318);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText('Press P or click to keep the light burning.', VIEW_W / 2, 358);
  ctx.fillText(`Score ${world.score}  •  Night ${world.night}  •  ${litCount(world)} / ${BRAZIER_COUNT} braziers lit`, VIEW_W / 2, 390);
}

function drawEnd(ctx, world, won) {
  ctx.fillStyle = won ? 'rgba(255, 201, 77, 0.16)' : 'rgba(5, 6, 18, 0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 320, 130, 640, 440);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffc94d' : '#ff5d7a';
  ctx.font = '800 56px Georgia, serif';
  ctx.fillText(won ? 'DAWN BREAKS' : 'THE DARK PREVAILS', VIEW_W / 2, 208);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '400 19px system-ui, sans-serif';
  ctx.fillText(world.endReason, VIEW_W / 2, 248);

  const rows = [
    ['Score', String(world.score)],
    ['Wisps burned', String(world.stats.burned)],
    ['Braziers lit', `${world.stats.braziersLit} / ${BRAZIER_COUNT}`],
    ['Flares cast', String(world.stats.flares)],
    ['Nights survived', String(world.stats.nightsSurvived)],
  ];
  if (won) rows.push(['Dawn bonus', `+${world.winBonus}`]);
  rows.push(['Best', String(world.best)]);
  ctx.font = '600 18px system-ui, sans-serif';
  let y = 292;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(label, VIEW_W / 2 - 190, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(value, VIEW_W / 2 + 190, y);
    y += 30;
  }
  if (world.newBest) {
    ctx.fillStyle = '#ffc94d';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW_W / 2, y + 6);
  }
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffc94d';
  ctx.font = '800 23px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PRESS ENTER OR CLICK TO PLAY AGAIN', VIEW_W / 2, 536);
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0.3) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawGround(ctx, world);
  for (const b of world.braziers) drawBrazier(ctx, world, b);
  drawEmbers(ctx, world);
  for (const w of world.wisps) drawWisp(ctx, world, w);
  drawPlayer(ctx, world);
  drawParticles(ctx, world);
  drawVignette(ctx, world);
  ctx.restore();

  if (world.state === 'playing' || world.state === 'paused') drawHUD(ctx, world);
  if (world.state === 'title') drawTitle(ctx, world);
  if (world.state === 'paused') drawPause(ctx, world);
  if (world.state === 'over') drawEnd(ctx, world, false);
  if (world.state === 'win') drawEnd(ctx, world, true);
}
