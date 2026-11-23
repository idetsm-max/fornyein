// Media clips point into their source file with src{mediaId,in,out}. This is the
// only place that converts between timeline time and source time.
import { frameStep } from './time.js';

const r6 = (x) => +Number(x).toFixed(6);
export const clipMediaId = (c) => c?.src?.mediaId ?? c?.mediaId ?? null;
export const clipSpeed = (c) => (Number.isFinite(c?.speed) && c.speed > 0 ? c.speed : 1);

export function sourceRange(clip) {
  const start = Math.max(0, Number(clip?.src?.in) || 0);
  const fallback = start + (Number(clip?.dur) || 0) * clipSpeed(clip);
  const out = Number(clip?.src?.out);
  return { in: start, out: Number.isFinite(out) && out > start ? out : fallback };
}

export function srcTime(clip, t) {
  const { in: tin, out: tout } = sourceRange(clip);
  const local = Math.max(0, (t - clip.start) * clipSpeed(clip));
  return clip.reverse ? Math.max(tin, tout - local) : Math.min(tout, tin + local);
}

export const SPEED_MIN = 0.25, SPEED_MAX = 4;

// Changing speed keeps the same slice of the source; only timeline length changes.
export function setClipSpeed(clip, speed) {
  const next = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Number(speed) || 1));
  const { in: tin, out: tout } = sourceRange(clip);
  clip.speed = r6(next);
  clip.dur = r6(Math.max(frameStep(), (tout - tin) / next));
  return clip;
}

export function srcDuration(clip) {
  const { in: tin, out: tout } = sourceRange(clip);
  return Math.max(0, tout - tin);
}

export function clipRangeValid(clip, mediaDur) {
  const { in: tin, out: tout } = sourceRange(clip);
  if (!(tin >= 0) || !(tout > tin)) return false;
  return !Number.isFinite(mediaDur) || (tin < mediaDur && tout <= mediaDur + 1e-6);
}

// Trim from the left: the part of the file that is cut away is remembered in src.in.
export function trimSourceLeft(clip, newStart) {
  const delta = newStart - clip.start;
  const { in: tin, out: tout } = sourceRange(clip);
  const nextIn = r6(Math.max(0, Math.min(tout - frameStep(), tin + delta * clipSpeed(clip))));
  clip.start = r6(Math.max(0, newStart));
  clip.src = { ...(clip.src || {}), in: nextIn, out: r6(tout) };
  clip.dur = r6(Math.max(frameStep(), (tout - nextIn) / clipSpeed(clip)));
  return clip;
}

export function trimSourceRight(clip, newEnd) {
  const { in: tin } = sourceRange(clip);
  clip.dur = r6(Math.max(frameStep(), newEnd - clip.start));
  clip.src = { ...(clip.src || {}), in: r6(tin), out: r6(tin + clip.dur * clipSpeed(clip)) };
  return clip;
}

export function slipSource(clip, deltaSrc) {
  const { in: tin, out: tout } = sourceRange(clip);
  const nextIn = r6(Math.max(0, tin + deltaSrc));
  clip.src = { ...(clip.src || {}), in: nextIn, out: r6(nextIn + (tout - tin)) };
  return clip;
}
