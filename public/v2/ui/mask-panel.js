import { html } from './deps.js';
import { Slider, cx } from './widgets.js';
import { MASK_SHAPES } from '../engine/mask.js';
import { findClip } from '../engine/model.js';
import { T } from './locale-core.js';

const LABELS = { none: 'မရှိ', rect: 'Rect', ellipse: 'Ellipse' };

export function MaskPanel({ store, clipId, clip }) {
  const mask = clip.mask || { shape: 'none', x: 50, y: 50, w: 60, h: 60 };
  const upd = (key, fn) => store.edit((d) => { const f = findClip(d, clipId); if (f) { f.clip.mask = { ...mask, ...f.clip.mask }; fn(f.clip.mask); } }, { key: key + clipId });
  return html`<div class="speedwrap">
    <div class="curvehead"><b>${T('Mask', 'မတ်စ်')}</b><span>${LABELS[mask.shape] || mask.shape}</span></div>
    <div class="curvechips">${MASK_SHAPES.map((shape) => html`<button type="button" class=${cx('chipbtn', mask.shape === shape && 'on')} onClick=${() => upd('mask-shape', (m) => { m.shape = shape; })}>${LABELS[shape]}</button>`)}</div>
    ${mask.shape !== 'none' && html`
      <${Slider} label=${T('Width', 'အကျယ်')} value=${mask.w} min=${1} max=${100} unit="%" onChange=${(v) => upd('mask-w', (m) => { m.w = +v; })} />
      <${Slider} label=${T('Height', 'အမြင့်')} value=${mask.h} min=${1} max=${100} unit="%" onChange=${(v) => upd('mask-h', (m) => { m.h = +v; })} />
      <${Slider} label=${T('Position X', 'နေရာ X')} value=${mask.x} min=${0} max=${100} unit="%" onChange=${(v) => upd('mask-x', (m) => { m.x = +v; })} />
      <${Slider} label=${T('Position Y', 'နေရာ Y')} value=${mask.y} min=${0} max=${100} unit="%" onChange=${(v) => upd('mask-y', (m) => { m.y = +v; })} />
      <label class=${cx('switchrow', mask.invert && 'on')}><input type="checkbox" checked=${!!mask.invert} onChange=${() => upd('mask-inv', (m) => { m.invert = !m.invert; })} /><span>${T('Invert mask', 'မတ်စ် ပြောင်းပြန်')}</span></label>`}
    <small class="curvehint">${T('Mask applies to the selected visual clip in preview and export.', 'မတ်စ်က ရွေးထားတဲ့ clip ကို preview/export နှစ်ခုလုံးမှာ သက်ရောက်')}</small>
  </div>`;
}
