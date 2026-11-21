// Draws a multi-panel Vice City style cover onto a canvas.
//
// A cover is a state object:
//   { size: "1080x1080" | "1080x1350" | "1920x1080",
//     layout: "grid" | "split" | "strip",
//     grade: "sunset" | "neon" | "palm",
//     title: string, subtitle: string,
//     panels: [{ img, zoom, ox, oy }, ...] }   // three panels; img may be null
// Each panel keeps its own photo, zoom and pan offsets (ox, oy in canvas px),
// so one photo can fill every panel or three different photos can share it.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

export const GRADES = {
  sunset: { sky: ['#ff9a3d', '#ff2e88', '#7b1fa2'], tint: 'rgba(255, 94, 60, 0.28)', band: 'rgba(26, 6, 38, 0.88)', sun: '#ffd166', title: '#fff3d6' },
  neon: { sky: ['#00e5ff', '#ff2e88', '#3d0a5e'], tint: 'rgba(255, 46, 136, 0.30)', band: 'rgba(10, 4, 32, 0.90)', sun: '#00e5ff', title: '#ffffff' },
  palm: { sky: ['#ffe66d', '#ff7b54', '#0f766e'], tint: 'rgba(15, 118, 110, 0.26)', band: 'rgba(8, 32, 28, 0.88)', sun: '#ffe66d', title: '#fff8e1' },
};

/** The three panel rectangles for a layout, in canvas pixels. Gap is the white frame between panels. */
export function panelRects(layout, w, h) {
  const g = Math.round(w * 0.012);
  const titleH = Math.round(h * 0.26);
  const artH = h - titleH;
  if (layout === 'split') {
    const leftW = Math.round(w * 0.58);
    const rightW = w - leftW - g * 2;
    const halfH = Math.round((artH - g) / 2);
    return [
      { x: 0, y: 0, w: leftW, h: artH },
      { x: leftW + g, y: 0, w: rightW, h: halfH },
      { x: leftW + g, y: halfH + g, w: rightW, h: artH - halfH - g },
    ];
  }
  if (layout === 'strip') {
    const colW = Math.round((w - g * 2) / 3);
    return [
      { x: 0, y: 0, w: colW, h: artH },
      { x: colW + g, y: 0, w: colW, h: artH },
      { x: (colW + g) * 2, y: 0, w: w - (colW + g) * 2, h: artH },
    ];
  }
  // grid: one wide hero panel on top, two panels beneath it.
  const heroH = Math.round(artH * 0.62);
  const botH = artH - heroH - g;
  const halfW = Math.round((w - g) / 2);
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + g, w: halfW, h: botH },
    { x: halfW + g, y: heroH + g, w: w - halfW - g, h: botH },
  ];
}

/** Fits a photo into a panel rect, honouring the panel's zoom and pan. */
export function drawPhotoPanel(ctx, img, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sky.addColorStop(0, '#3d1450');
    sky.addColorStop(1, '#160a1e');
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.round(rect.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  } else {
    const zoom = panel.zoom || 1;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    // Pan, but never far enough to leave a gap at a panel edge.
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const cx = clamp(rect.x + (rect.w - pw) / 2 + (panel.ox || 0), rect.x + rect.w - pw, rect.x);
    const cy = clamp(rect.y + (rect.h - ph) / 2 + (panel.oy || 0), rect.y + rect.h - ph, rect.y);
    ctx.drawImage(img, cx, cy, pw, ph);
  }
  ctx.restore();
}

/** A glowing sun disc in the hero panel, clipped to it. */
export function drawSun(ctx, rect, grade) {
  const r = Math.min(rect.w, rect.h) * 0.16;
  const cx = rect.x + rect.w * 0.88;
  const cy = rect.y + rect.h * 0.20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(0.35, grade.sun + '55');
  glow.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The caption band: sunset gradient, big Anton title, small subtitle. */
export function drawCaptionBand(ctx, w, h, grade, title, subtitle) {
  const bandY = h * 0.74;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, grade.band.replace(/[\d.]+\)$/, '0)'));
  band.addColorStop(0.35, grade.band);
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, h - bandY);

  const stripe = ctx.createLinearGradient(0, 0, w, 0);
  stripe.addColorStop(0, grade.sky[0]);
  stripe.addColorStop(0.5, grade.sky[1]);
  stripe.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));

  const words = (title || '').trim().toUpperCase();
  if (words) {
    let size = h * 0.115;
    const setFont = (s) => { ctx.font = `${s}px Anton, "Arial Narrow", sans-serif`; };
    setFont(size);
    while (ctx.measureText(words).width > w * 0.92 && size > 20) { size -= 4; setFont(size); }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size * 0.07);
    ctx.strokeStyle = 'rgba(20, 4, 28, 0.9)';
    ctx.shadowColor = grade.sky[1];
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.03;
    const ty = bandY + (h - bandY) * 0.42;
    ctx.strokeText(words, w / 2, ty);
    const fill = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, grade.title);
    ctx.fillStyle = fill;
    ctx.fillText(words, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(16, h * 0.026);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* older canvas: no letter spacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd9ec';
    ctx.fillText(sub, w / 2, h - (h - bandY) * 0.16);
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }
}

/** Draws the whole cover for a state onto the canvas (resizing it to the size). */
export function drawCover(canvas, state) {
  const { w, h } = SIZES[state.size] || SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#f5eef7';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => drawPhotoPanel(ctx, state.panels[i] && state.panels[i].img, rect, state.panels[i] || {}));
  if (state.panels[0] && state.panels[0].img) drawSun(ctx, rects[0], grade);
  // Warm wash over the photo area so the panels read as one poster.
  const wash = ctx.createLinearGradient(0, 0, 0, h * 0.74);
  wash.addColorStop(0, 'rgba(255, 120, 60, 0)');
  wash.addColorStop(1, grade.tint);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h * 0.74);
  drawCaptionBand(ctx, w, h, grade, state.title, state.subtitle);
}
