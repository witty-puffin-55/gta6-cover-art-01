// Vice Cover Maker — entrypoint (Node 22, standard library only).
// Hands the app in: copies this directory's app/ (the offline cover
// studio) and screenshots/ (the four judged images) to the output
// directory and writes /output/dossier.json, the summary the judge
// reads, using the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader sets MAKEFUN_OUTPUT_DIR to /output itself.

import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// The app, as static files: index.html plus every script, image
// and font it loads, all under app/.
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });

// The judged screenshots: the first by name is the cover.
const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), shotsDir, { recursive: true });
}

// The scorer's own caps for this bounty: at most 4 screenshots of
// at most 256 KiB, app/ at most 993 files and 48 MiB, the dossier's
// text at most 160 KiB. Anything over them is refused here, so the
// entry the scorer sees is one it would accept.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
