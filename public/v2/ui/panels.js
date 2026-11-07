import { html, useState } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Tabs, Chips, Select, Slider, Field, cx } from './widgets.js';
import { L, H } from './strings.js';

// ---------------- left panel: Media (and an empty state for the tools that arrive in later phases) ----------------
const DEMO_MEDIA = [
  ['sunset', 'video', '00:15'], ['night', 'video', '00:12'], ['forest', 'photo', ''], ['music', 'audio', '03:58'],
  ['city', 'video', '00:18'], ['sky', 'photo', ''], ['flower', 'photo', ''], ['sea', 'video', '00:14'],
];
export function MediaPanel({ tool }) {
  const [tab, setTab] = useState('local');
  const [kind, setKind] = useState('all');
  const [grid, setGrid] = useState(true);
  const [pick, setPick] = useState(0);
  if (tool !== 'media') {
    return html`<section class="panel media"><div class="phead"><b>${L(tool)}</b></div>
      <div class="empty"><${Icon} name=${tool} size=${34} /><p>${H(tool)}</p><small>ဒီအပိုင်းကို နောက်အဆင့်မှာ ဆက်လုပ်ပါမယ်</small></div></section>`;
  }
  const items = DEMO_MEDIA.filter((m) => kind === 'all' || (kind === 'videos' && m[1] === 'video') || (kind === 'photos' && m[1] === 'photo') || (kind === 'audios' && m[1] === 'audio'));
  return html`<section class="panel media">
    <${Tabs} value=${tab} onChange=${setTab} tabs=${[['local', L('local'), H('local')], ['library', L('library'), H('library')], ['audio', L('audios'), H('audios')], ['record', L('record'), H('record')]]} />
    <div class="pbody">
      <button type="button" class="uploadbtn" title=${H('upload')}><${Icon} name="upload" size=${20} /><span>${L('upload')}</span><${Icon} name="chevron" size=${14} /></button>
      <div class="filterrow">
        <${Select} value=${kind} onChange=${setKind} cls="compact" options=${[['all', L('all')], ['videos', L('videos')], ['photos', L('photos')], ['audios', L('audios')]]} />
        <div class="spacer"></div>
        <${IconBtn} name="grid" active=${grid} title="Grid" onClick=${() => setGrid(true)} size=${17} />
        <${IconBtn} name="list" active=${!grid} title="List" onClick=${() => setGrid(false)} size=${17} />
      </div>
      <div class=${cx('mgrid', !grid && 'list')}>
        ${items.map((m, i) => html`<button type="button" class=${cx('mtile', 'g-' + m[0], pick === i && 'on')} onClick=${() => setPick(i)}>
          ${m[1] === 'audio' && html`<span class="mnote"><${Icon} name="audio" size=${26} /></span>`}
          ${m[2] && html`<span class="dur">${m[1] === 'video' && html`<${Icon} name="video" size=${12} />`}${m[2]}</span>`}</button>`)}
        <button type="button" class="mtile add" title=${H('addMore')}><${Icon} name="plus" size=${26} /><span>${L('addMore')}</span></button>
      </div>
    </div>
  </section>`;
}

