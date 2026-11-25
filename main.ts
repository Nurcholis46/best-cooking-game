// Sizzle & Serve — Dapur Kilat hand-in (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This program copies game/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library.
//
// Improvements over the kit starter: fail fast with a clear error when the
// game entry point or screenshots are missing instead of handing in a broken
// output; enforce the scorer's screenshot caps before copying so an oversize
// shot cannot silently break the hand-in; and leave every output readable
// (files 0644, folders 0755) because the grader collects /output as another
// user. Finally it verifies dossier.json parses and logs a short summary.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const GAME_ENTRY = join(here, 'game', 'index.html');
if (!existsSync(GAME_ENTRY)) {
  throw new Error(`game entry point missing: ${GAME_ENTRY} — refusing to hand in a broken game`);
}

const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
  : [];
if (shots.length === 0) throw new Error('no screenshots found: add 3-4 PNG/JPEG shots to screenshots/');
if (shots.length > 4) throw new Error(`too many screenshots: ${shots.length} (max 4)`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) throw new Error(`screenshot ${shot} is ${size} bytes (max 262144)`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Leave every output readable by every user (files 0644, folders 0755),
// then verify the dossier parses and report what was handed in.
const chmodTree = (dir) => {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) chmodTree(p);
    else chmodSync(p, 0o644);
  }
};
chmodTree(out);
const dossier = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
console.log(`handed in: ${gameFiles} game entries, ${shots.length} screenshots, dossier title: ${dossier.title ?? 'Sizzle & Serve'}`);
