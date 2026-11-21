// app.js — wires the Vice Cover Maker page: one photo per panel, drag to pan,
// zoom, layout, grade, caption and size, then export the cover as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { paintPoster, layoutPanels, POST_SIZES } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const zoomEl = document.getElementById('zoom');
const zoomReadout = document.getElementById('zoom-value');
const pickedEl = document.getElementById('picked-label');

function blankPanel() {
  return { image: null, scale: 1, dx: 0, dy: 0 };
}

const poster = {
  size: '1080x1080',
  layout: 'grid',
  grade: 'sunset',
  title: titleEl.value,
  subtitle: subtitleEl.value,
  panels: [blankPanel(), blankPanel(), blankPanel()],
};
let picked = 0;

function refresh() {
  poster.title = titleEl.value;
  poster.subtitle = subtitleEl.value;
  paintPoster(canvas, poster);
  const panel = poster.panels[picked];
  zoomEl.value = String(panel.scale);
  zoomReadout.textContent = `${panel.scale.toFixed(2)}×`;
  pickedEl.textContent = `Selected panel: ${picked + 1} of 3 — click a panel in the preview, then drag it to move the photo.`;
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

function putPhoto(index, img) {
  poster.panels[index] = { image: img, scale: 1, dx: 0, dy: 0 };
}

document.getElementById('photo').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    putPhoto(picked, await loadImage(URL.createObjectURL(file)));
    statusEl.textContent = `Photo added to panel ${picked + 1}.`;
  } catch {
    statusEl.textContent = 'That file could not be read as a photo.';
  }
  refresh();
});

document.getElementById('fill-all').addEventListener('click', () => {
  const img = poster.panels[picked].image;
  if (!img) {
    statusEl.textContent = 'Add a photo to the selected panel first.';
    return;
  }
  poster.panels = poster.panels.map(() => ({ image: img, scale: 1, dx: 0, dy: 0 }));
  statusEl.textContent = 'One photo now fills all three panels.';
  refresh();
});

document.getElementById('clear-panel').addEventListener('click', () => {
  poster.panels[picked] = blankPanel();
  statusEl.textContent = `Panel ${picked + 1} cleared.`;
  refresh();
});

async function loadSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    poster.panels = poster.panels.map(() => ({ image: img, scale: 1, dx: 0, dy: 0 }));
    statusEl.textContent = 'Sample photo loaded into all panels.';
    refresh();
  } catch {
    statusEl.textContent = 'Sample photo failed to load.';
  }
}
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));

function setActive(selector, id) {
  document.querySelectorAll(selector).forEach((b) => b.classList.toggle('is-active', b.id === id));
}

for (const layout of ['grid', 'split', 'strip']) {
  document.getElementById(`layout-${layout}`).addEventListener('click', () => {
    poster.layout = layout;
    setActive('.layout-btn', `layout-${layout}`);
    refresh();
  });
}
for (const grade of ['sunset', 'neon', 'palm']) {
  document.getElementById(`grade-${grade}`).addEventListener('click', () => {
    poster.grade = grade;
    setActive('.grade-btn', `grade-${grade}`);
    refresh();
  });
}

zoomEl.addEventListener('input', () => {
  poster.panels[picked].scale = Number(zoomEl.value);
  refresh();
});
document.getElementById('reset-frame').addEventListener('click', () => {
  poster.panels[picked].scale = 1;
  poster.panels[picked].dx = 0;
  poster.panels[picked].dy = 0;
  refresh();
});
function movePicked(delta) {
  picked = (picked + delta + 3) % 3;
  refresh();
}
document.getElementById('prev-panel').addEventListener('click', () => movePicked(-1));
document.getElementById('next-panel').addEventListener('click', () => movePicked(1));

titleEl.addEventListener('input', refresh);
subtitleEl.addEventListener('input', refresh);

document.getElementById('size').addEventListener('change', (event) => {
  poster.size = event.target.value;
  refresh();
});

document.getElementById('export').addEventListener('click', () => {
  refresh();
  canvas.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${poster.size}.png`;
    a.click();
    statusEl.textContent = `Saved vice-cover-${poster.size}.png (${canvas.width} × ${canvas.height}).`;
  }, 'image/png');
});

// Drag a panel's photo to pan it; a plain click picks the panel.
let drag = null;
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  const scale = canvas.width / box.width;
  return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale };
}
canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const { w, h } = POST_SIZES[poster.size];
  const rects = layoutPanels(poster.layout, w, h);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (hit === -1) return;
  picked = hit;
  const panel = poster.panels[hit];
  drag = { x: p.x, y: p.y, dx: panel.dx, dy: panel.dy };
  canvas.setPointerCapture(event.pointerId);
  refresh();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const panel = poster.panels[picked];
  panel.dx = drag.dx + (p.x - drag.x);
  panel.dy = drag.dy + (p.y - drag.y);
  refresh();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, poster, { loadImage, refresh, loadSample, putPhoto });
} else {
  refresh();
}
