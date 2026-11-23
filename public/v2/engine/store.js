// One store for the project + selection, with undo / redo. The project is never
// mutated: edit(fn) works on a deep copy and history.js keeps the snapshots.
import { findClip } from './model.js';
import { createHistory } from './history.js';
const clone = (o) => JSON.parse(JSON.stringify(o));
export function createStore(initialProject) {
  const history = createHistory();
  let state = { project: initialProject, selection: null, canUndo: false, canRedo: false, undoLabel: '', redoLabel: '' };
  const subs = new Set();
  const set = (patch) => {
    state = { ...state, ...patch, canUndo: history.canUndo, canRedo: history.canRedo, ...history.labels() };
    if (state.selection && !findClip(state.project, state.selection)) state = { ...state, selection: null };
    subs.forEach((f) => f());
  };
  return {
    get: () => state,
    subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
    edit(fn, { key = null, label = 'Edit' } = {}) { const draft = clone(state.project); fn(draft); history.record(state.project, key, label); set({ project: draft }); },
    undo() { const p = history.undo(state.project); if (p) set({ project: p }); },
    redo() { const p = history.redo(state.project); if (p) set({ project: p }); },
    select(id) { set({ selection: id }); },
    load(project) { history.reset(); set({ project, selection: null }); },
  };
}
