import { html, useState } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { L, H } from './strings.js';

export const RATIOS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };
const tc = (s) => { const f = Math.floor((s % 1) * 30), t = Math.floor(s); return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60, f].map((n) => String(n).padStart(2, '0')).join(':'); };

// ---------------- centre: Player ----------------
export function Player({ ratio, setRatio, time, duration, playing, setPlaying }) {
  const [w, h] = RATIOS[ratio], r = w / h;
  return html`<section class="panel player">
    <div class="stagewrap">
      <div class="frame" style=${{ width: `min(100cqw, calc(100cqh * ${r}))`, aspectRatio: `${w} / ${h}` }}>
        <div class="canvasdemo">
          <div class="demotext">
            <div class="floatbar"><${IconBtn} name="text" size=${16} title="Text" /><${IconBtn} name="frame" size=${16} title="Frame" /><${IconBtn} name="copy" size=${16} title="Duplicate" /><${IconBtn} name="trash" size=${16} title="Delete" /><${IconBtn} name="more" size=${16} title="More" /></div>
            <div class="selbox"><span class="t">ကဗျာ ခေါင်းစဉ်</span>${['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((p) => html`<i class=${'h ' + p}></i>`)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="transport">
      <span class="tcode"><b>${tc(time)}</b> / ${tc(duration)}</span>
      <div class="tbtns">
        <${IconBtn} name="prev" size=${20} title="Previous" />
        <button type="button" class="playbtn" title=${playing ? 'Pause' : 'Play'} onClick=${() => setPlaying(!playing)}><${Icon} name=${playing ? 'pause' : 'play'} size=${22} /></button>
        <${IconBtn} name="next" size=${20} title="Next" />
      </div>
      <div class="tright">
        <${Select} value=${ratio} onChange=${setRatio} cls="compact" title="Aspect ratio" options=${Object.keys(RATIOS)} />
        <${IconBtn} name="maximize" size=${18} title=${L('fullscreen')} />
      </div>
    </div>
  </section>`;
}

// ---------------- bottom: Timeline (static demo of the final look) ----------------
const TRACKS = [
  { id: 't', icon: 'text', key: 'trackText', cls: 'text', clips: [{ a: 0, b: 14.6, label: 'ကဗျာ ခေါင်းစဉ်', cls: 'purple' }, { a: 15, b: 24, label: 'စာတန်း ၂', cls: 'purple' }] },
  { id: 'v', icon: 'video', key: 'trackVideo', cls: 'video', clips: [{ a: 0, b: 29, label: '', cls: 'film' }] },
  { id: 'o', icon: 'layers', key: 'trackOverlay', cls: 'overlay', clips: [{ a: 5, b: 11, label: 'Logo', cls: 'logo' }] },
  { id: 'a', icon: 'audio', key: 'trackAudio', cls: 'audio', clips: [{ a: 0, b: 30, label: 'Music.mp3', cls: 'green', wave: true }] },
];
const DUR = 30;
function Wave() {
  const n = 140; let d = '';
  for (let i = 0; i < n; i++) { const v = 0.18 + 0.78 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.113 + 1.3)) * (0.6 + 0.4 * Math.sin(i * 0.05)); const x = (i / n) * 100; d += `M${x.toFixed(2)} ${(50 - v * 46).toFixed(1)}V${(50 + v * 46).toFixed(1)}`; }
  return html`<svg class="wave" viewBox="0 0 100 100" preserveAspectRatio="none"><path d=${d} stroke="currentColor" stroke-width="0.45" fill="none" vector-effect="non-scaling-stroke" /></svg>`;
}
export function Timeline({ time }) {
  const [rows, setRows] = useState({});
  const flip = (id, k) => setRows((o) => ({ ...o, [id]: { ...o[id], [k]: !(o[id] && o[id][k]) } }));
  const marks = []; for (let s = 0; s <= DUR; s += 5) marks.push(s);
  const fmt = (s) => `00:${String(s).padStart(2, '0')}`;
  return html`<section class="panel timeline">
    <div class="tltools">
      <${IconBtn} name="undo" size=${17} title=${L('undo')} /><${IconBtn} name="redo" size=${17} title=${L('redo')} /><span class="vsep"></span>
      <${IconBtn} name="scissors" size=${17} title="Split · Ctrl+B" /><${IconBtn} name="trash" size=${17} title="Delete" /><${IconBtn} name="crop" size=${17} title="Crop" /><${IconBtn} name="split" size=${17} title="Split all" />
      <${IconBtn} name="speed" size=${17} title="Speed" /><${IconBtn} name="wave" size=${17} title="Audio" /><${IconBtn} name="magnet" size=${17} title="Snap" active=${true} /><${IconBtn} name="link" size=${17} title="Link" />
      <div class="spacer"></div>
      <${IconBtn} name="zoomOut" size=${17} title="Zoom out" /><input class="range zoomrange" type="range" min="0" max="100" value="40" style=${{ '--p': '40%' }} /><${IconBtn} name="zoomIn" size=${17} title="Zoom in" />
    </div>
    <div class="tlbody">
      <div class="tlheads"><div class="rulerhead"></div>${TRACKS.map((t) => {
        const st = rows[t.id] || {};
        return html`<div class=${cx('thead', t.cls)}><${IconBtn} name=${st.hide ? 'eyeOff' : 'eye'} size=${16} onClick=${() => flip(t.id, 'hide')} title="Show / hide" />
          <${IconBtn} name=${st.lock ? 'lock' : 'unlock'} size=${16} onClick=${() => flip(t.id, 'lock')} title="Lock" active=${!!st.lock} />
          <span class="tname" title=${H(t.key)}><${Icon} name=${t.icon} size=${15} /><span>${L(t.key)}</span></span></div>`;
      })}</div>
      <div class="tlscroll">
        <div class="ruler">${marks.map((s) => html`<span style=${{ left: (s / DUR * 100) + '%' }}>${fmt(s)}</span>`)}</div>
        ${TRACKS.map((t) => {
          const st = rows[t.id] || {};
          return html`<div class=${cx('trow', t.cls, st.hide && 'hidden', st.lock && 'locked')}>${t.clips.map((c) => html`<div class=${cx('clip', c.cls)} style=${{ left: (c.a / DUR * 100) + '%', width: ((c.b - c.a) / DUR * 100) + '%' }}>
            ${c.wave && html`<${Wave} />`}${c.label && html`<span class="clabel">${t.id === 't' ? html`<${Icon} name="text" size=${13} />` : ''}${c.label}</span>`}</div>`)}</div>`;
        })}
        <div class="playhead" style=${{ left: (time / DUR * 100) + '%' }}><i></i></div>
      </div>
    </div>
    <div class="tlscrollbar"><div></div></div>
  </section>`;
}
