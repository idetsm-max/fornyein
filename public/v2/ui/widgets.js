import { html } from './deps.js';
import { Icon } from './icons.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function IconBtn({ name, title, active, onClick, size = 18, disabled, cls }) {
  return html`<button type="button" class=${cx('ibtn', active && 'on', cls)} title=${title} disabled=${disabled} onClick=${onClick}><${Icon} name=${name} size=${size} /></button>`;
}
export function Tabs({ tabs, value, onChange, cls }) {      // tabs = [[id, label, tooltip], ...]
  return html`<div class=${cx('tabs', cls)} role="tablist">${tabs.map(([id, label, tip]) =>
    html`<button type="button" role="tab" title=${tip || ''} class=${cx('tab', id === value && 'on')} onClick=${() => onChange(id)}>${label}</button>`)}</div>`;
}
export function Chips({ items, value, onChange }) {
  return html`<div class="chips">${items.map(([id, label, tip]) =>
    html`<button type="button" title=${tip || ''} class=${cx('chip', id === value && 'on')} onClick=${() => onChange(id)}>${label}</button>`)}</div>`;
}
export function Select({ value, options, onChange, cls, title }) {
  return html`<label class=${cx('select', cls)} title=${title || ''}>
    <select value=${value} onChange=${(e) => onChange(e.target.value)}>${options.map((o) => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return html`<option value=${v} selected=${v === value}>${t}</option>`; })}</select>
    <${Icon} name="chevron" size=${14} /></label>`;
}
export function Slider({ label, tip, value, min = 0, max = 100, step = 1, onChange, unit = '' }) {
  const p = ((value - min) / (max - min)) * 100;
  return html`<div class="frow" title=${tip || ''}>
    <span class="flabel">${label}</span>
    <input class="range" type="range" min=${min} max=${max} step=${step} value=${value} style=${{ '--p': p + '%' }} onInput=${(e) => onChange(+e.target.value)} />
    <span class="numbox"><input type="number" min=${min} max=${max} step=${step} value=${value} onInput=${(e) => onChange(+e.target.value || 0)} />${unit && html`<em>${unit}</em>`}</span>
  </div>`;
}
export function Field({ label, tip, children }) {
  return html`<div class="frow" title=${tip || ''}><span class="flabel">${label}</span><div class="fctl">${children}</div></div>`;
}
