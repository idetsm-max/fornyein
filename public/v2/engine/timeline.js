// T1 command layer. Every timeline edit goes through these functions so the UI,
// keyboard and tests share one set of semantics (locked checks, quantize, lane
// safety) and each command produces one undo step with a readable label.
import { clipEnd, findClip, uid } from './model.js';
import { nearestFreeStart } from './lanes.js';
import { quantize, frameStep } from './time.js';
import { clipSpeed, sourceRange, slipSource, trimSourceLeft, trimSourceRight } from './clip.js';
import { deleteClips as deleteAction } from './actions.js';

const minDur = () => frameStep();
const labelFor = (verb, n) => `${verb} ${n} clip${n === 1 ? '' : 's'}`;
const editable = (f) => !!f && !f.track.locked && !f.clip.locked;
const order = (a, b) => a.clip.start - b.clip.start;
const kindOf = (clip) => (clip.kind === 'image' ? 'video' : clip.kind === 'sticker' ? 'overlay' : clip.kind);

function setTrim(clip, side, value) {
  const end = clipEnd(clip);
  if (side === 'left') {
    const start = Math.max(0, Math.min(end - minDur(), value));
    if (clip.kind === 'text') { clip.start = start; clip.dur = +Math.max(minDur(), end - start).toFixed(6); }
    else trimSourceLeft(clip, start);
  } else {
    const next = Math.max(clip.start + minDur(), value);
    if (clip.kind === 'text') clip.dur = +Math.max(minDur(), next - clip.start).toFixed(6);
    else trimSourceRight(clip, next);
  }
}

function splitInDraft(draft, id, cut) {
  const f = findClip(draft, id);
  if (!editable(f)) return null;
  const c = f.clip;
  if (cut <= c.start + minDur() || cut >= clipEnd(c) - minDur()) return null;
  const right = JSON.parse(JSON.stringify(c));
  right.id = uid(); right.start = cut; right.dur = clipEnd(c) - cut;
  if (c.kind !== 'text' && c.src) {
    const inRight = +(sourceRange(c).in + (cut - c.start) * clipSpeed(c)).toFixed(6);
    right.src = { ...c.src, in: inRight, out: sourceRange(c).out };
    c.src = { ...c.src, out: inRight };
  }
  c.dur = cut - c.start;
  f.track.clips.splice(f.ci + 1, 0, right);
  return right.id;
}

// Remove everything inside [from, to) from one track and keep the outside parts.
function liftTrack(track, from, to) {
  const next = [];
  for (const c of track.clips) {
    if (c.locked || clipEnd(c) <= from || c.start >= to) { next.push(c); continue; }
    if (c.start < from && clipEnd(c) > to) {
      const right = JSON.parse(JSON.stringify(c));
      right.id = uid(); right.start = to; right.dur = clipEnd(c) - to;
      if (c.kind !== 'text' && c.src) {
        const inRight = +(sourceRange(c).in + (to - c.start) * clipSpeed(c)).toFixed(6);
        right.src = { ...c.src, in: inRight, out: sourceRange(c).out };
        c.src = { ...c.src, out: inRight };
      }
      setTrim(c, 'right', from);
      next.push(c, right);
    } else if (c.start < from) { setTrim(c, 'right', from); next.push(c); }
    else if (clipEnd(c) > to) { setTrim(c, 'left', to); next.push(c); }
  }
  track.clips = next;
}

function liftInDraft(draft, from, to) {
  for (const track of draft.tracks) if (!track.locked) liftTrack(track, from, to);
}

function shiftAfter(draft, from, delta) {
  for (const track of draft.tracks) {
    if (track.locked) continue;
    for (const c of track.clips) if (c.start >= from - 1e-6) c.start = Math.max(0, +(c.start + delta).toFixed(6));
  }
}

function targetTrack(draft, clip, trackKind) {
  const kind = trackKind || kindOf(clip);
  return draft.tracks.find((t) => t.kind === kind && !t.locked) || null;
}

