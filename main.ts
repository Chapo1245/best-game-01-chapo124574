// EMBERDECK entry program (Node 22, standard library only).
//
// The entry is the game in game/ — plain static files that a desktop
// browser loads offline (game/index.html and its ES modules, no library,
// no network request) — plus the four screenshots in screenshots/.
// This program copies both into /output and writes /output/dossier.json
// with the vendored make.fun library, the summary the judge reads.
//
// The game: a deck-builder defense. Your deck is your town's wall: play
// cards to raise towers, walls and braziers on three lanes, hold the
// Heartflame through ten nights, and draft one new card after every
// night — then thin the deck by removing a card you no longer want.
// Screenshots: 1-play is the cover, then 2-title, 3-boss, 4-victory.
// The cover is a night-defence play shot on purpose: the judge reads the
// game mostly through its screenshots, and the first one is the largest.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps from the scorer (reference/gate.json): text_max_bytes shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots, one over 256 KiB, more than 993 files in game/,
// 48 MiB of game files in all, or a game path over 1000 bytes. game/
// shares /output's own 1000-entry cap with screenshots/ and dossier.json.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
