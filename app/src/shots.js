// Shot scenes for deterministic screenshots (?shot=<name>).
// Each scene presets a layout, a grade and a caption, then renders
// the poster at a fixed size so screenshots are repeatable.
// The shoot script visits ?shot=cover, ?shot=editor, ?shot=cover1350
// and ?shot=wide and captures each page as a JPEG.
export const SHOTS = {
  cover: {
    kind: 'poster',
    width: 1080,
    height: 1080,
    layout: 'grid',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'A Vice City story',
    photos: ['boulevard', 'pier', 'boulevard'],
    // The hero panel is wide and short, so the cover-fit crop cuts
    // the top of the boulevard photo; pan it down to keep her face.
    framing: [{ panX: 0, panY: 0.35, zoom: 1 }, null, null],
  },
  cover1350: {
    kind: 'poster',
    width: 1080,
    height: 1350,
    layout: 'split',
    grade: 'neon',
    title: 'BOULEVARD QUEEN',
    subtitle: 'Neon nights downtown',
    photos: ['pier', 'boulevard', 'pier'],
  },
  wide: {
    kind: 'poster',
    width: 1920,
    height: 1080,
    layout: 'strip',
    grade: 'palm',
    title: 'NEON NIGHTS',
    subtitle: 'Three friends, one long night',
    photos: ['boulevard', 'pier', 'boulevard'],
  },
  editor: {
    kind: 'editor',
    width: 1280,
    height: 720,
    layout: 'grid',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'A Vice City story',
    photos: ['boulevard', 'pier', 'boulevard'],
    framing: [{ panX: 0, panY: 0.35, zoom: 1 }, null, null],
  },
};

export function shotFor(name) {
  return SHOTS[name] ?? null;
}
