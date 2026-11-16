// EMBERWARD — entry program (best-game-01).
// Copies game/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs twice and writes identical bytes: files are copied in sorted order and
// the dossier builder writes canonical JSON.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

// best-game-01 gate limits (competition.yaml reference/gate.json).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const REPO_DIR = new URL('.', import.meta.url).pathname;

function clearContents(dir) {
  // Never remove the directory itself: on the grader it may be a bind-mount.
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function copyTreeSorted(src, dest) {
  mkdirSync(dest, { recursive: true });
  const names = readdirSync(src).sort();
  for (const name of names) {
    const from = join(src, name);
    const to = join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) {
      copyTreeSorted(from, to);
    } else if (st.isFile()) {
      cpSync(from, to);
    }
  }
}

function main() {
  if (!existsSync(join(REPO_DIR, 'game', 'index.html'))) {
    throw new Error('EMBERWARD: game/index.html is missing from the repository');
  }
  clearContents(OUTPUT_DIR);
  copyTreeSorted(join(REPO_DIR, 'game'), join(OUTPUT_DIR, 'game'));
  copyTreeSorted(join(REPO_DIR, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));
  const dossier = buildDossier(OUTPUT_DIR, CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  const gameFiles = readdirSync(join(OUTPUT_DIR, 'game'), { recursive: true }).length;
  const shots = readdirSync(join(OUTPUT_DIR, 'screenshots')).length;
  console.log(`EMBERWARD: wrote ${OUTPUT_DIR} (game files: ${gameFiles}, screenshots: ${shots}, dossier: ${dossier.length} bytes)`);
}

main();
