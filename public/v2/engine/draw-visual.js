// Visual (photo/video) drawing for drawFrame: media cache, per-clip grading and
// the transition transform. Split out of render.js to keep that file small.
import { transitionState, filterString, paintVignette } from './visual.js';
import { transitionFx } from './transitions.js';
import { applyMask } from './mask.js';
import { clipMediaId, srcTime } from './clip.js';
import { loadMedia } from './storage.js';

const visualCache = new Map();
function loadVisual(media, item) {
  loadMedia(media.id).then((blob) => {
    if (!blob) return;
    item.url = URL.createObjectURL(blob);
    const el = media.kind === 'video' ? document.createElement('video') : new Image();
    el.src = item.url;
    if (media.kind === 'video') { el.muted = true; el.playsInline = true; el.onloadeddata = () => { item.ready = true; }; }
    else el.onload = () => { item.ready = true; };
    item.el = el;
  }).catch(() => { item.failed = true; });
  return item;
}

export function ensureVisual(media) {
  if (!media) return undefined;
  if (visualCache.has(media.id)) return visualCache.get(media.id);
  const item = { ready: false, el: null, url: '', lastUsed: performance.now() };
  visualCache.set(media.id, item);
  return loadVisual(media, item);
}

export function clearVisualCache({ keep = [] } = {}) {
  const retain = new Set(keep);
  for (const [id, item] of visualCache) {
    if (retain.has(id)) continue;
    item.el?.pause?.();
    if (item.url) URL.revokeObjectURL(item.url);
    visualCache.delete(id);
  }
}
export const visualCacheStats = () => ({
  entries: visualCache.size, ready: [...visualCache.values()].filter((x) => x.ready).length,
});

export function drawVisual(ctx, cw, ch, project, c, t) {
  const media = project.media?.[clipMediaId(c)], item = ensureVisual(media);
  if (!item) return;
  item.lastUsed = performance.now();
  if (!item.ready || !item.el) return;
  if (c.kind === 'video') {
    const local = srcTime(c, t);
    if (Math.abs(item.el.currentTime - local) > .08) item.el.currentTime = local;
    if (!c.reverse) item.el.play?.().catch(() => {});
  }
  const adjust = c.adjust || media.adjust || {};
  const fx = transitionFx(transitionState(c, t), cw, ch), base = filterString(adjust);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (c.opacity ?? 100) / 100 * fx.alpha));
  ctx.filter = [base === 'none' ? '' : base, fx.blur ? `blur(${fx.blur}px)` : ''].filter(Boolean).join(' ') || 'none';
  if (fx.wipe < 1) { ctx.beginPath(); ctx.rect(0, 0, cw * fx.wipe, ch); ctx.clip(); }
  applyMask(ctx, c.mask, cw, ch);
  const iw = item.el.videoWidth || item.el.naturalWidth || cw, ih = item.el.videoHeight || item.el.naturalHeight || ch;
  const fitBase = c.fit === 'contain' ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
  const scale = fitBase * (c.pos?.scale || 1) * fx.scale, w = iw * scale, h = ih * scale;
  const px = (c.pos ? c.pos.x / 100 * cw : cw / 2) + fx.dx;
  const py = (c.pos ? c.pos.y / 100 * ch : ch / 2) + fx.dy;
  const turns = fx.rot || 0;
  if (turns || adjust.vignette) {
    ctx.translate(px, py);
    if (turns) ctx.rotate(turns * Math.PI / 180);
    ctx.drawImage(item.el, -w / 2, -h / 2, w, h);
    paintVignette(ctx, w, h, adjust.vignette);
  } else ctx.drawImage(item.el, px - w / 2, py - h / 2, w, h);
  ctx.restore();
}
