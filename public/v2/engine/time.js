// Timeline time helpers. Every edit is quantized to a frame so the model never
// carries values that a renderer cannot hit exactly.
export const FPS_DEFAULT = 30;

export function quantize(t, fps = FPS_DEFAULT) {
  const f = Number.isFinite(fps) && fps > 0 ? fps : FPS_DEFAULT;
  return Math.max(0, Math.round((Number(t) || 0) * f) / f);
}

export function toFrames(t, fps = FPS_DEFAULT) {
  return Math.round((Number(t) || 0) * (fps > 0 ? fps : FPS_DEFAULT));
}

export function fromFrames(n, fps = FPS_DEFAULT) {
  return (Number(n) || 0) / (fps > 0 ? fps : FPS_DEFAULT);
}

export const frameStep = (fps = FPS_DEFAULT) => 1 / (fps > 0 ? fps : FPS_DEFAULT);