export function moveClips(store, ids, dt, { snap = true, copy = false, toTrack = null } = {}) {
  const set = [...new Set((ids || []).filter(Boolean))];
  if (!set.length) return [];
  const made = [];
  store.edit((d) => {
    const found = set.map((id) => findClip(d, id)).filter(editable).sort(order);
    if (!copy) for (const f of found) f.track.clips.splice(f.track.clips.indexOf(f.clip), 1);
    for (const f of found) {
      const target = toTrack ? d.tracks.find((t) => t.id === toTrack) : null;
      const track = target && target.kind === f.track.kind && !target.locked ? target : f.track;
      const clip = copy ? { ...JSON.parse(JSON.stringify(f.clip)), id: uid() } : f.clip;
      const wanted = Math.max(0, snap ? quantize(clip.start + dt) : clip.start + dt);
      clip.start = nearestFreeStart(track, wanted, clip.dur);
      track.clips.push(clip);
      if (copy) made.push(clip.id);
    }
  }, { key: `move:${set.join(',')}`, label: labelFor(copy ? 'Copy' : 'Move', set.length) });
  if (made.length) store.select(made[made.length - 1]);
  return made;
}

export function trimClip(store, id, side, value, { mode = 'normal', snap = true } = {}) {
  store.edit((d) => {
    const f = findClip(d, id);
    if (!editable(f)) return;
    const c = f.clip, oldStart = c.start, oldEnd = clipEnd(c);
    const target = snap ? quantize(value) : value;
    if (mode === 'roll') {
      const prev = f.track.clips
        .filter((x) => x.id !== c.id && Math.abs(clipEnd(x) - oldStart) < 1e-3)
        .sort((a, b) => clipEnd(b) - clipEnd(a))[0];
      if (!prev) { setTrim(c, side, target); return; }
      const point = Math.max(prev.start + minDur(), Math.min(oldEnd - minDur(), target));
      setTrim(prev, 'right', point);
      setTrim(c, 'left', point);
      return;
    }
    setTrim(c, side, target);
    if (mode === 'ripple') {
      const delta = side === 'left' ? c.start - oldStart : clipEnd(c) - oldEnd;
      if (delta) for (const x of f.track.clips) if (x.id !== c.id && x.start >= oldEnd - 1e-6) x.start = Math.max(0, x.start + delta);
    }
  }, { key: `trim:${id}:${side}:${mode}`, label: 'Trim clip' });
}

export function splitClips(store, ids, at, { allTracks = false, snap = true } = {}) {
  const cut = snap ? quantize(at) : at;
  const project = store.get().project;
  const targets = allTracks
    ? project.tracks.filter((t) => !t.locked).flatMap((t) => t.clips
      .filter((c) => !c.locked && c.start < cut && clipEnd(c) > cut).map((c) => c.id))
    : (ids?.length ? ids : [project.selection]).filter(Boolean);
  const list = [...new Set(targets)].filter((id) => {
    const f = findClip(project, id);
    return editable(f) && cut > f.clip.start + minDur() && cut < clipEnd(f.clip) - minDur();
  });
  const made = [];
  store.edit((d) => { for (const id of list) { const nid = splitInDraft(d, id, cut); if (nid) made.push(nid); } },
    { key: `split:${cut}`, label: labelFor('Split', list.length) });
  if (made.length) store.select(made[made.length - 1]);
  return made;
}

export function slipClip(store, id, deltaSrc) {
  store.edit((d) => {
    const f = findClip(d, id);
    if (!editable(f) || f.clip.kind === 'text') return;
    slipSource(f.clip, deltaSrc);
  }, { key: `slip:${id}`, label: 'Slip clip' });
}

export function slideClip(store, id, dt) {
  store.edit((d) => {
    const f = findClip(d, id);
    if (!editable(f) || !dt) return;
    const c = f.clip, track = f.track;
    const prev = track.clips.filter((x) => x.id !== c.id && clipEnd(x) <= c.start + 1e-6)
      .sort((a, b) => clipEnd(b) - clipEnd(a))[0];
    const next = track.clips.filter((x) => x.id !== c.id && x.start >= clipEnd(c) - 1e-6)
      .sort((a, b) => a.start - b.start)[0];
    const newStart = Math.max(0, c.start + dt), newEnd = newStart + c.dur;
    if (dt > 0) {
      if (prev) setTrim(prev, 'right', newStart);
      if (next && newEnd > next.start) setTrim(next, 'left', newEnd);
    } else {
      if (next) setTrim(next, 'left', newEnd);
      if (prev && newStart < clipEnd(prev)) setTrim(prev, 'right', newStart);
    }
    c.start = newStart;
  }, { key: `slide:${id}`, label: 'Slide clip' });
}

