// Clip masks are geometry only, so preview and export share the same shape math.
export const MASK_SHAPES = ['none', 'rect', 'ellipse'];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function maskBox(mask = {}, cw = 1920, ch = 1080) {
  const w = clamp(Number(mask.w ?? 60), 1, 100) / 100 * cw;
  const h = clamp(Number(mask.h ?? 60), 1, 100) / 100 * ch;
  const cx = clamp(Number(mask.x ?? 50), -50, 150) / 100 * cw;
  const cy = clamp(Number(mask.y ?? 50), -50, 150) / 100 * ch;
  return { cx, cy, w, h, x: cx - w / 2, y: cy - h / 2 };
}

export const maskActive = (mask) => !!mask && mask.shape !== 'none' && MASK_SHAPES.includes(mask.shape);

export function maskPath(ctx, mask, cw, ch) {
  const b = maskBox(mask, cw, ch);
  ctx.beginPath();
  if (mask.invert) ctx.rect(0, 0, cw, ch);
  if (mask.shape === 'ellipse') ctx.ellipse(b.cx, b.cy, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
  else ctx.rect(b.x, b.y, b.w, b.h);
  return b;
}

export function applyMask(ctx, mask, cw, ch) {
  if (!maskActive(mask)) return false;
  maskPath(ctx, mask, cw, ch);
  ctx.clip(mask.invert ? 'evenodd' : 'nonzero');
  return true;
}
