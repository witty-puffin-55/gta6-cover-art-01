// poster.js — paints the Vice City cover onto a canvas.
//
// A poster state looks like this:
//   {
//     size: '1080x1080' | '1080x1350' | '1920x1080',
//     layout: 'grid' | 'split' | 'strip',
//     grade: 'sunset' | 'neon' | 'palm',
//     title: string, subtitle: string,
//     panels: [ { image, scale, dx, dy }, ... ]   // three panels; image may be null
//   }
// scale is a zoom factor (1 = cover-fit) and dx/dy pan the photo in canvas
// pixels, clamped so the photo never leaves a gap at a panel edge.

export const POST_SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

export const GRADES = {
  sunset: {
    sky: ['#ff9a3d', '#ff2e88', '#7b1fa2'],
    wash: 'rgba(255, 94, 60, 0.28)',
    band: 'rgba(26, 6, 38, 0.88)',
    sun: '#ffd166',
    titleEnd: '#fff3d6',
  },
  neon: {
    sky: ['#00e5ff', '#ff2e88', '#3d0a5e'],
    wash: 'rgba(255, 46, 136, 0.30)',
    band: 'rgba(10, 4, 32, 0.90)',
    sun: '#00e5ff',
    titleEnd: '#ffffff',
  },
  palm: {
    sky: ['#ffe66d', '#ff7b54', '#0f766e'],
    wash: 'rgba(15, 118, 110, 0.26)',
    band: 'rgba(8, 32, 28, 0.88)',
    sun: '#ffe66d',
    titleEnd: '#fff8e1',
  },
};

/** Where the three panels sit for a layout. `gap` is the pale frame between them. */
export function layoutPanels(layout, w, h) {
  const gap = Math.max(8, Math.round(w * 0.012));
  const titleH = Math.round(h * 0.26);
  const artH = h - titleH;
  if (layout === 'split') {
    const leftW = Math.round(w * 0.58);
    const rightW = w - leftW - gap * 2;
    const topH = Math.round((artH - gap) / 2);
    return [
      { x: 0, y: 0, w: leftW, h: artH },
      { x: leftW + gap, y: 0, w: rightW, h: topH },
      { x: leftW + gap, y: topH + gap, w: rightW, h: artH - topH - gap },
    ];
  }
  if (layout === 'strip') {
    const colW = Math.round((w - gap * 2) / 3);
    return [
      { x: 0, y: 0, w: colW, h: artH },
      { x: colW + gap, y: 0, w: colW, h: artH },
      { x: (colW + gap) * 2, y: 0, w: w - (colW + gap) * 2, h: artH },
    ];
  }
  // grid: one wide hero panel above two half-width panels.
  const heroH = Math.round(artH * 0.62);
  const lowerH = artH - heroH - gap;
  const halfW = Math.round((w - gap) / 2);
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + gap, w: halfW, h: lowerH },
    { x: halfW + gap, y: heroH + gap, w: w - halfW - gap, h: lowerH },
  ];
}

function clamp01(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** One panel: the photo cover-fitted with its zoom and pan, or a dusk gradient. */
export function paintPanel(ctx, image, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!image) {
    const dusk = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    dusk.addColorStop(0, '#3d1450');
    dusk.addColorStop(1, '#160a1e');
    ctx.fillStyle = dusk;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `${Math.round(rect.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  } else {
    const scale = (panel.scale || 1) * Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
    const pw = image.naturalWidth * scale;
    const ph = image.naturalHeight * scale;
    const px = clamp01(rect.x + (rect.w - pw) / 2 + (panel.dx || 0), rect.x + rect.w - pw, rect.x);
    const py = clamp01(rect.y + (rect.h - ph) / 2 + (panel.dy || 0), rect.y + rect.h - ph, rect.y);
    ctx.drawImage(image, px, py, pw, ph);
  }
  ctx.restore();
}

/** A glowing sun disc in the top-right of the first panel. */
export function paintSun(ctx, rect, grade) {
  const r = Math.min(rect.w, rect.h) * 0.16;
  const cx = rect.x + rect.w * 0.88;
  const cy = rect.y + rect.h * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
  halo.addColorStop(0, grade.sun);
  halo.addColorStop(0.35, `${grade.sun}55`);
  halo.addColorStop(1, `${grade.sun}00`);
  ctx.fillStyle = halo;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fit the title to the poster width with a binary search on the font size. */
function fitTitleSize(ctx, words, w, h) {
  let lo = 20;
  let hi = h * 0.115;
  const set = (s) => { ctx.font = `${s}px Anton, "Arial Narrow", sans-serif`; };
  set(hi);
  if (ctx.measureText(words).width <= w * 0.92) return hi;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    set(mid);
    if (ctx.measureText(words).width > w * 0.92) hi = mid;
    else lo = mid;
  }
  return lo;
}

/** The bottom band: a sunset gradient, the big Anton title, the small subtitle. */
export function paintTitleBlock(ctx, w, h, grade, title, subtitle) {
  const bandY = h * 0.74;
  const bandH = h - bandY;
  const fade = ctx.createLinearGradient(0, bandY, 0, h);
  fade.addColorStop(0, grade.band.replace(/[\d.]+\)$/, '0)'));
  fade.addColorStop(0.35, grade.band);
  fade.addColorStop(1, grade.band);
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY, w, bandH);

  const stripe = ctx.createLinearGradient(0, 0, w, 0);
  stripe.addColorStop(0, grade.sky[0]);
  stripe.addColorStop(0.5, grade.sky[1]);
  stripe.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));

  const words = (title || '').trim().toUpperCase();
  if (words) {
    const size = fitTitleSize(ctx, words, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size * 0.07);
    ctx.strokeStyle = 'rgba(20, 4, 28, 0.9)';
    ctx.shadowColor = grade.sky[1];
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.03;
    const ty = bandY + bandH * 0.42;
    ctx.strokeText(words, w / 2, ty);
    const fill = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, grade.titleEnd);
    ctx.fillStyle = fill;
    ctx.fillText(words, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(16, h * 0.026);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* canvas without letterSpacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd9ec';
    ctx.fillText(sub, w / 2, h - bandH * 0.16);
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }
}

/** Paints the whole poster for a state onto the canvas, resizing it to the size. */
export function paintPoster(canvas, state) {
  const { w, h } = POST_SIZES[state.size] || POST_SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#f5eef7';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    paintPanel(ctx, panel.image || null, rect, panel);
  });
  const first = state.panels[0];
  if (first && first.image) paintSun(ctx, rects[0], grade);
  // A warm wash over the photo area, so the three panels read as one poster.
  const wash = ctx.createLinearGradient(0, 0, 0, h * 0.74);
  wash.addColorStop(0, 'rgba(255, 120, 60, 0)');
  wash.addColorStop(1, grade.wash);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h * 0.74);
  paintTitleBlock(ctx, w, h, grade, state.title, state.subtitle);
}
