// Timeline markers: named points that snap and can be navigated with M / arrows.
import { uid } from './model.js';

export function markers(project) { return (project.markers || []).slice().sort((a, b) => a.t - b.t); }

export function addMarker(store, t, label = '') {
  const id = uid();
  store.edit((d) => { d.markers ||= []; d.markers.push({ id, t: +Math.max(0, t).toFixed(3), label }); },
    { key: `marker:${id}`, label: 'Add marker' });
  return id;
}

export function removeMarker(store, id) {
  store.edit((d) => { d.markers = (d.markers || []).filter((m) => m.id !== id); },
    { key: `marker:del:${id}`, label: 'Delete marker' });
}

export function removeMarkerAt(store, t) {
  const hit = markers(store.get().project).find((m) => Math.abs(m.t - t) < 0.05);
  if (hit) removeMarker(store, hit.id);
  return hit || null;
}

export function nextMarker(project, t) { return markers(project).find((m) => m.t > t + 1e-6) || null; }
export function prevMarker(project, t) { return markers(project).reverse().find((m) => m.t < t - 1e-6) || null; }
