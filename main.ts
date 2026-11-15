// Lumenkeeper — the entry program for make.fun best-game-01.
// Copies game/ and screenshots/ into /output (or $MAKEFUN_OUTPUT_DIR) and
// writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Pure Node standard library; deterministic: the same input files always
// produce the same output bytes.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ in the repository`);
  cpSync(src, dst, { recursive: true });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Sanity line for the run log: the dossier must name every screenshot.
const dossierText = new TextDecoder('utf-8').decode(dossier);
const shotCount = (dossierText.match(/"name":"/g) ?? []).length;
console.log(`lumenkeeper: wrote ${outDir} (dossier.json ${dossier.length} bytes, ${shotCount} screenshots)`);
