// Workspace layout: resizable splitters, collapsible panels and localStorage.
import { html, useEffect, useState } from './deps.js';
import { IconBtn, cx } from './widgets.js';

export const KEY = 'fn.layout.v1';
const LEGACY_KEY = 'fn.layout';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const vh = () => (typeof window === 'undefined' ? 900 : window.innerHeight);
const mainHeight = () => vh() - 102;
export const tlMax = () => Math.max(200, Math.min(Math.round(mainHeight() * .6), mainHeight() - 368));
export const defaultTl = () => Math.round(clamp(vh() * .34, 236, 320));

export const defaults = () => ({ left: 330, insp: 330, tl: defaultTl(), leftHidden: false, inspHidden: false, tlHidden: false });
export const DEFAULT_LAYOUT = { left: 330, insp: 330, tl: 300, leftHidden: false, inspHidden: false, tlHidden: false };

export function loadLayout() {
  const base = defaults();
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || 'null') || JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
  } catch { raw = null; }
  if (!raw || typeof raw !== 'object') return base;
  return {
    left: clamp(Number(raw.left) || base.left, 240, 480),
    insp: clamp(Number(raw.insp) || base.insp, 280, 420),
    tl: clamp(Number(raw.tl) || base.tl, 200, tlMax()),
    leftHidden: !!raw.leftHidden,
    inspHidden: !!raw.inspHidden,
    tlHidden: !!raw.tlHidden,
  };
}

export function useLayout() {
  const [layout, setLayout] = useState(loadLayout);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch { /* private mode */ } }, [layout]);
  useEffect(() => {
    const onResize = () => setLayout((l) => ({ ...l, tl: clamp(l.tl, 200, tlMax()) }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return [layout, setLayout];
}

export const resetLayout = (setLayout) => setLayout(defaults());

export const SNAP = 12;
export const snapToDefault = (kind, value) => {
  const target = defaults()[kind];
  return Math.abs(value - target) <= SNAP ? target : value;
};

export function resizeTo(layout, kind, value) {
  if (kind === 'left') return { ...layout, left: snapToDefault('left', clamp(value, 240, 480)) };
  if (kind === 'insp') return { ...layout, insp: snapToDefault('insp', clamp(value, 280, 420)) };
  return { ...layout, tl: snapToDefault('tl', clamp(value, 200, tlMax())) };
}

export function nudgeLayout(layout, kind, d) {
  return resizeTo(layout, kind, (layout[kind] || 0) + d);
}

export function mainProps(layout) {
  return {
    class: ['main', layout.leftHidden && 'no-left', layout.inspHidden && 'no-insp', layout.tlHidden && 'no-tl'].filter(Boolean).join(' '),
    style: { '--left-w': layout.left + 'px', '--insp-w': layout.insp + 'px', '--tl-h': layout.tl + 'px' },
  };
}

const HIDDEN = { left: 'leftHidden', insp: 'inspHidden', tl: 'tlHidden' };

export function LayoutToggles({ layout, setLayout }) {
  const toggle = (key) => () => setLayout({ ...layout, [key]: !layout[key] });
  return html`<span class="vsep"></span>
    <${IconBtn} name="panelLeft" title="Show / hide media panel" active=${!layout.leftHidden} onClick=${toggle('leftHidden')} />
    <${IconBtn} name="panelBottom" title="Show / hide timeline" active=${!layout.tlHidden} onClick=${toggle('tlHidden')} />
    <${IconBtn} name="panelRight" title="Show / hide inspector" active=${!layout.inspHidden} onClick=${toggle('inspHidden')} />
    <${IconBtn} name="reset" title="Reset layout" onClick=${() => resetLayout(setLayout)} />`;
}

// A narrow strip with a chevron stays where a collapsed panel was, so the
// panel can be reopened without hunting for the toolbar toggle.
export function CollapsedHandles({ layout, setLayout }) {
  const open = (kind) => () => setLayout((l) => ({ ...l, [HIDDEN[kind]]: false }));
  const handle = (kind, side) => {
    const name = kind === 'left' ? 'media' : 'inspector';
    return html`<button type="button" class=${cx('edgehandle', side)} title=${`Show ${name} panel`}
      aria-label=${`Show ${name} panel`} onClick=${open(kind)}>
      <span aria-hidden="true">${kind === 'left' ? '›' : '‹'}</span></button>`;
  };
  return html`${layout.leftHidden && handle('left', 'left')}${layout.inspHidden && handle('insp', 'right')}`;
}

export function Splitters({ layout, setLayout }) {
  const drag = (kind) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    let frame = 0, last = null;
    const value = (ev) => (kind === 'left' ? ev.clientX - 94 : kind === 'insp' ? window.innerWidth - ev.clientX - 8 : window.innerHeight - 46 - ev.clientY - 8);
    const apply = () => { frame = 0; if (last) setLayout((l) => resizeTo(l, kind, value(last))); };
    const move = (ev) => { last = ev; if (!frame) frame = requestAnimationFrame(apply); };
    const up = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const one = (kind) => {
    const cls = 'splitter ' + (kind === 'tl' ? 'h' : 'v ' + (kind === 'left' ? 'left' : 'right'));
    const reset = () => setLayout((l) => ({ ...l, [kind]: defaults()[kind] }));
    const collapse = () => setLayout((l) => ({ ...l, [HIDDEN[kind]]: !l[HIDDEN[kind]] }));
    const onKeyDown = (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (dir) { e.preventDefault(); return setLayout((l) => nudgeLayout(l, kind, dir * (e.shiftKey ? 64 : 16))); }
      if (e.key === 'Home') { e.preventDefault(); return reset(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); return collapse(); }
    };
    return html`<div class=${cls} role="separator" tabindex="0"
      aria-orientation=${kind === 'tl' ? 'horizontal' : 'vertical'}
      aria-valuenow=${layout[kind]}
      aria-valuemin=${kind === 'left' ? 240 : kind === 'insp' ? 280 : 200}
      aria-valuemax=${kind === 'left' ? 480 : kind === 'insp' ? 420 : tlMax()}
      title="Drag to resize · double-click to reset · Enter to collapse"
      onPointerDown=${drag(kind)} onDblClick=${reset} onKeyDown=${onKeyDown}>
      <button type="button" class="chev" tabindex="-1" aria-label="Collapse panel"
        onPointerDown=${(e) => e.stopPropagation()} onClick=${collapse}>${kind === 'left' ? '‹' : kind === 'insp' ? '›' : '⌄'}</button>
    </div>`;
  };
  return html`${!layout.leftHidden && one('left')}${!layout.inspHidden && one('insp')}${!layout.tlHidden && one('tl')}
    <${CollapsedHandles} layout=${layout} setLayout=${setLayout} />`;
}
