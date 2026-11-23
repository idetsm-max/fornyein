import { html } from './deps.js';
import { Slider, cx } from './widgets.js';
import { clipSpeed, setClipSpeed, SPEED_MIN, SPEED_MAX } from '../engine/clip.js';
import { findClip } from '../engine/model.js';
import { T } from './locale-core.js';

const PRESETS = [0.25, 0.5, 1, 1.5, 2, 4];

export function SpeedPanel({ store, clipId, clip }) {
  const sp = clipSpeed(clip);
  const edit = (fn, key) => store.edit((d) => { const f = findClip(d, clipId); if (f) fn(f.clip); }, { key: key + clipId });
  const apply = (v) => edit((c) => setClipSpeed(c, v), 'speed-');
  return html`<div class="speedwrap">
    <div class="curvehead"><b>${T('Speed', 'အမြန်နှုန်း')}</b><span>${sp.toFixed(2)}×</span></div>
    <div class="curvechips">${PRESETS.map((v) => html`<button type="button" class=${cx('chipbtn', Math.abs(sp - v) < 0.01 && 'on')} onClick=${() => apply(v)}>${v}×</button>`)}</div>
    <${Slider} label=${T('Custom speed', 'အမြန်နှုန်း ရွေး')} value=${sp} min=${SPEED_MIN} max=${SPEED_MAX} step=${0.05} unit="×" onChange=${(v) => apply(+v)} />
    <label class=${cx('switchrow', clip.reverse && 'on')}><input type="checkbox" checked=${!!clip.reverse} onChange=${() => edit((c) => { c.reverse = !c.reverse; }, 'rev-')} /><span>${T('Reverse', 'ပြောင်းပြန် ဖွင့်')}</span></label>
    <small class="curvehint">${T('Timeline length follows the speed; the source slice stays the same.', 'အမြန်နှုန်း ပြောင်းရင် timeline အရှည် ပြောင်း၊ source ဖြတ်ချက် မပြောင်း')}</small>
  </div>`;
}
