import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Tabs, Chips, Select, Slider, Field, cx } from './widgets.js';
import { useStore } from './hooks.js';
import { L, H } from './strings.js';
import { RATIOS, findClip, textTrack } from '../engine/model.js';
import { addText, addLines, addMedia, textToSrt } from '../engine/actions.js';
import { importFile } from '../engine/media.js';
import { loadMedia } from '../engine/storage.js';

// ---------------- left panel: Text tool (real) · Media (still a demo until phase 3) · empty state for the rest ----------------
const DEMO_MEDIA = [
  ['sunset', 'video', '00:15'], ['night', 'video', '00:12'], ['forest', 'photo', ''], ['music', 'audio', '03:58'],
  ['city', 'video', '00:18'], ['sky', 'photo', ''], ['flower', 'photo', ''], ['sea', 'video', '00:14'],
];
function MediaPreview({ media }) {
  const [url, setUrl] = useState('');
  useEffect(() => { let u = ''; loadMedia(media.id).then((blob) => { if (blob) { u = URL.createObjectURL(blob); setUrl(u); } }); return () => { if (u) URL.revokeObjectURL(u); }; }, [media.id]);
  if (!url) return html`<div class="media-preview"><small>Loading preview…</small></div>`;
  if (media.kind === 'audio') return html`<div class="media-preview"><audio controls src=${url} /></div>`;
  if (media.kind === 'video') return html`<div class="media-preview"><video controls muted src=${url} /></div>`;
  return html`<div class="media-preview"><img src=${url} alt=${media.name} /></div>`;
}
function TextPanel({ store, transport }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const [poem, setPoem] = useState('');
  const clips = [...textTrack(project).clips].sort((a, b) => a.start - b.start);
  const pick = (c) => { store.select(c.id); transport.seek(c.start + 0.01); };
  return html`<section class="panel media">
    <div class="phead"><b>${L('text')}</b></div>
    <div class="pbody scroll">
      <button type="button" class="uploadbtn" onClick=${() => addText(store, transport)}><${Icon} name="plus" size=${20} /><span>Add text</span></button>
      <div class="textbox"><textarea value=${poem} placeholder="ကဗျာ paste လုပ်ပါ — စာကြောင်းတစ်ကြောင်းကို clip တစ်ခုစီ ဖန်တီးပေးမယ်" onInput=${(e) => setPoem(e.target.value)} /></div>
      <button type="button" class="btn ghost wide" disabled=${!poem.trim()} onClick=${() => { addLines(store, transport, poem.split('\n')); setPoem(''); }}><${Icon} name="text" size=${16} /><span>Add lines as clips</span></button>
      <button type="button" class="btn ghost wide" disabled=${!clips.length} onClick=${() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([textToSrt(project)], { type: 'text/plain;charset=utf-8' })); a.download = `${project.name || 'fornyein'}.srt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }}><${Icon} name="download" size=${16} /><span>Export SRT</span></button>
      <div class="textlist">${clips.length === 0 ? html`<div class="menuempty">Text clip မရှိသေးပါ</div>` : clips.map((c, i) => html`<button type="button" class=${cx('titem', sel === c.id && 'on')} onClick=${() => pick(c)}>
        <span class="n">${i + 1}</span><span class="tx">${c.text.split('\n')[0] || '…'}</span><em>${c.start.toFixed(1)}s</em></button>`)}</div>
    </div>
  </section>`;
}
export function MediaPanel({ tool, store, transport }) {
  const project = useStore(store, (s) => s.project), [tab, setTab] = useState('local'), [kind, setKind] = useState('all'), [grid, setGrid] = useState(true), [library, setLibrary] = useState([]), [recording, setRecording] = useState(false), [preview, setPreview] = useState(null), input = useRef(), recorder = useRef(), chunks = useRef([]);
  const media = Object.values(project.media || {});
  useEffect(() => { if (tab !== 'library') return; fetch('/api/library/Music').then((r) => r.ok ? r.json() : []).then(setLibrary).catch(() => setLibrary([])); }, [tab]);
  if (tool === 'text') return html`<${TextPanel} store=${store} transport=${transport} />`;
  if (tool !== 'media') return html`<section class="panel media"><div class="phead"><b>${L(tool)}</b></div><div class="empty"><${Icon} name=${tool} size=${34} /><p>${H(tool)}</p><small>ဒီအပိုင်းကို နောက်အဆင့်မှာ ဆက်လုပ်ပါမယ်</small></div></section>`;
  const accept = kind === 'audios' ? 'audio/*' : kind === 'videos' ? 'video/*' : kind === 'photos' ? 'image/*' : 'audio/*,video/*,image/*';
  const onFiles = async (list) => { for (const file of [...list]) { try { const meta = await importFile(file); addMedia(store, transport, meta); } catch (e) { console.error(e); } } };
  const startRecord = async () => { if (recording) { recorder.current?.stop(); return; } const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks.current = []; const r = new MediaRecorder(stream); recorder.current = r; r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data); r.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); setRecording(false); const file = new File([new Blob(chunks.current, { type: r.mimeType || 'audio/webm' })], `recording-${Date.now()}.webm`, { type: r.mimeType || 'audio/webm' }); const meta = await importFile(file); addMedia(store, transport, meta); }; r.start(); setRecording(true); };
  const addLibrary = async (item) => { try { const name = item.name || item.key; const r = await fetch('/api/asset/Music/' + name.split('/').map(encodeURIComponent).join('/')); if (!r.ok) return; const blob = await r.blob(); const meta = await importFile(new File([blob], name.split('/').pop(), { type: blob.type })); addMedia(store, transport, meta); } catch (e) { console.error(e); } };
  const localTiles = media.filter((m) => kind === 'all' || (kind === 'audios' && m.kind === 'audio') || (kind === 'videos' && m.kind === 'video') || (kind === 'photos' && m.kind === 'image'));
  return html`<section class="panel media"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['local', L('local'), H('local')], ['library', L('library'), H('library')], ['audio', L('audios'), H('audios')], ['record', L('record'), H('record')]]} /><div class="pbody">
    ${tab === 'record' ? html`<button type="button" class=${cx('uploadbtn', recording && 'recording')} onClick=${startRecord}><${Icon} name="audio" size=${20} /><span>${recording ? 'Stop recording' : 'Record microphone'}</span></button><small class="muted">Microphone permission လိုအပ်ပါတယ်</small>` : tab === 'library' ? html`<div class="mgrid">${library.length ? library.map((x) => html`<button type="button" class="mtile add" onClick=${() => addLibrary(x)}><${Icon} name="audio" size=${24} /><span>${x.name || x.key}</span></button>`) : html`<div class="empty"><p>R2 Music library</p><small>Library မရရှိသေးပါ</small></div>`}</div>` : html`<button type="button" class="uploadbtn" title=${H('upload')} onClick=${() => input.current?.click()}><${Icon} name="upload" size=${20} /><span>${L('upload')}</span><${Icon} name="chevron" size=${14} /></button><input ref=${input} type="file" accept=${accept} multiple hidden onChange=${(e) => onFiles(e.target.files)} /><div class="filterrow"><${Select} value=${kind} onChange=${setKind} cls="compact" options=${[['all', L('all')], ['videos', L('videos')], ['photos', L('photos')], ['audios', L('audios')]]} /><div class="spacer"></div><${IconBtn} name="grid" active=${grid} title="Grid" onClick=${() => setGrid(true)} size=${17} /><${IconBtn} name="list" active=${!grid} title="List" onClick=${() => setGrid(false)} size=${17} /></div>${preview && html`<${MediaPreview} media=${preview} />`}<div class=${cx('mgrid', !grid && 'list')}>${localTiles.map((m) => html`<button type="button" class=${cx('mtile', 'g-' + m.kind, preview?.id === m.id && 'on')} onClick=${() => { setPreview(m); const c = project.tracks.flatMap((t) => t.clips).find((c) => c.mediaId === m.id); if (c) store.select(c.id); }}><span class="mnote"><${Icon} name=${m.kind === 'audio' ? 'audio' : m.kind === 'video' ? 'video' : 'image'} size=${26} /></span><span class="dur">${m.name}</span></button>`)}${!localTiles.length && html`<div class="empty"><p>Local media မရှိသေးပါ</p><small>Upload Media ကိုနှိပ်ပြီး ဖိုင်ရွေးပါ</small></div>`}</div>`}
  </div></section>`;
}
// ---------------- right panel (top): Inspector — edits the selected text clip ----------------
export function Inspector({ store, fonts }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const [tab, setTab] = useState('text');
  const found = sel ? findClip(project, sel) : null, c = found ? found.clip : null;
  const [W] = RATIOS[project.size], [, H2] = RATIOS[project.size];
  const upd = (key, fn) => store.edit((d) => { const f = findClip(d, sel); if (f) fn(f.clip); }, { key: key + sel });
  const tabs = html`<${Tabs} value=${tab} onChange=${setTab} tabs=${[['text', L('tText'), H('tText')], ['anim', L('tAnimation'), H('tAnimation')], ['timing', L('tTiming'), H('tTiming')]]} />`;
  if (!c) return html`<aside class="panel inspector">${tabs}<div class="empty"><${Icon} name="text" size=${32} /><p>Select a text clip</p><small>Timeline မှာ စာတန်းတစ်ခု ရွေးပါ၊ ဒါမှမဟုတ် Text tool မှာ Add text နှိပ်ပါ</small></div></aside>`;
  if (c.kind === 'audio') return html`<aside class="panel inspector">${tabs}<div class="pbody scroll">
    <div class="audioins"><b>${c.name || project.media?.[c.mediaId]?.name || 'Audio clip'}</b><small>Audio clip settings</small></div>
    <${Slider} label="Gain" tip="အသံအတိုးအကျယ်" value=${Math.round((c.gain ?? 1) * 100)} min=${0} max=${200} onChange=${(v) => upd('gain', (k) => { k.gain = v / 100; })} unit="%" />
    <${Field} label="Fade in" tip="အသံဝင်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${c.fade?.in || 0} onInput=${(e) => upd('fadein', (k) => { k.fade = { ...(k.fade || {}), in: Math.max(0, +e.target.value || 0) }; })} /></label><//>
    <${Field} label="Fade out" tip="အသံထွက်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${c.fade?.out || 0} onInput=${(e) => upd('fadeout', (k) => { k.fade = { ...(k.fade || {}), out: Math.max(0, +e.target.value || 0) }; })} /></label><//>
    <${Field} label="Loop" tip="Music ကို ပြန်လည်ဖွင့်ရန်"><label class="switch"><input type="checkbox" checked=${!!c.loop} onChange=${() => upd('loop', (k) => { k.loop = !k.loop; })} /><i></i></label><//>
    <${Field} label="Start" tip="စတင်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${+c.start.toFixed(2)} onInput=${(e) => upd('ast', (k) => { k.start = Math.max(0, +e.target.value || 0); })} /></label><//>
    <${Field} label="Duration" tip="ကြာချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0.1" value=${+c.dur.toFixed(2)} onInput=${(e) => upd('adu', (k) => { k.dur = Math.max(0.1, +e.target.value || 0.1); })} /></label><//>
  </div></aside>`;
  const s = c.style || {}, fontOpts = fonts.includes(s.font) ? fonts : [s.font, ...fonts];
  return html`<aside class="panel inspector">${tabs}
    <div class="pbody scroll">
      ${tab === 'text' ? html`
        <div class="textbox"><textarea value=${c.text} maxlength="500" onInput=${(e) => upd('text', (k) => { k.text = e.target.value; })} placeholder="စာသား ရိုက်ပါ" /><span class="count">${c.text.length} / 500</span></div>
        <${Field} label=${L('font')} tip=${H('font')}><${Select} value=${s.font} onChange=${(v) => upd('font', (k) => { k.style.font = v; })} options=${fontOpts} /><//>
        <${Field} label=${L('style')} tip=${H('style')}>
          <div class="seg"><${IconBtn} name="bold" active=${s.bold} onClick=${() => upd('b', (k) => { k.style.bold = !k.style.bold; })} title="Bold" /><${IconBtn} name="italic" active=${s.italic} onClick=${() => upd('i', (k) => { k.style.italic = !k.style.italic; })} title="Italic" /><${IconBtn} name="underline" active=${s.underline} onClick=${() => upd('u', (k) => { k.style.underline = !k.style.underline; })} title="Underline" /></div>
          <div class="seg">${[['left', 'alignLeft'], ['center', 'alignCenter'], ['right', 'alignRight']].map(([a, ic]) => html`<${IconBtn} name=${ic} active=${s.align === a} onClick=${() => upd('al', (k) => { k.style.align = a; })} title=${a} />`)}</div>
        <//>
        <${Field} label=${L('color')} tip=${H('color')}><label class="swatch"><input type="color" value=${s.fill} onInput=${(e) => upd('fill', (k) => { k.style.fill = e.target.value; })} /><span style=${{ background: s.fill }}></span></label><//>
        <${Field} label="Fill 2 / Gradient" tip="ဒုတိယအရောင်နှင့် gradient"><label class="switch"><input type="checkbox" checked=${!!s.gradient} onChange=${() => upd('gradient', (k) => { k.style.gradient = !k.style.gradient; })} /><i></i></label><label class="swatch"><input type="color" value=${s.fill2 || s.fill} onInput=${(e) => upd('fill2', (k) => { k.style.fill2 = e.target.value; })} /><span style=${{ background: s.fill2 || s.fill }}></span></label><//>
        <${Field} label="Shadow" tip="စာသားအရိပ်"><label class="switch"><input type="checkbox" checked=${!!s.shadow?.on} onChange=${() => upd('shadow', (k) => { k.style.shadow = { ...(k.style.shadow || {}), on: !k.style.shadow?.on }; })} /><i></i></label><//>
        <${Field} label="Glow" tip="စာသားအလင်းရောင်"><label class="switch"><input type="checkbox" checked=${!!s.glow?.on} onChange=${() => upd('glow', (k) => { k.style.glow = { ...(k.style.glow || {}), on: !k.style.glow?.on }; })} /><i></i></label><//>
        <${Field} label=${L('stroke')} tip=${H('stroke')}><label class="switch"><input type="checkbox" checked=${s.strokeOn} onChange=${() => upd('son', (k) => { k.style.strokeOn = !k.style.strokeOn; })} /><i></i></label><label class=${cx('swatch', !s.strokeOn && 'off')}><input type="color" value=${s.stroke} disabled=${!s.strokeOn} onInput=${(e) => upd('stroke', (k) => { k.style.stroke = e.target.value; })} /><span style=${{ background: s.stroke }}></span></label><//>
        <${Slider} label=${L('size')} tip=${H('size')} value=${s.size} min=${8} max=${240} onChange=${(v) => upd('size', (k) => { k.style.size = v; })} />
        <${Slider} label=${L('opacity')} tip=${H('opacity')} value=${s.opacity} min=${0} max=${100} onChange=${(v) => upd('op', (k) => { k.style.opacity = v; })} unit="%" />
        <${Field} label=${L('position')} tip=${H('position')}>
          <label class="xy"><em>X</em><input type="number" value=${Math.round(c.pos.x / 100 * W)} onInput=${(e) => upd('px', (k) => { k.pos.x = (+e.target.value || 0) / W * 100; })} /></label>
          <label class="xy"><em>Y</em><input type="number" value=${Math.round(c.pos.y / 100 * H2)} onInput=${(e) => upd('py', (k) => { k.pos.y = (+e.target.value || 0) / H2 * 100; })} /></label>
        <//>
        <${Slider} label=${L('rotate')} tip=${H('rotate')} value=${Math.round(c.pos.rot)} min=${-180} max=${180} onChange=${(v) => upd('rot', (k) => { k.pos.rot = v; })} unit="°" />
        <div class="rowend"><${IconBtn} name="reset" title="Reset" onClick=${() => upd('rot', (k) => { k.pos.rot = 0; })} /></div>`
      : tab === 'timing' ? html`
        <${Field} label="Start" tip="စတင်ချိန် (စက္ကန့်)"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${+c.start.toFixed(2)} onInput=${(e) => upd('st', (k) => { k.start = Math.max(0, +e.target.value || 0); })} /></label><//>
        <${Field} label="Duration" tip="ကြာချိန် (စက္ကန့်)"><label class="xy"><em>s</em><input type="number" step="0.1" min="0.1" value=${+c.dur.toFixed(2)} onInput=${(e) => upd('du', (k) => { k.dur = Math.max(0.1, +e.target.value || 0.1); })} /></label><//>`
      : tab === 'anim' ? html`
        <${Field} label="In" tip="ဝင်လာ animation"><${Select} value=${c.anim?.in || 'fade'} onChange=${(v) => upd('ain', (k) => { k.anim = { ...(k.anim || {}), in: v }; })} options=${[['none', 'None'], ['fade', 'Fade'], ['slideUp', 'Slide up'], ['zoom', 'Zoom']]}/><//>
        <${Field} label="Out" tip="ထွက်သွား animation"><${Select} value=${c.anim?.out || 'fade'} onChange=${(v) => upd('aout', (k) => { k.anim = { ...(k.anim || {}), out: v }; })} options=${[['none', 'None'], ['fade', 'Fade']]}/><//>
        <${Field} label="Loop" tip="ပြန်လည်လှုပ်ရှားမှု"><${Select} value=${c.anim?.loop || 'none'} onChange=${(v) => upd('aloop', (k) => { k.anim = { ...(k.anim || {}), loop: v }; })} options=${[['none', 'None'], ['pulse', 'Pulse'], ['float', 'Float']]}/><//>
        <${Slider} label="In duration" tip="ဝင်ချိန်" value=${Math.round((c.anim?.inDur || .35) * 100)} min=${0} max=${200} onChange=${(v) => upd('aid', (k) => { k.anim = { ...(k.anim || {}), inDur: v / 100 }; })} unit="%" />
      ` : html`<div class="empty"><${Icon} name="effects" size=${30} /><p>Text animation</p><small>In / Out / Loop animation</small></div>`}
    </div>
  </aside>`;
}

// ---------------- right panel (bottom): Effects / Transitions / Filters (design only for now) ----------------
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
