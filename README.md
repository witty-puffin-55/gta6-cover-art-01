# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Maker — turn a photo and a caption into a multi-panel GTA-style cover poster: bold Anton lettering, a Vice City sunset or neon grade, three layouts, and PNG export in 1080×1080, 1080×1350 and 1920×1080. Fully offline — your photos never leave your machine. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- One photo per panel, or one photo across all three — drag to pan, zoom 1–3×, reset framing per panel
- Three poster layouts: Hero grid, Big-left split, Three strips
- Three grades: Sunset, Neon night, Palm gold — gradient-mapped over each photo
- Caption in Anton with a subtitle line, sized to fit the poster
- One-click PNG export in all three post sizes: 1080×1080, 1080×1350, 1920×1080
- Sample photos included, or upload your own — nothing is ever uploaded to a server

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `app/` is plain static files. Lettering is Anton under the SIL Open Font License (`app/fonts/OFL.txt`). No Rockstar Games logo, artwork or fonts are used anywhere.

## How the entry is built

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-app.ts`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` are the app's own `?shot=` scenes (see `shots.json`): the square cover, the editor, the portrait cover and the wide cover.
