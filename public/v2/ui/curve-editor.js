import { html, useRef, useState } from './deps.js';
import { CURVE_FIELDS, curvePoints, curvePolyline, timeFromX, valueFromY } from './curve-core.js';
import { removeKeyframeAt, setKeyframeValue } from '../engine/keyframes.js';
import { findClip } from '../engine/model.js';
import { cx } from './widgets.js';
import { T } from './locale-core.js';

const W = 250, H = 96;

export function CurveEditor({ store, clipId, clip, transport }) {
  const [field, setField] = useState('x'), svgRef = useRef(null);
  const t0 = clip.start, t1 = clip.start + Math.max(0.1, clip.dur), keys = clip.keys || [];
  const pts = curvePoints(keys, field, W, H, t0, t1);
  const edit = (fn, key) => store.edit((d) => { const f = findClip(d, clipId); if (f) fn(f.clip); }, { key: key + clipId });
  const point = (e) => { const r = svgRef.current.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  const addAt = (e) => {
    const p = point(e), t = +timeFromX(p.x, W, t0, t1).toFixed(2), v = valueFromY(p.y, field, H);
    edit((c) => setKeyframeValue(c, t, field, v), 'curve-add-');
  };
  return html`<div class="curvewrap">
    <div class="curvehead"><b>${T('Curve', 'မျဉ်းကွေး')}</b><span>${keys.length} ${T('keys', 'ကီး')}</span></div>
    <div class="curvechips">${CURVE_FIELDS.map(([key, label]) => html`<button type="button" class=${cx('chipbtn', field === key && 'on')} onClick=${() => setField(key)}>${label}</button>`)}</div>
    <svg class="curve" ref=${svgRef} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${T('Keyframe curve, click to add a key', 'ကီးဖရိမ် မျဉ်းကွေး — နှိပ်ပြီး ကီးထည့်')} onPointerDown=${addAt}>
      ${[0.25, 0.5, 0.75].map((p) => html`<line x1="0" x2=${W} y1=${(H * p).toFixed(1)} y2=${(H * p).toFixed(1)} class="cgrid" />`)}
      ${pts.length > 1 && html`<polyline class="cline" points=${curvePolyline(pts)} />`}
      ${pts.map((p, i) => html`<circle class=${cx('cpt', Math.abs(keys[i].t - transport.t) < 0.05 && 'on')} cx=${p.x.toFixed(1)} cy=${p.y.toFixed(1)} r="4"
        onPointerDown=${(e) => { e.stopPropagation(); if (e.shiftKey) edit((c) => removeKeyframeAt(c, keys[i].t), 'curve-del-'); else transport.seek(keys[i].t); }} />`)}
    </svg>
    <small class="curvehint">${T('Click to add a key, Shift+click a dot to delete', 'နှိပ် = ကီးထည့်၊ Shift+နှိပ် = ဖျက်')}</small>
  </div>`;
}
