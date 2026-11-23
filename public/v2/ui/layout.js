// Workspace layout: resizable splitters, collapsible panels and localStorage.
import { html, useEffect, useState } from './deps.js';
import { IconBtn } from './widgets.js';

export const DEFAULT_LAYOUT = { left: 330, insp: 330, tl: 300, leftHidden: false, inspHidden: false, tlHidden: false };
const KEY = 'fn.layout';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const tlMax = () => Math.round((window.innerHeight - 102) * 0.6);

export function loadLayout() {
  try { return { ...DEFAULT_LAYOUT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULT_LAYOUT }; }
}

export function useLayout() {
  const [layout, setLayout] = useState(loadLayout);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch {} }, [layout]);
  return [layout, setLayout];
}

export function nudgeLayout(layout, kind, d) {
  if (kind === 'left') return { ...layout, left: clamp(layout.left + d, 240, 480) };
  if (kind === 'insp') return { ...layout, insp: clamp(layout.insp + d, 280, 420) };
  return { ...layout, tl: clamp(layout.tl - d, 200, tlMax()) };
}

export function mainProps(layout) {
  return {
    class: ['main', layout.leftHidden && 'no-left', layout.inspHidden && 'no-insp', layout.tlHidden && 'no-tl'].filter(Boolean).join(' '),
    style: { '--left-w': layout.left + 'px', '--insp-w': layout.insp + 'px', '--tl-h': layout.tl + 'px' },
  };
}

export function LayoutToggles({ layout, setLayout }) {
  const toggle = (key) => () => setLayout({ ...layout, [key]: !layout[key] });
  return html`<span class="vsep"></span>
    <${IconBtn} name="panelLeft" title="Show / hide media panel" active=${!layout.leftHidden} onClick=${toggle('leftHidden')} />
    <${IconBtn} name="panelBottom" title="Show / hide timeline" active=${!layout.tlHidden} onClick=${toggle('tlHidden')} />
    <${IconBtn} name="panelRight" title="Show / hide inspector" active=${!layout.inspHidden} onClick=${toggle('inspHidden')} />`;
}

export function Splitters({ layout, setLayout }) {
  const drag = (kind) => (e) => {
    e.preventDefault();
    const move = (ev) => setLayout((l) => {
      if (kind === 'left') return { ...l, left: clamp(ev.clientX - 94, 240, 480) };
      if (kind === 'insp') return { ...l, insp: clamp(window.innerWidth - ev.clientX - 8, 280, 420) };
      return { ...l, tl: clamp(window.innerHeight - 46 - ev.clientY - 8, 200, tlMax()) };
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const one = (kind) => {
    const cls = 'splitter ' + (kind === 'tl' ? 'h' : 'v ' + (kind === 'left' ? 'left' : 'right'));
    const reset = () => setLayout((l) => ({ ...l, [kind]: DEFAULT_LAYOUT[kind] }));
    const onKeyDown = (e) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 8 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -8 : 0;
      if (!step) return;
      e.preventDefault();
      setLayout((l) => nudgeLayout(l, kind, step));
    };
    return html`<div class=${cls} role="separator" tabindex="0" title="Drag to resize · double-click to reset"
      onPointerDown=${drag(kind)} onDblClick=${reset} onKeyDown=${onKeyDown} />`;
  };
  return html`${!layout.leftHidden && one('left')}${!layout.inspHidden && one('insp')}${!layout.tlHidden && one('tl')}`;
}
