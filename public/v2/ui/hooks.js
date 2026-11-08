import { useState, useEffect, useRef } from './deps.js';
// Re-render only when the selected part of the store changes (selectors must return stable references).
export function useStore(store, selector = (s) => s) {
  const [, force] = useState(0), sel = useRef(selector), last = useRef(selector(store.get()));
  sel.current = selector;
  useEffect(() => store.subscribe(() => { const v = sel.current(store.get()); if (!Object.is(v, last.current)) { last.current = v; force((n) => n + 1); } }), [store]);
  const v = selector(store.get()); last.current = v; return v;
}
export function useTransport(tr) {
  const [, force] = useState(0);
  useEffect(() => tr.subscribe(() => force((n) => n + 1)), [tr]);
  return { t: tr.t, playing: tr.playing };
}
