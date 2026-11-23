// In/out range helpers shared by the transport and the timeline UI.
export const rangeOn = (r) => !!r.loop && r.in != null && r.out != null && r.out > r.in;

export function wrapRange(t, r) {
  if (!rangeOn(r)) return t;
  const len = r.out - r.in;
  if (t >= r.in && t < r.out) return t;
  return r.in + (((t - r.in) % len) + len) % len;
}
