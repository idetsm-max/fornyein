// Undo/redo stacks with coalescing and labels. The store owns the project; this
// module only remembers past/future snapshots and the label of each step.
export function createHistory() {
  let past = [], future = [], lastKey = null, lastAt = 0, currentLabel = 'Edit';
  const labels = () => ({
    undoLabel: past.length ? currentLabel : '',
    redoLabel: future.length ? future[future.length - 1].label : '',
  });
  return {
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    labels,
    record(project, key, label) {
      const now = performance.now();
      if (!(key && key === lastKey && now - lastAt < 900)) {
        past.push({ project, label: currentLabel });
        if (past.length > 200) past.shift();
        future = [];
      }
      lastKey = key; lastAt = now; currentLabel = label;
    },
    undo(project) {
      if (!past.length) return null;
      const entry = past.pop();
      future.push({ project, label: currentLabel });
      lastKey = null; currentLabel = entry.label;
      return entry.project;
    },
    redo(project) {
      if (!future.length) return null;
      const entry = future.pop();
      past.push({ project, label: currentLabel });
      lastKey = null; currentLabel = entry.label;
      return entry.project;
    },
    reset() { past = []; future = []; lastKey = null; currentLabel = 'Edit'; },
  };
}
