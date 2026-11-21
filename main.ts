// main.ts — hands in the Vice Cover Maker entry for gta6-cover-art-01.
//
// The app is plain static files under app/: index.html, its ES modules, the
// vendored Anton font and two sample photos. A desktop browser opens it
// offline with no network request at all. This program (Node 22, standard
// library only) copies app/ and screenshots/ from beside this file into the
// output directory — /output in the grader, MAKEFUN_OUTPUT_DIR anywhere else
// — and writes output/dossier.json with the vendored make.fun library, so the
// judge reads the same dossier the scorer rebuilds from those files.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps, from the kit's reference/gate.json: text_max_bytes shapes
// the dossier text; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB; app/ over 993 files or 48 MiB in
// all, or a path over 1000 bytes. (app/ shares /output's own 1000-entry cap
// with screenshots/ and dossier.json.)
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
