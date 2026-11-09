// The ONE drawing function. Preview and (later) export both call drawFrame(ctx, W, H, project, t).
import { clipEnd } from './model.js';

const seg = new Intl.Segmenter('my', { granularity: 'word' });
export function wrapText(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (const { segment } of seg.segment(para)) {
      if (cur && ctx.measureText(cur + segment).width > maxW) { lines.push(cur.trim()); cur = segment.trimStart(); } else cur += segment;
    }
    lines.push(cur.trim());
  }
  return lines.filter((l, i, a) => l || a.length === 1);
}

export const bboxes = new Map();   // clip id -> {cx, cy, w, h, rot, cw, ch} in canvas pixels (used by the selection box)

function drawText(ctx, cw, ch, c, t) {
  const s = c.style || {}, fs = Math.max(4, s.size * ch / 1080) * (c.pos?.scale || 1), maxW = cw * 0.86, lh = fs * 1.5;
  ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? '700 ' : '400 '}${fs}px "${s.font}", "Noto Sans Myanmar", sans-serif`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const lines = wrapText(ctx, c.text || ' ', maxW), widths = lines.map((l) => ctx.measureText(l).width), blockW = Math.max(...widths, 1), blockH = lines.length * lh;
  const cx = c.pos.x / 100 * cw, cy = c.pos.y / 100 * ch;
  const a = c.anim || {}, local = Math.max(0, t - c.start), remaining = c.start + c.dur - t;
  let animAlpha = 1, scale = 1;
  if (a.in === 'fade' && a.inDur > 0) animAlpha *= Math.min(1, local / a.inDur);
  if (a.in === 'slideUp') { const p = Math.min(1, local / Math.max(.01, a.inDur || .35)); cy += (1 - p) * ch * .08; animAlpha *= p; }
  if (a.in === 'zoom') { const p = Math.min(1, local / Math.max(.01, a.inDur || .35)); scale = .8 + .2 * p; animAlpha *= p; }
  if (a.out === 'fade' && a.outDur > 0) animAlpha *= Math.min(1, remaining / a.outDur);
  if (a.loop === 'pulse') { const p = (Math.sin(local * Math.PI * 2) + 1) / 2; scale *= .98 + p * .04; }
  if (a.loop === 'float') cy += Math.sin(local * Math.PI * 2) * ch * .012;
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity / 100 * animAlpha)); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate((c.pos.rot || 0) * Math.PI / 180);
  if (s.shadow?.on) { ctx.shadowColor = s.shadow.color || '#000'; ctx.shadowBlur = s.shadow.blur || 0; ctx.shadowOffsetX = s.shadow.x || 0; ctx.shadowOffsetY = s.shadow.y || 0; ctx.globalAlpha *= (s.shadow.opacity ?? 55) / 100; }
  if (s.glow?.on) { ctx.shadowColor = s.glow.color || s.fill; ctx.shadowBlur = s.glow.blur || 0; }
  const gradient = s.gradient ? ctx.createLinearGradient(-blockW / 2, 0, blockW / 2, 0) : null;
  if (gradient) { gradient.addColorStop(0, s.fill || '#fff'); gradient.addColorStop(1, s.fill2 || s.fill || '#fff'); }
  lines.forEach((l, i) => {
    const w = widths[i], x = s.align === 'left' ? -blockW / 2 : s.align === 'right' ? blockW / 2 - w : -w / 2, y = (i - (lines.length - 1) / 2) * lh;
    if (s.strokeOn) { ctx.lineWidth = fs / 7; ctx.strokeStyle = s.stroke; ctx.strokeText(l, x, y); }
    ctx.fillStyle = gradient || s.fill || '#fff'; ctx.fillText(l, x, y);
    if (s.underline) ctx.fillRect(x, y + fs * 0.5, w, Math.max(1, fs / 16));
  });
  ctx.restore();
  bboxes.set(c.id, { cx, cy, w: blockW + fs * 0.4, h: blockH, rot: c.pos.rot || 0, cw, ch });
}

export function drawFrame(ctx, cw, ch, project, t) {
  ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = '#0b0e14'; ctx.fillRect(0, 0, cw, ch);
  bboxes.clear();
  for (const kind of ['video', 'overlay', 'text']) {                       // bottom -> top
    for (const tr of project.tracks) {
      if (tr.kind !== kind || tr.hidden) continue;
      for (const c of tr.clips) if (t >= c.start && t < clipEnd(c) && c.kind === 'text') drawText(ctx, cw, ch, c, t);
    }
  }
}
// A text clip that is NOT playing right now still needs a selection box: measure it (same maths, nothing drawn)
export function measureText(ctx, cw, ch, c) {
  const s = c.style, fs = Math.max(4, s.size * ch / 1080) * (c.pos?.scale || 1), lh = fs * 1.5;
  ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? '700 ' : '400 '}${fs}px "${s.font}", "Noto Sans Myanmar", sans-serif`;
  const lines = wrapText(ctx, c.text || ' ', cw * 0.86), blockW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  return { cx: c.pos.x / 100 * cw, cy: c.pos.y / 100 * ch, w: blockW + fs * 0.4, h: lines.length * lh, rot: c.pos.rot || 0, cw, ch };
}
