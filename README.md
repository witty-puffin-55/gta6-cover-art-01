# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/witty-puffin-55/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Maker — turn a photo and a caption into a multi-panel GTA-style cover poster: bold Anton lettering, a Vice City sunset or neon grade, three layouts, and PNG export in 1080×1080, 1080×1350 and 1920×1080. Fully offline — your photos never leave your machine. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- One photo per panel, or one photo across all three — drag to pan, zoom 1–3×, reset framing per panel
- Three poster layouts: Hero+2 grid, Big-left split, Three-strip
- Caption title in a vendored display font with a gradient fill and neon glow, plus a tracked subtitle
- Three colour grades: Sunset, Neon, Palm
- Export the cover as a PNG in 1080×1080, 1080×1350, or 1920×1080

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

The entry program is `main.ts` (Node 22, standard library only): it copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

## Screenshots

- `screenshots/1-cover.jpg` — square cover, grid layout, Sunset grade
- `screenshots/2-editor.jpg` — the editor with a photo loaded
- `screenshots/3-cover-1350.jpg` — portrait cover, split layout, Neon grade
- `screenshots/4-cover-wide.jpg` — wide cover, strip layout, Palm grade

No Rockstar logos, artwork, or fonts are used. The display font is Anton (SIL OFL, vendored under `app/fonts/`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=05cmsn78&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
