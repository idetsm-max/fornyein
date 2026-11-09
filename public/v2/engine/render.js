// The ONE drawing function. Preview and (later) export both call drawFrame(ctx, W, H, project, t).
import { clipEnd } from './model.js';
import { revealText } from './text.js';
import { transitionState } from './visual.js';
import { loadMedia } from './storage.js';
import { filterString } from './visual.js';

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
const visualCache = new Map();
function ensureVisual(media) { if (!media || visualCache.has(media.id)) return visualCache.get(media.id); const item = { ready: false, el: null }; visualCache.set(media.id, item); loadMedia(media.id).then((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const el = media.kind === 'video' ? document.createElement('video') : new Image(); el.src = url; if (media.kind === 'video') { el.muted = true; el.playsInline = true; el.onloadeddata = () => { item.ready = true; }; } else el.onload = () => { item.ready = true; }; item.el = el; }); return item; }
function drawVisual(ctx, cw, ch, project, c, t) { const media = project.media?.[c.mediaId], item = ensureVisual(media); if (!item.ready || !item.el) return; if (c.kind === 'video') { const local = Math.max(0, Math.min(c.dur, t - c.start)); if (Math.abs(item.el.currentTime - local) > .08) item.el.currentTime = local; item.el.play?.().catch(() => {}); } const tr = transitionState(c, t), p = tr.inType === 'fade' ? tr.inProgress : tr.inType === 'slide' ? tr.inProgress : 1, q = tr.outType === 'fade' ? tr.outProgress : tr.outType === 'slide' ? tr.outProgress : 1; ctx.save(); ctx.globalAlpha = p * q; ctx.filter = filterString(media.adjust); let x = 0; if (tr.inType === 'slide') x = (1 - p) * cw; if (tr.outType === 'slide') x += (1 - q) * cw; const iw = item.el.videoWidth || item.el.naturalWidth || cw, ih = item.el.videoHeight || item.el.naturalHeight || ch, scale = c.fit === 'contain' ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih), w = iw * scale, h = ih * scale; ctx.drawImage(item.el, x + (cw - w) / 2, (ch - h) / 2, w, h); ctx.restore(); }

function drawText(ctx, cw, ch, c, t) {
  const s = c.style || {}, fs = Math.max(4, s.size * ch / 1080) * (c.pos?.scale || 1), maxW = cw * 0.86, lh = fs * 1.5;
  ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? '700 ' : '400 '}${fs}px "${s.font}", "Noto Sans Myanmar", sans-serif`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const revealProgress = c.reveal?.mode && c.reveal.mode !== 'none' ? Math.max(0, Math.min(1, (t - c.start) / Math.max(.01, c.dur) * (c.reveal.speed || 1))) : 1;
  const visibleText = revealText(c.text || ' ', revealProgress, c.reveal?.mode || 'none');
  const lines = wrapText(ctx, visibleText || ' ', maxW), widths = lines.map((l) => ctx.measureText(l).width), blockW = Math.max(...widths, 1), blockH = lines.length * lh;
  let cx = c.pos.x / 100 * cw, cy = c.pos.y / 100 * ch;
  const a = c.anim || {}, local = Math.max(0, t - c.start), remaining = c.start + c.dur - t;
  let animAlpha = 1, scale = 1;
  if (a.in === 'fade' && a.inDur > 0) animAlpha *= Math.min(1, local / a.inDur);
  if (a.in === 'slideUp') { const p = Math.min(1, local / Math.max(.01, a.inDur || .35)); cy += (1 - p) * ch * .08; animAlpha *= p; }
  if (a.in === 'zoom') { const p = Math.min(1, local / Math.max(.01, a.inDur || .35)); scale = .8 + .2 * p; animAlpha *= p; }
  if (a.out === 'fade' && a.outDur > 0) animAlpha *= Math.min(1, remaining / a.outDur);
  const tr = transitionState(c, t); if (tr.inType === 'fade') animAlpha *= tr.inProgress; if (tr.outType === 'fade') animAlpha *= tr.outProgress; if (tr.inType === 'slide') cx += (1 - tr.inProgress) * cw * .08; if (tr.outType === 'slide') cx += (1 - tr.outProgress) * cw * .08;
  if (a.loop === 'pulse') { const p = (Math.sin(local * Math.PI * 2) + 1) / 2; scale *= .98 + p * .04; }
  if (a.loop === 'float') cy += Math.sin(local * Math.PI * 2) * ch * .012;
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity / 100 * animAlpha)); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate((c.pos.rot || 0) * Math.PI / 180);
  const fx = s.effects || []; const filters = []; if (fx.includes('blur') || fx.includes('soft')) filters.push(`blur(${fx.includes('soft') ? 1 : 3}px)`); if (fx.includes('grayscale') || fx.includes('mono')) filters.push('grayscale(1)'); if (fx.includes('sepia') || fx.includes('warm')) filters.push('sepia(.7)'); if (fx.includes('invert')) filters.push('invert(1)'); if (fx.includes('contrast')) filters.push('contrast(1.35)'); if (fx.includes('bright')) filters.push('brightness(1.25)'); if (fx.includes('saturate') || fx.includes('neon')) filters.push('saturate(1.7)'); if (fx.includes('cool')) filters.push('hue-rotate(20deg)'); ctx.filter = filters.length ? filters.join(' ') : 'none';
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
      for (const c of tr.clips) if (t >= c.start && t < clipEnd(c)) { if (c.kind === 'text') drawText(ctx, cw, ch, c, t); else if (c.kind === 'video' || c.kind === 'image') drawVisual(ctx, cw, ch, project, c, t); }
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
