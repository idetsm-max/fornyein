// One store for the project + selection, with undo / redo. The project is never mutated: edit(fn) works on a deep copy.
import { findClip } from './model.js';
const clone = (o) => JSON.parse(JSON.stringify(o));

export function createStore(initialProject) {
  let past = [], future = [], lastKey = null, lastAt = 0;
  let state = { project: initialProject, selection: null, canUndo: false, canRedo: false };
  const subs = new Set(); const emit = () => subs.forEach((f) => f());
  const set = (patch) => { state = { ...state, ...patch, canUndo: past.length > 0, canRedo: future.length > 0 }; if (state.selection && !findClip(state.project, state.selection)) state = { ...state, selection: null }; emit(); };
  return {
    get: () => state,
    subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
    // fn(draft) edits a copy of the project. Edits with the same `key` within 0.9 s (a slider drag, typing) become ONE undo step.
    edit(fn, { key = null } = {}) {
      const draft = clone(state.project); fn(draft);
      const now = performance.now();
      if (!(key && key === lastKey && now - lastAt < 900)) { past.push(state.project); if (past.length > 200) past.shift(); }
      lastKey = key; lastAt = now; future = [];
      set({ project: draft });
    },
    undo() { if (!past.length) return; future.push(state.project); const p = past.pop(); lastKey = null; set({ project: p }); },
    redo() { if (!future.length) return; past.push(state.project); const p = future.pop(); lastKey = null; set({ project: p }); },
    select(id) { set({ selection: id }); },
    load(project) { past = []; future = []; lastKey = null; set({ project, selection: null }); },
  };
}
