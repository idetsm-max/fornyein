// Façade used by the renderer: transitions plus the colour grading helpers.
export { DEFAULT_ADJUST, ADJUST_RANGE, ADJUST_LABELS, normalizeAdjust, filterString, paintVignette, scaleAdjust, applyAdjust } from './grading.js';
export function transitionState(clip, t) { const tr = clip.transition || {}, d = Math.max(.01, tr.dur || .35), local = t - clip.start, remain = clip.start + clip.dur - t; return { inProgress: Math.max(0, Math.min(1, local / d)), outProgress: Math.max(0, Math.min(1, remain / d)), inType: tr.in || 'none', outType: tr.out || 'none' }; }
export { transitionFx, TRANSITION_TYPES, TRANSITION_NAMES } from './transitions.js';
