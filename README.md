# Vice Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into a multi-panel GTA-style cover poster — bold lettering, Vice City sunset and neon grades, three layouts, PNG export. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- Upload a photo per panel, drag to pan, zoom 1–3×, reset framing
- Three poster layouts: Hero+2 grid, Big-left split, Three-strip
- Caption title in a vendored display font with gradient fill and neon glow, plus subtitle
- Three colour grades: Sunset, Neon, Palm
- Export the cover as PNG in 1080×1080, 1080×1350, or 1920×1080

## Run it

```bash
# serve the app locally (Node 22)
node serve.ts
```

The entry program is `main.ts` (Node 22, standard library only): it copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

## Screenshots

- `screenshots/1-cover.jpg` — square cover, grid layout, Sunset grade
- `screenshots/2-editor.jpg` — the editor with a photo loaded
- `screenshots/3-cover-1350.jpg` — portrait cover, split layout, Neon grade
- `screenshots/4-cover-wide.jpg` — wide cover, strip layout, Palm grade

No Rockstar logos, artwork, or fonts are used. The display font is Anton (SIL OFL, vendored under `app/fonts/`).
