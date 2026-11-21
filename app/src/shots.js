// Fixed scenes for screenshots. Query params:
//   shot=cover  — the cover alone, full window (body.shot-cover hides the editor)
//   shot=editor — the editor with a sample photo loaded in all panels
//   photo=pier|boulevard  caption=...  layout=grid|split|strip
//   grade=sunset|neon|palm  size=1080x1080|1080x1350|1920x1080
//   panel2 / panel3 — optional second and third sample photos
// window.__shotReady is set once the scene is painted with the Anton font loaded.
export async function runShot(shot, query, state, helpers) {
  const { loadImage, redraw, setPanelPhoto } = helpers;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('caption')) {
    document.getElementById('title').value = query.get('caption');
    state.title = query.get('caption');
  }
  if (query.get('subtitle')) {
    document.getElementById('subtitle').value = query.get('subtitle');
    state.subtitle = query.get('subtitle');
  }
  const names = [query.get('photo') ?? 'pier', query.get('panel2') ?? query.get('photo') ?? 'pier', query.get('panel3') ?? query.get('photo') ?? 'pier'];
  for (let i = 0; i < 3; i++) {
    try { setPanelPhoto(i, await loadImage(`samples/${names[i]}.jpg`)); } catch { /* leave the panel empty */ }
  }
  // Vary the framing a little per panel so the poster does not look cloned,
  // and shift each photo down so faces stay in frame.
  state.panels[0].oy = 170;
  state.panels[1].zoom = 1.2;
  state.panels[1].ox = -30;
  state.panels[1].oy = 90;
  state.panels[2].zoom = 1.1;
  state.panels[2].oy = 120;
  if (query.get('size')) {
    const sizeEl = document.getElementById('size');
    if (sizeEl) sizeEl.value = query.get('size');
  }
  try { await document.fonts.load('100px Anton'); await document.fonts.ready; } catch { /* fall back to system font */ }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
