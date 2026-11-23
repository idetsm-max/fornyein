// Pure geometry for the keyframe curve editor.
export const CURVE_FIELDS = [['x', 'X'], ['y', 'Y'], ['scale', 'Scale'], ['opacity', 'Opacity']];
export const FIELD_RANGE = { x: [0, 100], y: [0, 100], scale: [0, 4], opacity: [0, 100] };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function curvePoints(keys, field, w, h, t0, t1) {
  const [lo, hi] = FIELD_RANGE[field] || [0, 1];
  const span = Math.max(1e-6, t1 - t0);
  return keys.map((k) => ({
    x: ((k.t - t0) / span) * w,
    y: h - ((clamp(k[field], lo, hi) - lo) / (hi - lo)) * h,
    t: k.t,
    v: k[field],
  }));
}

export const timeFromX = (px, w, t0, t1) => t0 + clamp(px / Math.max(1, w), 0, 1) * (t1 - t0);

export function valueFromY(py, field, h) {
  const [lo, hi] = FIELD_RANGE[field] || [0, 1];
  return +(lo + (1 - clamp(py / Math.max(1, h), 0, 1)) * (hi - lo)).toFixed(2);
}

export function curvePolyline(points) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}
