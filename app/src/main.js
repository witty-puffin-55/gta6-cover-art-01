// Wires the Vice Cover Maker page: photo per panel, drag to pan, zoom, layout,
// grade, caption and size, then export the cover as a PNG. A `?shot=` query sets
// up a fixed scene for a screenshot instead (see ./shots.js).
import { drawCover, panelRects, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');
const selectedLabel = document.getElementById('selected-label');

function emptyPanel() { return { img: null, zoom: 1, ox: 0, oy: 0 }; }

const state = {
  size: '1080x1080',
  layout: 'grid',
  grade: 'sunset',
  title: titleInput.value,
  subtitle: subtitleInput.value,
  panels: [emptyPanel(), emptyPanel(), emptyPanel()],
};
let selected = 0;

function redraw() {
  state.title = titleInput.value;
  state.subtitle = subtitleInput.value;
  drawCover(canvas, state);
  const panel = state.panels[selected];
  zoomInput.value = String(panel.zoom);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
  selectedLabel.textContent = `Selected panel: ${selected + 1} of 3 — click a panel in the preview, then drag it to move the photo.`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPanelPhoto(index, img) {
  state.panels[index] = { img, zoom: 1, ox: 0, oy: 0 };
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setPanelPhoto(selected, await loadImage(URL.createObjectURL(file)));
    status.textContent = `Photo added to panel ${selected + 1}.`;
  } catch { status.textContent = 'That file could not be read as a photo.'; }
  redraw();
});

document.getElementById('fill-all').addEventListener('click', () => {
  const img = state.panels[selected].img;
  if (!img) { status.textContent = 'Add a photo to the selected panel first.'; return; }
  state.panels = state.panels.map(() => ({ img, zoom: 1, ox: 0, oy: 0 }));
  status.textContent = 'One photo now fills all three panels.';
  redraw();
});

document.getElementById('clear-panel').addEventListener('click', () => {
  state.panels[selected] = emptyPanel();
  status.textContent = `Panel ${selected + 1} cleared.`;
  redraw();
});

async function loadSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.panels = state.panels.map(() => ({ img, zoom: 1, ox: 0, oy: 0 }));
    status.textContent = `Sample photo loaded into all panels.`;
    redraw();
  } catch { status.textContent = 'Sample photo failed to load.'; }
}
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));

function markActive(group, id) {
  document.querySelectorAll(group).forEach((b) => b.classList.toggle('is-active', b.id === id));
}

for (const layout of ['grid', 'split', 'strip']) {
  document.getElementById(`layout-${layout}`).addEventListener('click', () => {
    state.layout = layout;
    markActive('.layout-btn', `layout-${layout}`);
    redraw();
  });
}
for (const grade of ['sunset', 'neon', 'palm']) {
  document.getElementById(`grade-${grade}`).addEventListener('click', () => {
    state.grade = grade;
    markActive('.grade-btn', `grade-${grade}`);
    redraw();
  });
}

zoomInput.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('reset-frame').addEventListener('click', () => {
  state.panels[selected].zoom = 1;
  state.panels[selected].ox = 0;
  state.panels[selected].oy = 0;
  redraw();
});
function stepPanel(delta) {
  selected = (selected + delta + 3) % 3;
  redraw();
}
document.getElementById('prev-panel').addEventListener('click', () => stepPanel(-1));
document.getElementById('next-panel').addEventListener('click', () => stepPanel(1));

titleInput.addEventListener('input', redraw);
subtitleInput.addEventListener('input', redraw);

document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${state.size}.png (${canvas.width} × ${canvas.height}).`;
  }, 'image/png');
});

// Drag a panel's photo to pan it; a plain click selects the panel.
let drag = null;
function canvasPoint(e) {
  const box = canvas.getBoundingClientRect();
  const scale = canvas.width / box.width;
  return { x: (e.clientX - box.left) * scale, y: (e.clientY - box.top) * scale };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const { w, h } = SIZES[state.size];
  const rects = panelRects(state.layout, w, h);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (hit === -1) return;
  selected = hit;
  const panel = state.panels[hit];
  drag = { x: p.x, y: p.y, ox: panel.ox, oy: panel.oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selected];
  panel.ox = drag.ox + (p.x - drag.x);
  panel.oy = drag.oy + (p.y - drag.y);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, { loadImage, redraw, loadSample, setPanelPhoto });
} else {
  redraw();
}
