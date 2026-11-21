// shots.js — fixed scenes for screenshots. Query params:
//   shot=cover  — the cover alone, full window (body.shot-cover hides the editor)
//   shot=editor — the editor with a sample photo loaded in all panels
//   photo=pier|boulevard  caption=...  subtitle=...
//   layout=grid|split|strip  grade=sunset|neon|palm  size=1080x1080|1080x1350|1920x1080
//   panel2 / panel3 — optional second and third sample photos
// window.__shotReady is set once the scene is painted with the Anton font loaded.
export async function runShot(shot, params, poster, helpers) {
  const { loadImage, refresh, putPhoto } = helpers;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (params.get('layout')) poster.layout = params.get('layout');
  if (params.get('grade')) poster.grade = params.get('grade');
  if (params.get('size')) poster.size = params.get('size');
  if (params.get('caption')) {
    document.getElementById('title').value = params.get('caption');
    poster.title = params.get('caption');
  }
  if (params.get('subtitle')) {
    document.getElementById('subtitle').value = params.get('subtitle');
    poster.subtitle = params.get('subtitle');
  }
  const first = params.get('photo') ?? 'pier';
  const names = [first, params.get('panel2') ?? first, params.get('panel3') ?? first];
  for (let i = 0; i < 3; i++) {
    try {
      putPhoto(i, await loadImage(`samples/${names[i]}.jpg`));
    } catch {
      // Leave the panel empty if its sample fails to load.
    }
  }
  // Frame each panel a little differently so the poster never looks cloned,
  // and slide each photo down so faces stay in frame.
  poster.panels[0].dy = 170;
  poster.panels[1].scale = 1.2;
  poster.panels[1].dx = -30;
  poster.panels[1].dy = 90;
  poster.panels[2].scale = 1.1;
  poster.panels[2].dy = 120;
  const sizeEl = document.getElementById('size');
  if (params.get('size') && sizeEl) sizeEl.value = params.get('size');
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch {
    // Fall back to the system font if Anton fails to load.
  }
  refresh();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