// ---------------- right panel (top): Inspector ----------------
const FONTS = ['Noto Sans Myanmar', 'Noto Serif Myanmar', 'Padauk', 'Pyidaungsu', 'system-ui'];
export function Inspector() {
  const [tab, setTab] = useState('text');
  const [s, setS] = useState({ text: 'ကဗျာ ခေါင်းစဉ်', font: FONTS[0], b: false, i: false, u: false, align: 'center', fill: '#ffffff', strokeOn: true, stroke: '#000000', size: 72, opacity: 100, x: 960, y: 540, rot: 0 });
  const set = (k) => (v) => setS((o) => ({ ...o, [k]: v }));
  const tg = (k) => () => setS((o) => ({ ...o, [k]: !o[k] }));
  return html`<aside class="panel inspector">
    <${Tabs} value=${tab} onChange=${setTab} tabs=${[['text', L('tText'), H('tText')], ['anim', L('tAnimation'), H('tAnimation')], ['timing', L('tTiming'), H('tTiming')]]} />
    <div class="pbody scroll">
      ${tab === 'text' ? html`
        <div class="textbox"><textarea value=${s.text} maxlength="300" onInput=${(e) => set('text')(e.target.value)} placeholder="စာသား ရိုက်ပါ" /><span class="count">${s.text.length} / 300</span></div>
        <${Field} label=${L('font')} tip=${H('font')}><${Select} value=${s.font} onChange=${set('font')} options=${FONTS} /><//>
        <${Field} label=${L('style')} tip=${H('style')}>
          <div class="seg"><${IconBtn} name="bold" active=${s.b} onClick=${tg('b')} title="Bold" /><${IconBtn} name="italic" active=${s.i} onClick=${tg('i')} title="Italic" /><${IconBtn} name="underline" active=${s.u} onClick=${tg('u')} title="Underline" /></div>
          <div class="seg"><${IconBtn} name="alignLeft" active=${s.align === 'left'} onClick=${() => set('align')('left')} title="Left" /><${IconBtn} name="alignCenter" active=${s.align === 'center'} onClick=${() => set('align')('center')} title="Center" /><${IconBtn} name="alignRight" active=${s.align === 'right'} onClick=${() => set('align')('right')} title="Right" /><${IconBtn} name="alignJustify" active=${s.align === 'justify'} onClick=${() => set('align')('justify')} title="Justify" /></div>
        <//>
        <${Field} label=${L('color')} tip=${H('color')}><label class="swatch"><input type="color" value=${s.fill} onInput=${(e) => set('fill')(e.target.value)} /><span style=${{ background: s.fill }}></span></label><${IconBtn} name="pipette" title="Eyedropper" /><//>
        <${Field} label=${L('stroke')} tip=${H('stroke')}><label class="switch"><input type="checkbox" checked=${s.strokeOn} onChange=${tg('strokeOn')} /><i></i></label><label class=${cx('swatch', !s.strokeOn && 'off')}><input type="color" value=${s.stroke} disabled=${!s.strokeOn} onInput=${(e) => set('stroke')(e.target.value)} /><span style=${{ background: s.stroke }}></span></label><//>
        <${Slider} label=${L('size')} tip=${H('size')} value=${s.size} min=${8} max=${240} onChange=${set('size')} />
        <${Slider} label=${L('opacity')} tip=${H('opacity')} value=${s.opacity} min=${0} max=${100} onChange=${set('opacity')} unit="%" />
        <${Field} label=${L('position')} tip=${H('position')}>
          <label class="xy"><em>X</em><input type="number" value=${s.x} onInput=${(e) => set('x')(+e.target.value || 0)} /></label>
          <label class="xy"><em>Y</em><input type="number" value=${s.y} onInput=${(e) => set('y')(+e.target.value || 0)} /></label>
        <//>
        <${Slider} label=${L('rotate')} tip=${H('rotate')} value=${s.rot} min=${-180} max=${180} onChange=${set('rot')} unit="°" />
        <div class="rowend"><${IconBtn} name="reset" title="Reset" onClick=${() => set('rot')(0)} /></div>`
      : html`<div class="empty"><${Icon} name=${tab === 'anim' ? 'effects' : 'speed'} size=${30} /><p>${tab === 'anim' ? 'In / Out / Loop animation' : 'Start · Duration'}</p><small>ဒီအပိုင်းကို နောက်အဆင့်မှာ ဆက်လုပ်ပါမယ်</small></div>`}
    </div>
  </aside>`;
}

// ---------------- right panel (bottom): Effects / Transitions / Filters ----------------
const FX = {
  effects: [['Glow', 'g1'], ['Shake', 'g2'], ['Zoom In', 'g3'], ['Blur', 'g4'], ['Flash', 'g5'], ['Film Grain', 'g6'], ['Vignette', 'g7'], ['Chromatic', 'g8']],
  transitions: [['Fade', 'g2'], ['Slide', 'g4'], ['Zoom', 'g6'], ['Wipe', 'g8']],
  filters: [['Warm', 'g1'], ['Cool', 'g4'], ['Vivid', 'g5'], ['Mono', 'g7'], ['Dream', 'g3'], ['Noir', 'g8']],
};
export function EffectsPanel() {
  const [tab, setTab] = useState('effects');
  const [cat, setCat] = useState('trending');
  return html`<aside class="panel fxpanel">
    <${Tabs} value=${tab} onChange=${setTab} tabs=${[['effects', L('effects'), H('effects')], ['transitions', L('transitions'), H('transitions')], ['filters', L('filters'), H('filters')]]} />
    <div class="pbody scroll">
      <${Chips} value=${cat} onChange=${setCat} items=${[['trending', L('trending')], ['basic', L('basic')], ['retro', L('retro')], ['bw', L('bw')], ['blur', L('blur')]]} />
      <div class="fxgrid">${FX[tab].map(([name, g]) => html`<button type="button" class="fxtile"><span class=${cx('fxthumb', g)}></span><em>${name}</em></button>`)}</div>
    </div>
  </aside>`;
}
