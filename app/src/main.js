// Vice Cover Maker — editor UI wiring.
// Owns the state (layout, grade, caption, three panels), the live
// preview canvas, drag-to-pan + zoom per panel, photo uploads and
// the three PNG exports. Shot mode (?shot=<name>) presets a scene
// from shots.js and renders it deterministically for screenshots.

import { drawCover, panelAt, panelRects, LAYOUTS, GRADES } from './cover.js';
import { shotFor } from './shots.js';

const SAMPLE_URLS = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

const EXPORT_SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

const state = {
  layout: 'grid',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'A Vice City story',
  panels: [
    { img: null, zoom: 1, panX: 0, panY: 0, src: 'boulevard' },
    { img: null, zoom: 1, panX: 0, panY: 0, src: 'pier' },
    { img: null, zoom: 1.15, panX: 0.1, panY: 0, src: 'boulevard' },
  ],
};

let selected = 0;
let preview = null;
let pctx = null;
let dragging = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

async function loadSample(name) {
  const url = SAMPLE_URLS[name];
  if (!url) return null;
  return loadImage(url);
}

async function loadDefaults() {
  for (let i = 0; i < state.panels.length; i++) {
    try {
      state.panels[i].img = await loadSample(state.panels[i].src);
    } catch {
      state.panels[i].img = null;
    }
  }
}

function renderPreview() {
  if (!preview) return;
  const size = 540;
  if (preview.width !== size) preview.width = size;
  if (preview.height !== size) preview.height = size;
  drawCover(pctx, size, size, state);
  // Outline the selected panel so the editor shows what is active.
  const rects = panelRects(state.layout, size, size);
  const r = rects[selected];
  if (r) {
    pctx.save();
    pctx.strokeStyle = '#ffd166';
    pctx.lineWidth = 3;
    pctx.setLineDash([10, 6]);
    pctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    pctx.restore();
  }
  const label = document.getElementById('panel-label');
  if (label) label.textContent = `Panel ${selected + 1} of 3 — drag the poster to pan, use the zoom slider to crop`;
}

function renderPosterInto(canvas, w, h) {
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  drawCover(ctx, w, h, state);
  return canvas;
}

async function exportPNG(size) {
  const canvas = document.createElement('canvas');
  renderPosterInto(canvas, size.w, size.h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('bad image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

function buildButtons(container, entries, current, onPick) {
  container.innerHTML = '';
  entries.forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (key === current ? ' active' : '');
    b.textContent = def.label;
    b.title = def.hint ?? def.label;
    b.addEventListener('click', () => {
      onPick(key);
      buildButtons(container, entries, key, onPick);
      renderPreview();
    });
    container.appendChild(b);
  });
}

function wireEditor() {
  preview = document.getElementById('preview');
  pctx = preview.getContext('2d');

  buildButtons(
    document.getElementById('layout-picks'),
    Object.entries(LAYOUTS),
    state.layout,
    (key) => { state.layout = key; },
  );
  buildButtons(
    document.getElementById('grade-picks'),
    Object.entries(GRADES),
    state.grade,
    (key) => { state.grade = key; },
  );

  const titleInput = document.getElementById('title-input');
  const subInput = document.getElementById('subtitle-input');
  titleInput.value = state.title;
  subInput.value = state.subtitle;
  titleInput.addEventListener('input', () => { state.title = titleInput.value; renderPreview(); });
  subInput.addEventListener('input', () => { state.subtitle = subInput.value; renderPreview(); });

  const zoom = document.getElementById('zoom');
  zoom.addEventListener('input', () => {
    state.panels[selected].zoom = Number(zoom.value);
    renderPreview();
  });

  // Panel photo slots: upload your own or drop back to a sample.
  document.querySelectorAll('[data-panel]').forEach((slot) => {
    const idx = Number(slot.dataset.panel);
    const fileInput = slot.querySelector('input[type=file]');
    const sampleBtn = slot.querySelector('.sample-btn');
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        state.panels[idx].img = await readFileAsImage(file);
        state.panels[idx].src = file.name;
        selected = idx;
        renderPreview();
      } catch {
        // Keep the old photo; a bad file is not worth losing the poster.
      }
    });
    sampleBtn.addEventListener('click', async () => {
      const name = idx === 1 ? 'pier' : 'boulevard';
      state.panels[idx].img = await loadSample(name);
      state.panels[idx].src = name;
      selected = idx;
      renderPreview();
    });
    slot.addEventListener('click', (ev) => {
      if (ev.target === fileInput || ev.target === sampleBtn) return;
      selected = idx;
      zoom.value = String(state.panels[idx].zoom);
      renderPreview();
    });
  });

  // Drag on the poster pans the selected panel; click picks a panel.
  preview.addEventListener('pointerdown', (ev) => {
    const rect = preview.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (preview.width / rect.width);
    const y = (ev.clientY - rect.top) * (preview.height / rect.height);
    const hit = panelAt(state, preview.width, preview.height, x, y);
    if (hit >= 0) {
      selected = hit;
      zoom.value = String(state.panels[hit].zoom);
    }
    dragging = { x, y, panX: state.panels[selected].panX, panY: state.panels[selected].panY };
    preview.setPointerCapture(ev.pointerId);
    renderPreview();
  });
  preview.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (preview.width / rect.width);
    const y = (ev.clientY - rect.top) * (preview.height / rect.height);
    const p = state.panels[selected];
    p.panX = Math.max(-0.5, Math.min(0.5, dragging.panX + (x - dragging.x) / preview.width));
    p.panY = Math.max(-0.5, Math.min(0.5, dragging.panY + (y - dragging.y) / preview.height));
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { dragging = null; });

  const exports = document.getElementById('export-buttons');
  EXPORT_SIZES.forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'export';
    b.textContent = `Export ${size.label} PNG`;
    b.addEventListener('click', () => exportPNG(size));
    exports.appendChild(b);
  });
}

async function applyShot(scene) {
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  for (let i = 0; i < 3; i++) {
    state.panels[i].src = scene.photos[i];
    state.panels[i].img = await loadSample(scene.photos[i]);
    const frame = scene.framing?.[i];
    state.panels[i].zoom = frame?.zoom ?? 1;
    state.panels[i].panX = frame?.panX ?? 0;
    state.panels[i].panY = frame?.panY ?? 0;
  }
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const shotName = params.get('shot');
  const scene = shotName ? shotFor(shotName) : null;

  // Anton must be ready before any lettering is drawn.
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch {
    // Fall back to the system sans if the vendored font fails.
  }

  if (scene && scene.kind === 'poster') {
    // Poster-only shot: the whole viewport IS the cover.
    document.body.classList.add('shot-poster');
    await applyShot(scene);
    const canvas = document.getElementById('shot-canvas');
    canvas.style.display = 'block';
    renderPosterInto(canvas, scene.width, scene.height);
    document.title = `Vice Cover Maker — ${scene.title}`;
    return;
  }

  await loadDefaults();
  if (scene) await applyShot(scene);
  wireEditor();
  renderPreview();
}

boot();
