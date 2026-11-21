// Vice Cover Maker — cover engine (pure canvas drawing, no DOM).
// Turns photos + a caption into a multi-panel GTA-style poster:
// three layouts, three sunset/neon grades, bold Anton lettering.
//
// A "state" looks like:
//   { layout: 'grid' | 'split' | 'strip',
//     grade: 'sunset' | 'neon' | 'palm',
//     title: 'SUNSET HEIST', subtitle: 'A VICE CITY STORY',
//     panels: [ { img, zoom, panX, panY }, ... x3 ] }
// panX/panY shift the crop in [-0.5, 0.5]; zoom scales the photo 1..3.
// Every panel rect is derived from the layout, so the poster is
// resolution-independent: the same state renders at 1080x1080,
// 1080x1350 or 1920x1080.

export const LAYOUTS = {
  grid: {
    label: 'Hero grid',
    hint: 'One big hero panel over two small ones',
    rects(w, h) {
      const gap = Math.round(Math.min(w, h) * 0.006);
      const heroH = Math.round(h * 0.60);
      return [
        { x: 0, y: 0, w, h: heroH },
        { x: 0, y: heroH + gap, w: Math.floor((w - gap) / 2), h: h - heroH - gap },
        { x: Math.floor((w - gap) / 2) + gap, y: heroH + gap, w: Math.ceil((w - gap) / 2), h: h - heroH - gap },
      ];
    },
  },
  split: {
    label: 'Big left split',
    hint: 'One tall panel left, two stacked right',
    rects(w, h) {
      const gap = Math.round(Math.min(w, h) * 0.006);
      const leftW = Math.round(w * 0.58);
      return [
        { x: 0, y: 0, w: leftW, h },
        { x: leftW + gap, y: 0, w: w - leftW - gap, h: Math.floor((h - gap) / 2) },
        { x: leftW + gap, y: Math.floor((h - gap) / 2) + gap, w: w - leftW - gap, h: Math.ceil((h - gap) / 2) },
      ];
    },
  },
  strip: {
    label: 'Three strips',
    hint: 'Three equal vertical panels',
    rects(w, h) {
      const gap = Math.round(Math.min(w, h) * 0.006);
      const colW = Math.floor((w - gap * 2) / 3);
      return [
        { x: 0, y: 0, w: colW, h },
        { x: colW + gap, y: 0, w: colW, h },
        { x: (colW + gap) * 2, y: 0, w: w - (colW + gap) * 2, h },
      ];
    },
  },
};

// Each grade is a pair of gradient stops plus a wash colour. The
// gradient is painted over the photo with 'overlay' so the photo's
// own light survives, then a soft wash tints the shadows.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    stops: ['#ffd166', '#ff7b39', '#e5484d'],
    wash: 'rgba(255, 90, 40, 0.16)',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon night',
    stops: ['#ff2ea6', '#7c3aed', '#22d3ee'],
    wash: 'rgba(255, 46, 166, 0.14)',
    accent: '#67e8f9',
  },
  palm: {
    label: 'Palm gold',
    stops: ['#fde68a', '#34d399', '#0f766e'],
    wash: 'rgba(16, 185, 129, 0.12)',
    accent: '#fde68a',
  },
};

export function panelRects(layout, w, h) {
  const def = LAYOUTS[layout] ?? LAYOUTS.grid;
  return def.rects(w, h);
}

// Draw one photo into a rect, cover-fit, with the panel's pan/zoom.
function drawPhoto(ctx, img, rect, panel) {
  if (!img) {
    // Empty panel: flat dusk gradient so the poster never has a hole.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#2b2b3d');
    g.addColorStop(1, '#12121c');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const zoom = panel?.zoom ?? 1;
  const panX = panel?.panX ?? 0;
  const panY = panel?.panY ?? 0;
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = rect.x + (rect.w - dw) / 2 + panX * rect.w * 0.4;
  const dy = rect.y + (rect.h - dh) / 2 + panY * rect.h * 0.4;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function paintGrade(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.25, rect.y + rect.h);
  g.addColorStop(0, grade.stops[0]);
  g.addColorStop(0.55, grade.stops[1]);
  g.addColorStop(1, grade.stops[2]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Gentle vignette so panels read as one poster, not three photos.
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// The title block sits on a scrim at the poster's foot so the
// lettering stays readable over any photo.
function drawTitleBlock(ctx, w, h, state, grade) {
  const bandH = Math.round(h * 0.17);
  const y0 = h - bandH;
  const scrim = ctx.createLinearGradient(0, y0 - bandH * 0.5, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, y0 - bandH * 0.5, w, bandH * 1.5);

  const title = (state.title || 'UNTITLED').toUpperCase();
  const pad = Math.round(w * 0.045);
  // Fit the title: shrink until it fits the width.
  let size = Math.round(h * 0.085);
  ctx.textBaseline = 'alphabetic';
  const fit = () => {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    return ctx.measureText(title).width <= w - pad * 2;
  };
  while (size > 12 && !fit()) size -= 2;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 8, 16, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(size * 0.07));
  // Both lines sit well clear of the inner frame (drawn at h - 1.2%):
  // the title baseline is 9.5% up from the foot, the subtitle 3.8%.
  const titleY = h - Math.round(h * 0.095);
  const subY = h - Math.round(h * 0.038);
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, pad, titleY);

  const sub = (state.subtitle || '').toUpperCase();
  if (sub) {
    const subSize = Math.max(10, Math.round(h * 0.021));
    ctx.font = `700 ${subSize}px 'Arial Narrow', Arial, sans-serif`;
    ctx.fillStyle = grade.accent;
    // Manual letter spacing: draw with wide gaps between letters.
    const spaced = sub.split('').join('  ');
    ctx.fillText(spaced, pad, subY);
  }
}

// Render the whole poster onto ctx at W x H.
export function drawCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawPhoto(ctx, state.panels?.[i]?.img, rect, state.panels?.[i]);
    paintGrade(ctx, rect, grade);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.005));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  drawTitleBlock(ctx, W, H, state, grade);
  // Thin inner frame, the poster's finishing line.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
  ctx.strokeRect(
    Math.round(W * 0.012), Math.round(H * 0.012),
    W - Math.round(W * 0.024), H - Math.round(H * 0.024),
  );
}

// Which panel, if any, contains the point (x, y) in poster space.
export function panelAt(state, W, H, x, y) {
  const rects = panelRects(state.layout, W, H);
  return rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
