// Colour grading primitives for photos and video. Kept apart from visual.js
// (the transition façade) so the shared preview/export path stays small.
export const DEFAULT_ADJUST = {
  brightness: 0, contrast: 0, saturation: 0, blur: 0, fade: 0, temp: 0, tint: 0, vignette: 0,
};
export const ADJUST_RANGE = {
  brightness: [-100, 100], contrast: [-100, 100], saturation: [-100, 100], blur: [0, 20],
  fade: [0, 100], temp: [-100, 100], tint: [-100, 100], vignette: [0, 100],
};
export const ADJUST_LABELS = [
  ['brightness', 'Brightness'], ['contrast', 'Contrast'], ['saturation', 'Saturation'],
  ['temp', 'Temperature'], ['tint', 'Tint'], ['fade', 'Fade'], ['vignette', 'Vignette'], ['blur', 'Blur'],
];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function normalizeAdjust(value = {}) {
  const out = { ...DEFAULT_ADJUST };
  for (const key of Object.keys(DEFAULT_ADJUST)) {
    const [lo, hi] = ADJUST_RANGE[key];
    const n = Number(value[key]);
    out[key] = Number.isFinite(n) ? clamp(n, lo, hi) : 0;
  }
  return out;
}

// A filter preset carries an intensity so the same look can be dialled down
// without re-editing every slider.
export function scaleAdjust(value, intensity = 100) {
  const a = normalizeAdjust(value), pct = clamp(Number(intensity) || 0, 0, 100) / 100;
  if (pct >= 1) return a;
  const out = { ...a };
  for (const key of Object.keys(out)) out[key] = Math.round(out[key] * pct * 100) / 100;
  return out;
}

// Temperature and tint ride on sepia/hue-rotate because CSS filters have no
// colour-balance primitive; the result is monotonic, which is what the sliders
// promise.
export function filterString(value = {}) {
  const a = normalizeAdjust(value), filters = [];
  if (a.brightness) filters.push(`brightness(${100 + a.brightness}%)`);
  if (a.contrast) filters.push(`contrast(${100 + a.contrast}%)`);
  if (a.saturation) filters.push(`saturate(${100 + a.saturation}%)`);
  if (a.fade) filters.push(`contrast(${Math.max(0, 100 - a.fade * .5)}%)`);
  if (a.temp > 0) filters.push(`sepia(${a.temp * .6}%)`);
  if (a.temp) filters.push(`hue-rotate(${a.temp * .12}deg)`);
  if (a.tint) filters.push(`hue-rotate(${a.tint * .3}deg)`);
  if (a.blur) filters.push(`blur(${a.blur}px)`);
  return filters.join(' ') || 'none';
}

// Vignette is painted on top of the frame instead of in the filter string, so
// it has to be shared explicitly between the preview and the exporter.
export function paintVignette(ctx, w, h, value = 0) {
  const amount = normalizeAdjust({ vignette: value }).vignette / 100;
  if (!amount) return;
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(0, 0, r * .45, 0, 0, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${(amount * .75).toFixed(3)})`);
  ctx.save();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

export function applyAdjust(ctx, value) { ctx.filter = filterString(value); return ctx; }
