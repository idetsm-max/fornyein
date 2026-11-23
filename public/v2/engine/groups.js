// Link groups: clips that move and delete together (voice <-> caption, etc.).
import { findClip, uid } from './model.js';

export function linkClips(store, ids) {
  const set = [...new Set((ids || []).filter(Boolean))];
  if (set.length < 2) return null;
  const link = uid();
  store.edit((d) => {
    for (const id of set) { const f = findClip(d, id); if (f && !f.clip.locked) f.clip.link = link; }
  }, { key: `link:${link}`, label: `Link ${set.length} clips` });
  return link;
}

export function unlinkClips(store, ids) {
  const set = new Set((ids || []).filter(Boolean));
  if (!set.size) return;
  store.edit((d) => {
    for (const t of d.tracks) for (const c of t.clips) if (set.has(c.id)) delete c.link;
  }, { key: `unlink:${[...set].join(',')}`, label: 'Unlink clips' });
}

export function linkedIds(project, ids) {
  const set = new Set((ids || []).filter(Boolean));
  const links = new Set([...set].map((id) => findClip(project, id)?.clip.link).filter(Boolean));
  if (!links.size) return [...set];
  for (const t of project.tracks) for (const c of t.clips) if (c.link && links.has(c.link)) set.add(c.id);
  return [...set];
}
