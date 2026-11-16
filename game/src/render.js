// EMBERDECK renderer: parchment, ink and gold. The board is three lanes
// running at the Heartflame gate; the hand of cards sits below it, big
// enough to read at a glance, and the draft is a full overlay of choices.
import {
  CANVAS, LANES, COLS, CELL_W, CELL_H, BOARD_X, BOARD_Y, GATE_X, HUD_H,
  HAND_Y, NIGHTS, HEART_MAX, CARDS, TOWER_KINDS, BRAZIER_RADIUS, PAL,
} from './config.js';
import { cellCenter, cellDist } from './lanes.js';
import { deckCounts } from './deck.js';
import { handCardRect, beginRect, speedRect, pauseRect, muteRect, startRect, againRect, draftCardRect, keepRect, deckChipRect } from './ui.js';
import { isMuted } from './sound.js';
import { SCREEN_TITLE, SCREEN_PLAN, SCREEN_NIGHT, SCREEN_DRAFT, SCREEN_VICTORY, SCREEN_OVER } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function flame(ctx, x, y, s, t) {
  const wob = Math.sin(t * 5 + x) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wob);
  ctx.fillStyle = '#ff9d2e';
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.6, s * 0.7, 0, s * 0.8);
  ctx.bezierCurveTo(-s * 0.6, s * 0.7, -s * 0.9, -s * 0.2, 0, -s);
  ctx.fill();
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.45, 0, s * 0.3, s * 0.5, 0, s * 0.55);
  ctx.bezierCurveTo(-s * 0.3, s * 0.5, -s * 0.45, 0, 0, -s * 0.45);
  ctx.fill();
  ctx.restore();
}
function kindColor(kind) {
  if (kind === 'tower') return '#2e7f86';
  if (kind === 'wall') return '#8a8a80';
  if (kind === 'brazier') return '#e8a100';
  return '#7c5cff';
}
function drawCardArt(ctx, key, cx, cy, s) {
  const def = CARDS[key];
  ctx.save();
  ctx.translate(cx, cy);
  if (def.kind === 'tower') {
    ctx.fillStyle = '#e8e0cc';
    ctx.fillRect(-s / 2, -s / 4, s, s * 0.7);
    if (key === 'arrow') {
      ctx.fillStyle = '#8a6d4b';
      ctx.fillRect(-3, -s / 2, 6, s * 0.8);
      ctx.fillStyle = '#d8c49a';
      ctx.beginPath(); ctx.moveTo(0, -s / 2 - 6); ctx.lineTo(9, -s / 2 + 6); ctx.lineTo(-9, -s / 2 + 6); ctx.closePath(); ctx.fill();
    } else if (key === 'frost') {
      ctx.fillStyle = '#7fc4e8';
      ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, 0); ctx.lineTo(0, s / 2); ctx.lineTo(-s / 2, 0); ctx.closePath(); ctx.fill();
    } else if (key === 'cannon') {
      ctx.fillStyle = '#4a4a52';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, s / 3); ctx.lineTo(-s / 2, s / 3); ctx.closePath(); ctx.fill();
    }
  } else if (key === 'wall') {
    ctx.fillStyle = '#9a9a92';
    ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);
    ctx.strokeStyle = '#6f6f68';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0); ctx.stroke();
  } else if (key === 'brazier') {
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(-3, -s / 4, 6, s);
    flame(ctx, 0, -s / 2, s * 0.28, 1.2);
  } else if (key === 'ember') {
    flame(ctx, 0, 0, s * 0.42, 1.2);
  } else if (key === 'freeze') {
    ctx.strokeStyle = '#7fc4e8';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath(); ctx.moveTo(-Math.cos(a) * s / 2, -Math.sin(a) * s / 2); ctx.lineTo(Math.cos(a) * s / 2, Math.sin(a) * s / 2); ctx.stroke();
    }
  } else if (key === 'repair') {
    flame(ctx, 0, 0, s * 0.3, 1.2);
    ctx.fillStyle = '#3f8f4f';
    ctx.fillRect(-s * 0.08, -s * 0.42, s * 0.16, s * 0.2);
    ctx.fillRect(-s * 0.16, -s * 0.34, s * 0.32, s * 0.16);
  } else if (key === 'coin') {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8a100';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'g', 0, 1, 'bold 20px Verdana, sans-serif', '#8a6d1f', 'center');
  } else if (key === 'overcharge') {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath(); ctx.moveTo(4, -s / 2); ctx.lineTo(-10, 2); ctx.lineTo(0, 2); ctx.lineTo(-4, s / 2); ctx.lineTo(10, -2); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = '#2e7f86';
    ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s * 0.3, s / 2); ctx.lineTo(-s * 0.3, s / 2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawCard(ctx, key, r, selected, playable, keyNum) {
  const def = CARDS[key];
  ctx.fillStyle = selected ? '#ffe9a8' : '#fffdf5';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = selected ? '#e8a100' : '#cbb27f';
  ctx.lineWidth = selected ? 3 : 1.5;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  ctx.fillStyle = kindColor(def.kind);
  rr(ctx, r.x, r.y, r.w, 34, 12);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 22, r.w, 12);
  text(ctx, def.kind.toUpperCase(), r.x + 12, r.y + 18, 'bold 12px Verdana, sans-serif', '#fff');
  text(ctx, def.name, r.x + 12, r.y + 56, 'bold 17px Verdana, sans-serif', PAL.ink);
  // Cost coin.
  ctx.fillStyle = playable ? '#ffcf3f' : '#d8cdb2';
  ctx.beginPath(); ctx.arc(r.x + r.w - 22, r.y + 56, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8a100';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, `${def.cost}`, r.x + r.w - 22, r.y + 57, 'bold 13px Verdana, sans-serif', '#2b2620', 'center');
  drawCardArt(ctx, key, r.x + r.w / 2, r.y + 112, 52);
  text(ctx, def.blurb, r.x + r.w / 2, r.y + 162, '12px Verdana, sans-serif', PAL.inkSoft, 'center');
  if (keyNum) text(ctx, `[${keyNum}]`, r.x + 12, r.y + r.h - 14, 'bold 12px Verdana, sans-serif', PAL.inkSoft);
  if (!playable) {
    ctx.fillStyle = 'rgba(239,232,212,0.55)';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
  }
}
function drawBuilding(ctx, b, cx, cy, t) {
  const s = CELL_W;
  if (b.kind === 'wall') {
    ctx.fillStyle = '#9a9a92';
    ctx.fillRect(cx - 34, cy - 30, 68, 60);
    ctx.strokeStyle = '#6f6f68';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 34, cy - 10); ctx.lineTo(cx + 34, cy - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 34, cy + 10); ctx.lineTo(cx + 34, cy + 10); ctx.stroke();
    if (b.hp < b.maxHp) {
      ctx.fillStyle = '#d64541';
      ctx.fillRect(cx - 34, cy - 38, 68 * (b.hp / b.maxHp), 5);
    }
    return;
  }
  if (b.kind === 'brazier') {
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(cx - 3, cy - 6, 6, 40);
    ctx.fillStyle = '#3d2f24';
    ctx.fillRect(cx - 12, cy - 12, 24, 8);
    flame(ctx, cx, cy - 20, 11, t);
    ctx.strokeStyle = 'rgba(255,207,63,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, BRAZIER_RADIUS * CELL_W, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  // Towers.
  ctx.fillStyle = '#e8e0cc';
  ctx.fillRect(cx - 26, cy - 8, 52, 40);
  ctx.fillStyle = '#c9bfa5';
  ctx.fillRect(cx - 26, cy - 8, 52, 7);
  drawCardArt(ctx, b.kind, cx, cy - 6, 44);
  ctx.fillStyle = '#e8a100';
  for (let i = 0; i < b.tier; i += 1) {
    ctx.beginPath(); ctx.arc(cx - 14 + i * 14, cy + 38, 4, 0, Math.PI * 2); ctx.fill();
  }
}
function drawEnemy(ctx, e) {
  const r = e.def.radius;
  ctx.save();
  if (e.hitFlash > 0) ctx.globalAlpha = 0.6;
  ctx.fillStyle = e.def.color;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(43,38,32,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (e.kind === 'bat') {
    ctx.beginPath(); ctx.moveTo(e.x - r, e.y); ctx.lineTo(e.x - r - 12, e.y - 10); ctx.lineTo(e.x - r - 4, e.y + 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.x + r, e.y); ctx.lineTo(e.x + r + 12, e.y - 10); ctx.lineTo(e.x + r + 4, e.y + 4); ctx.closePath(); ctx.fill();
  }
  if (e.kind === 'king') {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath();
    ctx.moveTo(e.x - 16, e.y - r - 2); ctx.lineTo(e.x - 8, e.y - r - 14); ctx.lineTo(e.x, e.y - r - 4); ctx.lineTo(e.x + 8, e.y - r - 14); ctx.lineTo(e.x + 16, e.y - r - 2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(e.x - 4, e.y - 3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x + 5, e.y - 3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(e.x - 3, e.y - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x + 6, e.y - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (e.hp < e.maxHp) {
    const w = r * 2;
    ctx.fillStyle = 'rgba(43,38,32,0.55)';
    ctx.fillRect(e.x - w / 2, e.y - r - 9, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#3f8f4f' : '#d64541';
    ctx.fillRect(e.x - w / 2, e.y - r - 9, w * Math.max(0, e.hp / e.maxHp), 5);
  }
}
function drawBoard(ctx, state, t) {
  const night = state.screen === SCREEN_NIGHT;
  // Spawn gate (left) and Heartflame gate (right).
  ctx.fillStyle = PAL.gate;
  rr(ctx, 20, BOARD_Y, 110, LANES * CELL_H, 14);
  ctx.fill();
  text(ctx, 'GLOOM', 75, BOARD_Y + 30, 'bold 15px Verdana, sans-serif', '#c9b8a8', 'center');
  text(ctx, 'enters', 75, BOARD_Y + 54, '13px Verdana, sans-serif', '#c9b8a8', 'center');
  text(ctx, 'here', 75, BOARD_Y + 76, '13px Verdana, sans-serif', '#c9b8a8', 'center');
  for (let lane = 0; lane < LANES; lane += 1) {
    const y = BOARD_Y + lane * CELL_H;
    ctx.fillStyle = lane % 2 === 0 ? PAL.laneA : PAL.laneB;
    ctx.fillRect(BOARD_X, y, COLS * CELL_W, CELL_H);
    ctx.strokeStyle = 'rgba(43,38,32,0.18)';
    ctx.lineWidth = 1;
    for (let c = 0; c < COLS; c += 1) ctx.strokeRect(BOARD_X + c * CELL_W + 0.5, y + 0.5, CELL_W - 1, CELL_H - 1);
    // Lane arrows.
    ctx.fillStyle = 'rgba(43,38,32,0.14)';
    for (let c = 0; c < COLS; c += 1) {
      const ax = BOARD_X + c * CELL_W + 14;
      ctx.beginPath(); ctx.moveTo(ax, y + CELL_H / 2 - 6); ctx.lineTo(ax + 10, y + CELL_H / 2); ctx.lineTo(ax, y + CELL_H / 2 + 6); ctx.closePath(); ctx.fill();
    }
  }
  // Heart gate.
  const gy = BOARD_Y;
  const gh = LANES * CELL_H;
  ctx.fillStyle = '#3a2c22';
  rr(ctx, GATE_X, gy, 130, gh, 14);
  ctx.fill();
  flame(ctx, GATE_X + 65, gy + gh / 2 - 10, 30, t);
  text(ctx, 'HEARTFLAME', GATE_X + 65, gy + gh - 26, 'bold 13px Verdana, sans-serif', '#ffcf3f', 'center');
  if (night) {
    ctx.fillStyle = PAL.nightTint;
    ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL_W, LANES * CELL_H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, rad) => {
      const g = ctx.createRadialGradient(x, y, 6, x, y, rad);
      g.addColorStop(0, 'rgba(255,205,80,0.38)');
      g.addColorStop(1, 'rgba(255,205,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    };
    glow(GATE_X + 65, gy + gh / 2, 150);
    for (let lane = 0; lane < LANES; lane += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const b = state.board[lane][c];
        if (b && b.kind === 'brazier') {
          const p = cellCenter(lane, c);
          glow(p.x, p.y, BRAZIER_RADIUS * CELL_W);
        }
      }
    }
    ctx.restore();
  }
  // Buildings.
  for (let lane = 0; lane < LANES; lane += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const b = state.board[lane][c];
      if (!b) continue;
      const p = cellCenter(lane, c);
      drawBuilding(ctx, b, p.x, p.y, t);
    }
  }
  // Selected cell ring + range.
  if (state.selectedCell) {
    const b = state.board[state.selectedCell.lane]?.[state.selectedCell.col];
    const p = cellCenter(state.selectedCell.lane, state.selectedCell.col);
    if (b && CARDS[b.kind].tier) {
      ctx.strokeStyle = 'rgba(46,127,134,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, CARDS[b.kind].tier[b.tier - 1].range * CELL_W, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#2e7f86';
    ctx.lineWidth = 3;
    ctx.strokeRect(BOARD_X + state.selectedCell.col * CELL_W + 1, BOARD_Y + state.selectedCell.lane * CELL_H + 1, CELL_W - 2, CELL_H - 2);
  }
  // Enemies, projectiles, beams, particles, floats.
  for (const e of state.enemies) drawEnemy(ctx, e);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 3;
  for (const beam of state.beams) {
    ctx.globalAlpha = Math.max(0, beam.life / beam.max);
    ctx.beginPath(); ctx.moveTo(beam.x1, beam.y1); ctx.lineTo(beam.x2, beam.y2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of state.projectiles) {
    ctx.fillStyle = p.kind === 'frost' ? '#7fc4e8' : p.kind === 'cannon' ? '#2e2e34' : '#8a6d4b';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
  }
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 'bold 16px Verdana, sans-serif', f.color, 'center');
  }
  ctx.globalAlpha = 1;
}
function drawHud(ctx, state) {
  ctx.fillStyle = PAL.panel;
  ctx.fillRect(0, 0, CANVAS.width, HUD_H);
  ctx.fillStyle = '#e0cfa5';
  ctx.fillRect(0, HUD_H - 3, CANVAS.width, 3);
  text(ctx, 'EMBERDECK', 16, 34, 'bold 26px Georgia, serif', PAL.ink);
  const phase = state.screen === SCREEN_PLAN ? `Night ${state.night} — plan your hand` : state.screen === SCREEN_NIGHT ? `Night ${state.night} of ${NIGHTS}` : state.screen === SCREEN_DRAFT ? `Night ${state.night} survived — draft!` : `Night ${state.night} of ${NIGHTS}`;
  text(ctx, phase, 216, 34, 'bold 20px Verdana, sans-serif', PAL.teal);
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath(); ctx.arc(540, 32, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8a100';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, `${state.gold}`, 558, 34, 'bold 22px Verdana, sans-serif', PAL.ink);
  flame(ctx, 640, 32, 10, state.time);
  ctx.fillStyle = '#e8d5a8';
  rr(ctx, 658, 22, 110, 18, 9);
  ctx.fill();
  ctx.fillStyle = state.heartHp > HEART_MAX * 0.5 ? '#3f8f4f' : '#d64541';
  rr(ctx, 658, 22, 110 * Math.max(0, state.heartHp / HEART_MAX), 18, 9);
  ctx.fill();
  text(ctx, `${Math.ceil(state.heartHp)}/${HEART_MAX}`, 774, 34, 'bold 15px Verdana, sans-serif', PAL.ink);
  if (state.screen === SCREEN_NIGHT) {
    text(ctx, `WAVE ${state.nightSpawned}/${state.nightTotal}`, 830, 34, 'bold 14px Verdana, sans-serif', PAL.inkSoft);
  }
  if (state.time < state.overchargeUntil) text(ctx, 'OVERCHARGED x2', 830, 34, 'bold 14px Verdana, sans-serif', '#b03a2e');
  const btn = (r, label, active) => {
    ctx.fillStyle = active ? '#2e7f86' : '#efe0bd';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbb27f';
    ctx.lineWidth = 1.5;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, 'bold 15px Verdana, sans-serif', active ? '#fff' : PAL.ink, 'center');
  };
  btn(speedRect(), state.speed === 2 ? '2x' : '1x', state.speed === 2);
  btn(pauseRect(), state.paused ? '▶' : 'II', state.paused);
  btn(muteRect(), isMuted() ? '✕' : '♪', false);
  if (state.screen === SCREEN_PLAN) {
    const r = beginRect();
    ctx.fillStyle = '#e8a100';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    text(ctx, 'BEGIN NIGHT ▸', r.x + r.w / 2, r.y + r.h / 2 + 1, 'bold 16px Verdana, sans-serif', '#fff', 'center');
  }
}
function drawHand(ctx, state) {
  // Deck + discard piles at the right of the hand.
  ctx.fillStyle = PAL.panel;
  rr(ctx, 1150, HAND_Y, 114, 190, 12);
  ctx.fill();
  ctx.strokeStyle = '#cbb27f';
  rr(ctx, 1150, HAND_Y, 114, 190, 12);
  ctx.stroke();
  text(ctx, 'DECK', 1207, HAND_Y + 26, 'bold 13px Verdana, sans-serif', PAL.teal, 'center');
  text(ctx, `${state.deck.length}`, 1207, HAND_Y + 66, 'bold 34px Georgia, serif', PAL.ink, 'center');
  text(ctx, 'cards left', 1207, HAND_Y + 96, '12px Verdana, sans-serif', PAL.inkSoft, 'center');
  text(ctx, `Discard ${state.discard.length}`, 1207, HAND_Y + 130, '12px Verdana, sans-serif', PAL.inkSoft, 'center');
  text(ctx, `Deck ${state.deck.length + state.discard.length + state.hand.length}`, 1207, HAND_Y + 152, '12px Verdana, sans-serif', PAL.inkSoft, 'center');
  for (let i = 0; i < state.hand.length; i += 1) {
    const card = state.hand[i];
    const def = CARDS[card.key];
    const r = handCardRect(i);
    const raised = state.selectedHand === i;
    drawCard(ctx, card.key, { x: r.x, y: raised ? r.y - 12 : r.y, w: r.w, h: r.h }, raised, state.gold >= def.cost, `${i + 1}`);
  }
  // Status strip between board and hand.
  let hint = '';
  if (state.selectedHand !== null && state.hand[state.selectedHand]) {
    const key = state.hand[state.selectedHand].key;
    const def = CARDS[key];
    hint = def.kind === 'spell' && key === 'reinforce'
      ? 'Reinforce: click one of your towers to raise it a tier.'
      : `${def.name} — click a lane cell to place it. (Esc to cancel)`;
  } else if (state.selectedCell) {
    const b = state.board[state.selectedCell.lane]?.[state.selectedCell.col];
    if (b) {
      const def = CARDS[b.kind];
      hint = `${def.name} · tier ${b.tier} of 3` + (def.tier ? ` · ${def.tier[b.tier - 1].dmg} dmg, ${def.tier[b.tier - 1].rate}/s` : ` · ${def.blurb}`);
    }
  } else if (state.screen === SCREEN_PLAN) {
    hint = 'Play cards from your hand, then BEGIN NIGHT. Spells work during the night too.';
  } else if (state.screen === SCREEN_NIGHT) {
    hint = 'The Gloom walks. Play spells from your hand, or place cards on empty cells.';
  }
  text(ctx, hint, 150, HAND_Y - 16, 'italic 15px Georgia, serif', PAL.inkSoft);
}
function drawDraft(ctx, state) {
  ctx.fillStyle = 'rgba(43,38,32,0.55)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  const px = 140;
  const py = 90;
  const pw = 1000;
  const ph = 590;
  ctx.fillStyle = PAL.panel;
  rr(ctx, px, py, pw, ph, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8a100';
  ctx.lineWidth = 3;
  rr(ctx, px, py, pw, ph, 18);
  ctx.stroke();
  if (!state.draftPicked) {
    text(ctx, `NIGHT ${state.night} SURVIVED — DRAFT A CARD`, 640, py + 52, 'bold 30px Georgia, serif', PAL.ink, 'center');
    text(ctx, 'Pick one to add to your deck. It will be drawn on later dawns.', 640, py + 88, '16px Verdana, sans-serif', PAL.inkSoft, 'center');
    for (let i = 0; i < 3; i += 1) {
      const key = state.draftChoices[i];
      if (key) drawCard(ctx, key, draftCardRect(i), false, true, null);
    }
  } else {
    text(ctx, `You drafted ${CARDS[state.draftPicked].name}!`, 640, py + 52, 'bold 30px Georgia, serif', PAL.ink, 'center');
    text(ctx, 'Thin your deck (optional): click a card below to remove one copy — or keep them all.', 640, py + 88, '16px Verdana, sans-serif', PAL.inkSoft, 'center');
    const counts = deckCounts(state);
    const keys = Object.keys(counts);
    keys.forEach((key, i) => {
      const r = deckChipRect(i);
      ctx.fillStyle = '#fffdf5';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbb27f';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.stroke();
      text(ctx, `${CARDS[key].name} ×${counts[key]}`, r.x + 10, r.y + r.h / 2 + 1, '13px Verdana, sans-serif', PAL.ink);
    });
    const r = keepRect();
    ctx.fillStyle = '#e8a100';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    text(ctx, 'KEEP THEM ALL — NEXT NIGHT ▸', r.x + r.w / 2, r.y + r.h / 2 + 1, 'bold 16px Verdana, sans-serif', '#fff', 'center');
  }
}
function drawTitle(ctx, state, best) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS.height);
  g.addColorStop(0, '#bfe3f2');
  g.addColorStop(0.6, '#f7ead0');
  g.addColorStop(1, '#cfe3b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath(); ctx.arc(1080, 130, 62, 0, Math.PI * 2); ctx.fill();
  // A fan of cards.
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(640 + i * 90, 500);
    ctx.rotate(i * 0.12);
    ctx.fillStyle = '#fffdf5';
    rr(ctx, -65, -100, 130, 175, 12);
    ctx.fill();
    ctx.strokeStyle = '#cbb27f';
    ctx.lineWidth = 2;
    rr(ctx, -65, -100, 130, 175, 12);
    ctx.stroke();
    ctx.restore();
  }
  text(ctx, 'EMBERDECK', 640, 210, 'bold 92px Georgia, serif', PAL.ink, 'center');
  text(ctx, 'Your deck is your town’s wall.', 640, 292, 'bold 30px Georgia, serif', '#8a6d1f', 'center');
  text(ctx, 'A deck-builder defense — draft cards, raise towers, hold 10 nights.', 640, 336, '20px Verdana, sans-serif', PAL.inkSoft, 'center');
  const r = startRect();
  ctx.fillStyle = '#e8a100';
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#b97d00';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.stroke();
  text(ctx, '▶  SHUFFLE UP', r.x + r.w / 2, r.y + r.h / 2 + 1, 'bold 22px Verdana, sans-serif', '#fff', 'center');
  text(ctx, 'Click a card, then a lane cell · Keys 1-5 play cards · B begins the night', 640, 580, '16px Verdana, sans-serif', PAL.inkSoft, 'center');
  if (best > 0) text(ctx, `Best so far: night ${best} of ${NIGHTS}`, 640, 612, 'bold 16px Verdana, sans-serif', PAL.teal, 'center');
  text(ctx, 'An original game · art, sound and names are its own', 640, 684, '13px Verdana, sans-serif', PAL.inkSoft, 'center');
}
function drawEndPanel(ctx, state, won, best) {
  ctx.fillStyle = 'rgba(43,38,32,0.45)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  const pw = 640;
  const ph = 480;
  const px = (CANVAS.width - pw) / 2;
  const py = (CANVAS.height - ph) / 2;
  ctx.fillStyle = PAL.panel;
  rr(ctx, px, py, pw, ph, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8a100';
  ctx.lineWidth = 3;
  rr(ctx, px, py, pw, ph, 18);
  ctx.stroke();
  if (won) {
    text(ctx, 'DAWN BREAKS!', 640, py + 64, 'bold 44px Georgia, serif', PAL.ink, 'center');
    text(ctx, 'The deck held. The Heartflame still burns.', 640, py + 108, '18px Verdana, sans-serif', PAL.inkSoft, 'center');
    for (let i = 0; i < 3; i += 1) {
      const sx = 640 + (i - 1) * 72;
      const sy = py + 168;
      ctx.fillStyle = i < state.stars ? '#ffcf3f' : '#e0d5b8';
      ctx.beginPath();
      for (let k = 0; k < 10; k += 1) {
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = k % 2 === 0 ? 26 : 11;
        const vx = sx + Math.cos(a) * rad;
        const vy = sy + Math.sin(a) * rad;
        if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      }
      ctx.closePath(); ctx.fill();
    }
    text(ctx, state.stars === 3 ? 'A flawless deck — the flame barely flickered.' : state.stars === 2 ? 'A hard-won dawn — the flame held.' : 'Dawn, by an ember — the flame nearly died.', 640, py + 216, 'italic 16px Georgia, serif', PAL.inkSoft, 'center');
  } else {
    text(ctx, 'THE LIGHT WENT OUT', 640, py + 64, 'bold 40px Georgia, serif', '#8a2f2b', 'center');
    text(ctx, `The Gloom reached the Heartflame on night ${state.night}.`, 640, py + 108, '18px Verdana, sans-serif', PAL.inkSoft, 'center');
    text(ctx, 'Draft more walls and frost, and shuffle up again.', 640, py + 140, '16px Verdana, sans-serif', PAL.inkSoft, 'center');
  }
  const stats = [
    ['Nights survived', won ? `${NIGHTS} / ${NIGHTS}` : `${state.night - 1} / ${NIGHTS}`],
    ['Foes vanquished', `${state.kills}`],
    ['Cards played', `${state.cardsPlayed}`],
    ['Deck size', `${state.deck.length + state.discard.length + state.hand.length}`],
    ['Heart remaining', `${Math.ceil(state.heartHp)} / ${HEART_MAX}`],
  ];
  stats.forEach(([k, v], i) => {
    text(ctx, k, px + 90, py + 268 + i * 30, '16px Verdana, sans-serif', PAL.inkSoft);
    text(ctx, v, px + pw - 90, py + 268 + i * 30, 'bold 16px Verdana, sans-serif', PAL.ink, 'right');
  });
  const r = againRect();
  ctx.fillStyle = '#e8a100';
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fill();
  text(ctx, '↻  SHUFFLE UP AGAIN', r.x + r.w / 2, r.y + r.h / 2 + 1, 'bold 22px Verdana, sans-serif', '#fff', 'center');
}
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function draw(state, screen, best, mouse) {
    const t = state.time;
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(ctx, state, best);
      return;
    }
    ctx.fillStyle = '#e9dcba';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    drawBoard(ctx, state, t);
    drawHand(ctx, state);
    drawHud(ctx, state);
    if (screen === SCREEN_DRAFT) drawDraft(ctx, state);
    if (screen === SCREEN_VICTORY) drawEndPanel(ctx, state, true, best);
    if (screen === SCREEN_OVER) drawEndPanel(ctx, state, false, best);
    if (state.paused && (screen === SCREEN_PLAN || screen === SCREEN_NIGHT)) {
      ctx.fillStyle = 'rgba(43,38,32,0.45)';
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
      text(ctx, 'PAUSED', 640, 340, 'bold 56px Georgia, serif', '#fff', 'center');
      text(ctx, 'Press Space or click II to resume', 640, 400, '20px Verdana, sans-serif', '#fff', 'center');
    }
  }
  return { draw };
}
