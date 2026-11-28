// Video/photo effect stack. An effect is a grading nudge plus, optionally, a
// painted overlay, so one clip can stack looks without touching the Adjust
// sliders. Kept separate from grading.js because overlays need canvas work.
import { DEFAULT_ADJUST, ADJUST_RANGE, normalizeAdjust } from './grading.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));

export const CLIP_EFFECTS = [
  { id: 'mono', name: 'Mono', adjust: { saturation: -100 } },
  { id: 'sepia', name: 'Sepia', adjust: { temp: 60, saturation: -30 } },
  { id: 'invert', name: 'Invert', css: (p) => `invert(${Math.round(p)}%)` },
  { id: 'vivid', name: 'Vivid', adjust: { saturation: 45, contrast: 10 } },
  { id: 'dream', name: 'Dream', adjust: { brightness: 10, saturation: 12, fade: 25 }, overlay: ['glow'] },
  { id: 'noir', name: 'Noir', adjust: { saturation: -100, contrast: 25, vignette: 40 } },
  { id: 'warm', name: 'Warm', adjust: { temp: 55 } },
  { id: 'cool', name: 'Cool', adjust: { temp: -50 } },
  { id: 'oldfilm', name: 'Old film', adjust: { temp: 40, fade: 35, vignette: 35 }, overlay: ['grain', 'scanlines'] },
  { id: 'vhs', name: 'VHS', adjust: { saturation: 25, contrast: -8 }, overlay: ['scanlines', 'grain'] },
  { id: 'glow', name: 'Glow', adjust: { brightness: 14 }, overlay: ['glow'] },
  { id: 'leak', name: 'Light leak', adjust: { temp: 25 }, overlay: ['leak'] },
  { id: 'scanlines', name: 'Scanlines', overlay: ['scanlines'] },
  { id: 'grain', name: 'Grain', overlay: ['grain'] },
  { id: 'blur', name: 'Blur', adjust: { blur: 6 } },
  { id: 'vignette', name: 'Vignette', adjust: { vignette: 60 } },
];

export const EFFECT_BY_ID = new Map(CLIP_EFFECTS.map((e) => [e.id, e]));

// Stacking sums the nudges and clamps them to the slider ranges, so three
// effects never produce a value a slider could not show.
export function effectStack(list = []) {
  const adjust = {}, css = [], overlays = [];
  for (const item of Array.isArray(list) ? list : []) {
    const def = EFFECT_BY_ID.get(item?.id);
    const pct = clamp(item?.amount ?? 100, 0, 100) / 100;
    if (!def || !pct) continue;
    for (const [key, value] of Object.entries(def.adjust || {})) adjust[key] = (adjust[key] || 0) + value * pct;
    if (def.css) css.push(def.css(pct * 100));
    for (const kind of def.overlay || []) overlays.push([kind, pct]);
  }
  return { adjust: normalizeAdjust(adjust), css: css.filter(Boolean), overlays };
}

export function hasEffects(list = []) {
  return Array.isArray(list) && list.some((e) => EFFECT_BY_ID.has(e?.id) && clamp(e.amount ?? 100, 0, 100) > 0);
}

let grainPattern = null;
function noiseTile(ctx) {
  if (!grainPattern) {
    const size = 64, cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const c2 = cv.getContext('2d'), img = c2.createImageData(size, size), seed = { s: 12345 };
    const rand = () => { seed.s = (seed.s * 1103515245 + 12345) & 0x7fffffff; return seed.s / 0x7fffffff; };
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (rand() - 0.5) * 220;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    c2.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(cv, 'repeat');
  }
  return grainPattern;
}

function radial(ctx, w, h, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${alpha.toFixed(3)})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -h / 2, w, h);
}

// Overlays paint in the clip's local space (origin = clip centre), matching
// how paintVignette is called, so rotation and scaling carry through.
export function paintEffects(ctx, w, h, overlays = [], t = 0) {
  if (!overlays.length) return;
  ctx.save();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  for (const [kind, pct] of overlays) {
    if (kind === 'glow') {
      ctx.globalCompositeOperation = 'screen';
      radial(ctx, w, h, 0, 0, Math.hypot(w, h) * 0.45, '255,246,220', 0.42 * pct);
      ctx.globalCompositeOperation = 'source-over';
    } else if (kind === 'leak') {
      ctx.globalCompositeOperation = 'screen';
      radial(ctx, w, h, -w * 0.35, -h * 0.4, Math.hypot(w, h) * 0.55, '255,140,60', 0.55 * pct);
      ctx.globalCompositeOperation = 'source-over';
    } else if (kind === 'scanlines') {
      ctx.fillStyle = `rgba(0,0,0,${(0.38 * pct).toFixed(3)})`;
      for (let y = -h / 2; y < h / 2; y += 4) ctx.fillRect(-w / 2, y, w, 2);
    } else if (kind === 'grain') {
      const pattern = noiseTile(ctx), shift = Math.floor((t * 30) % 64);
      ctx.globalAlpha = Math.min(1, 0.28 * pct);
      ctx.save();
      ctx.translate(-w / 2 - shift, -h / 2 - shift);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w + 64, h + 64);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

export function sumAdjust(base = {}, extra = {}) {
  const out = { ...DEFAULT_ADJUST };
  for (const key of Object.keys(DEFAULT_ADJUST)) {
    out[key] = clamp((Number(base[key]) || 0) + (Number(extra[key]) || 0), ADJUST_RANGE[key][0], ADJUST_RANGE[key][1]);
  }
  return out;
}