export function deleteClips(store, ids, { ripple = false } = {}) {
  deleteAction(store, ids, { ripple });
}

export function duplicateClips(store, ids) {
  const set = [...new Set((ids || []).filter(Boolean))];
  const made = [];
  if (!set.length) return made;
  store.edit((d) => {
    for (const id of set) {
      const f = findClip(d, id);
      if (!editable(f)) continue;
      const c = { ...JSON.parse(JSON.stringify(f.clip)), id: uid() };
      c.start = nearestFreeStart(f.track, clipEnd(f.clip), c.dur);
      f.track.clips.push(c);
      made.push(c.id);
    }
  }, { key: `duplicate:${set.join(',')}`, label: labelFor('Duplicate', set.length) });
  if (made.length) store.select(made[made.length - 1]);
  return made;
}

export function lift(store, from, to) {
  store.edit((d) => liftInDraft(d, Math.min(from, to), Math.max(from, to)),
    { key: `lift:${from}:${to}`, label: 'Lift range' });
}

export function extract(store, from, to) {
  const a = Math.min(from, to), b = Math.max(from, to);
  store.edit((d) => { liftInDraft(d, a, b); shiftAfter(d, b, -(b - a)); },
    { key: `extract:${a}:${b}`, label: 'Extract range' });
}

export function deleteRange(store, from, to, { ripple = false } = {}) {
  if (ripple) extract(store, from, to); else lift(store, from, to);
}

export const deleteLeft = (store, t) => deleteRange(store, 0, t, { ripple: true });
export const deleteRight = (store, t) => deleteRange(store, t, Number.POSITIVE_INFINITY, { ripple: true });

export function insertAt(store, clip, at, { trackKind = null } = {}) {
  const copy = { ...JSON.parse(JSON.stringify(clip)), id: clip.id || uid(), start: Math.max(0, at) };
  store.edit((d) => {
    const track = targetTrack(d, copy, trackKind);
    if (!track) return;
    for (const c of [...track.clips]) {
      if (!c.locked && c.start < copy.start && clipEnd(c) > copy.start) splitInDraft(d, c.id, copy.start);
    }
    for (const x of track.clips) if (x.start >= copy.start - 1e-6) x.start = +(x.start + copy.dur).toFixed(6);
    track.clips.push(copy);
  }, { key: `insert:${copy.id}`, label: 'Insert clip' });
  return copy.id;
}

export function overwriteAt(store, clip, at, { trackKind = null } = {}) {
  const copy = { ...JSON.parse(JSON.stringify(clip)), id: clip.id || uid(), start: Math.max(0, at) };
  store.edit((d) => {
    const track = targetTrack(d, copy, trackKind);
    if (!track) return;
    liftTrack(track, copy.start, copy.start + copy.dur);
    track.clips.push(copy);
  }, { key: `overwrite:${copy.id}`, label: 'Overwrite clip' });
  return copy.id;
}

export function setClipProp(store, id, path, value, { label = 'Change property' } = {}) {
  const keys = Array.isArray(path) ? path : String(path).split('.');
  const current = findClip(store.get().project, id)?.clip;
  let node = current;
  for (const key of keys) node = node?.[key];
  if (Object.is(node, value)) return false;
  store.edit((d) => {
    const f = findClip(d, id);
    if (!editable(f)) return;
    let target = f.clip;
    for (const key of keys.slice(0, -1)) { target[key] ||= {}; target = target[key]; }
    target[keys[keys.length - 1]] = value;
  }, { key: `prop:${id}:${keys.join('.')}`, label });
  return true;
}
