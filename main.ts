// Hands in the Vice Cover Maker entry for gta6-cover-art-01 (Node 22, standard
// library only). The app is plain static files under app/ — index.html, its ES
// modules, the vendored Anton font and the sample photos — that a desktop browser
// opens offline with no network request. This program copies app/ and
// screenshots/ from beside this file into /output (or MAKEFUN_OUTPUT_DIR outside
// the grader) and writes /output/dossier.json with the vendored make.fun library,
// so the judge reads the same dossier the scorer rebuilds from those files.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps: text_max_bytes shapes the dossier text; the rest refuse an
// entry the scorer would refuse (over 4 screenshots or one over 256 KiB; app/
// over 993 entries or 48 MiB in all, or a path over 1000 bytes — app/ shares
// /output's own 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
