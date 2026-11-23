// Keyframes are snapshots of the transform at a project time; linear between them.
const EPS = 1 / 60;
const FIELDS = ['x', 'y', 'scale', 'opacity'];

export const snapshot = (clip, t) => ({
  t: +t.toFixed(3),
  x: clip.pos?.x ?? 50,
  y: clip.pos?.y ?? 50,
  scale: clip.pos?.scale ?? 1,
  opacity: clip.opacity ?? 100,
});

export function addKeyframe(clip, t, values = null) {
  const key = values ? { t: +t.toFixed(3), ...values } : snapshot(clip, t);
  const keys = (clip.keys || []).filter((k) => Math.abs(k.t - key.t) > EPS);
  clip.keys = [...keys, key].sort((a, b) => a.t - b.t);
  return clip.keys;
}

export function removeKeyframeAt(clip, t) {
  clip.keys = (clip.keys || []).filter((k) => Math.abs(k.t - t) > EPS);
  if (!clip.keys.length) delete clip.keys;
  return clip.keys || [];
}

export function clearKeyframes(clip) { delete clip.keys; }

export function sampleKeyframes(keys = [], t) {
  if (!keys.length) return null;
  if (t <= keys[0].t) return { ...keys[0] };
  const last = keys[keys.length - 1];
  if (t >= last.t) return { ...last };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const p = (t - a.t) / Math.max(1e-6, b.t - a.t), out = { t };
      for (const field of FIELDS) out[field] = a[field] + (b[field] - a[field]) * p;
      return out;
    }
  }
  return { ...last };
}

export function resolvedTransform(clip, t) {
  const base = { x: clip.pos?.x ?? 50, y: clip.pos?.y ?? 50, scale: clip.pos?.scale ?? 1, opacity: clip.opacity ?? 100 };
  const sampled = clip.keys?.length ? sampleKeyframes(clip.keys, t) : null;
  if (!sampled) return base;
  return { x: sampled.x, y: sampled.y, scale: sampled.scale, opacity: sampled.opacity };
}

export const keyframeTimes = (clip) => (clip.keys || []).map((k) => k.t);

export function setKeyframeValue(clip, t, field, value) {
  const key = (clip.keys || []).find((k) => Math.abs(k.t - t) <= EPS);
  if (key) key[field] = value;
  else addKeyframe(clip, t, { ...snapshot(clip, t), [field]: value });
  clip.keys.sort((a, b) => a.t - b.t);
  return clip.keys;
}
