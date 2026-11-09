export const DEFAULT_ADJUST = { brightness: 0, contrast: 0, saturation: 0, blur: 0, fade: 0 };
export function normalizeAdjust(value = {}) { return { ...DEFAULT_ADJUST, ...value }; }
export function filterString(value = {}) { const a = normalizeAdjust(value); const filters = []; if (a.brightness) filters.push(`brightness(${100 + a.brightness}%)`); if (a.contrast) filters.push(`contrast(${100 + a.contrast}%)`); if (a.saturation) filters.push(`saturate(${100 + a.saturation}%)`); if (a.blur) filters.push(`blur(${a.blur}px)`); return filters.join(' ') || 'none'; }
export function applyAdjust(ctx, value) { ctx.filter = filterString(value); return ctx; }
export function transitionState(clip, t) { const tr = clip.transition || {}, d = Math.max(.01, tr.dur || .35), local = t - clip.start, remain = clip.start + clip.dur - t; return { inProgress: Math.max(0, Math.min(1, local / d)), outProgress: Math.max(0, Math.min(1, remain / d)), inType: tr.in || 'none', outType: tr.out || 'none' }; }
