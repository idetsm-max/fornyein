import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Tabs, Chips, Select, Slider, Field, cx } from './widgets.js';
import { useStore } from './hooks.js';
import { L, H } from './strings.js';
import { RATIOS, findClip, textTrack } from '../engine/model.js';
import { addText, addLines, addTimedLines, addAsrLines, addMedia, addOverlayLogo, textToSrt, syncTextClip, insertPreset, splitTextClip, mergeTextClips } from '../engine/actions.js';
import { importFile, detectVoiceSegments } from '../engine/media.js';
import { loadMedia } from '../engine/storage.js';
import { PRESETS, EFFECTS, convertMyanmarToUnicode, isLikelyZawgyi } from '../engine/text.js';
import { checkAsr, transcribeAudio, wavChunk } from '../engine/asr.js';

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
  const [poem, setPoem] = useState(''), [syncing, setSyncing] = useState(false), [syncIndex, setSyncIndex] = useState(0), [drafting, setDrafting] = useState(false), [captioning, setCaptioning] = useState(false), [captionProgress, setCaptionProgress] = useState(0), [captionStatus, setCaptionStatus] = useState(''), [conversionStatus, setConversionStatus] = useState('');
  const clips = [...textTrack(project).clips].sort((a, b) => a.start - b.start);
  const selectedTextClip = sel ? findClip(project, sel)?.clip : null;
  const pick = (c) => { store.select(c.id); transport.seek(c.start + 0.01); };
  const beginSync = () => { if (!clips.length) return; setSyncing(true); setSyncIndex(0); transport.seek(0); transport.play(); };
  const tapSync = () => { if (!syncing) return; const now = transport.t, current = clips[syncIndex], previous = clips[syncIndex - 1]; if (previous) syncTextClip(store, previous.id, previous.start, now); if (current) { syncTextClip(store, current.id, now); store.select(current.id); } if (syncIndex >= clips.length - 1) { transport.pause(); setSyncing(false); } else setSyncIndex(syncIndex + 1); };
  const autoDraft = async () => { const lines = poem.split('\n').map((x) => x.trim()).filter(Boolean), audio = project.tracks.find((t) => t.kind === 'audio')?.clips[0]; if (!lines.length || !audio) return; setDrafting(true); try { const blob = await loadMedia(audio.mediaId); const segments = await detectVoiceSegments(blob); addTimedLines(store, transport, lines, segments); setPoem(''); } finally { setDrafting(false); } };
  const autoCaption = async () => { const audio = project.tracks.find((t) => t.kind === 'audio')?.clips[0]; if (!audio || captioning) return; setCaptioning(true); setCaptionProgress(0); setCaptionStatus('Worker Whisper စစ်ဆေးနေသည်…'); try { const health = await checkAsr(); if (!health.ready) throw new Error('Cloudflare Worker Whisper မရရှိသေးပါ'); const blob = await loadMedia(audio.mediaId); const result = await transcribeAudio(blob, { lang: 'my', chunker: wavChunk, onProgress: (p) => setCaptionProgress(Math.round(p * 100)) }); const rows = result.lines.filter((r) => r.text); if (!rows.length) throw new Error('အသံထဲမှ စာသားမတွေ့ပါ'); addAsrLines(store, transport, rows); setCaptionStatus(`${rows.length} caption clips draft အဖြစ်ထည့်ပြီး`); } catch (e) { setCaptionStatus(e.message || 'Auto Caption မအောင်မြင်ပါ'); } finally { setCaptioning(false); } };
  const confirmConversion = (text) => window.confirm(isLikelyZawgyi(text)
    ? 'ဒီစာသားမှာ Zawgyi ပုံစံ တွေ့ရနိုင်ပါတယ်။ ပြောင်းပြီးနောက် ရလဒ်ကို စစ်ဆေးပါ။ ဆက်ပြောင်းမလား?'
    : 'Zawgyi လက္ခဏာ မတွေ့ပါ။ မှန်ကန်သော Unicode ကို ပြောင်းလဲမိနိုင်ပါတယ်။ ဆက်ပြောင်းမလား?');
  const convertPoem = async () => {
    if (!poem.trim() || !confirmConversion(poem)) return;
    try {
      setPoem(await convertMyanmarToUnicode(poem));
      setConversionStatus('ပြောင်းပြီးပါပြီ။ စာသားကို ပြန်စစ်ပါ။');
    } catch (error) { setConversionStatus(`ပြောင်းမရပါ: ${error.message}`); }
  };
  const convertSelectedClip = async () => {
    if (selectedTextClip?.kind !== 'text' || !confirmConversion(selectedTextClip.text)) return;
    try {
      const text = await convertMyanmarToUnicode(selectedTextClip.text);
      store.edit((d) => {
        const clip = findClip(d, sel)?.clip;
        if (clip?.kind === 'text' && !clip.locked) clip.text = text;
      }, { key: `zg2uni:${sel}` });
      setConversionStatus('ပြောင်းပြီးပါပြီ။ စာသားကို ပြန်စစ်ပါ။');
    } catch (error) { setConversionStatus(`ပြောင်းမရပါ: ${error.message}`); }
  };
  useEffect(() => { if (!syncing) return; const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); tapSync(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [syncing, syncIndex, clips]);
  return html`<section class="panel media">
    <div class="phead"><b>${L('text')}</b></div>
    <div class="pbody scroll">
      <button type="button" class="uploadbtn" onClick=${() => addText(store, transport)}><${Icon} name="plus" size=${20} /><span>Add text</span></button>
      <div class="textbox"><textarea value=${poem} placeholder="ကဗျာ paste လုပ်ပါ — စာကြောင်းတစ်ကြောင်းကို clip တစ်ခုစီ ဖန်တီးပေးမယ်" onInput=${(e) => setPoem(e.target.value)} /></div>
      <div class="presetrow">${Object.entries(PRESETS).map(([key, preset]) => html`<button type="button" class="chip" title=${preset.name} onClick=${() => insertPreset(store, transport, key)}>${preset.name}</button>`)}</div>
      <div class="syncrow"><button type="button" class="btn ghost" disabled=${!poem.trim()} onClick=${convertPoem}>Zawgyi → Unicode (poem)</button><button type="button" class="btn ghost" disabled=${selectedTextClip?.kind !== 'text'} onClick=${convertSelectedClip}>Zawgyi → Unicode (clip)</button></div>
      ${conversionStatus && html`<small class="muted" role="status">${conversionStatus}</small>`}
      <button type="button" class="btn ghost wide" disabled=${!poem.trim()} onClick=${() => { addLines(store, transport, poem.split('\n')); setPoem(''); }}><${Icon} name="text" size=${16} /><span>Add lines as clips</span></button>
      <button type="button" class="btn ghost wide" disabled=${!poem.trim() || !project.tracks.find((t) => t.kind === 'audio')?.clips.length || drafting} onClick=${autoDraft}><${Icon} name="wand" size=${16} /><span>${drafting ? 'Analyzing voice…' : 'Auto-draft from voice'}</span></button>
      <button type="button" class="btn ghost wide" disabled=${!project.tracks.find((t) => t.kind === 'audio')?.clips.length || captioning} onClick=${autoCaption}><${Icon} name="wand" size=${16} /><span>${captioning ? `Whisper transcribing… ${captionProgress}%` : 'Auto Caption · Worker Whisper'}</span></button>
      ${captionStatus && html`<small class="muted" role="status">${captionStatus}</small>`}
      <div class="syncrow"><button type="button" class=${cx('btn', syncing && 'on')} disabled=${!clips.length} onClick=${beginSync}>${syncing ? 'Tap next (Space)' : 'Start tap-sync'}</button>${syncing && html`<button type="button" class="btn ghost" onClick=${tapSync}>Tap ${syncIndex + 1}/${clips.length}</button>`}</div>
      <div class="syncrow"><button type="button" class="btn ghost" disabled=${!sel} onClick=${() => splitTextClip(store, sel)}>Split caption</button><button type="button" class="btn ghost" disabled=${!sel || clips.findIndex((x) => x.id === sel) >= clips.length - 1} onClick=${() => { const i = clips.findIndex((x) => x.id === sel); mergeTextClips(store, [sel, clips[i + 1]?.id]); }}>Merge next</button></div>
      <button type="button" class="btn ghost wide" disabled=${!clips.length} onClick=${() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([textToSrt(project)], { type: 'text/plain;charset=utf-8' })); a.download = `${project.name || 'fornyein'}.srt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }}><${Icon} name="download" size=${16} /><span>Export SRT</span></button>
      <div class="textlist">${clips.length === 0 ? html`<div class="menuempty">Text clip မရှိသေးပါ</div>` : clips.map((c, i) => html`<button type="button" class=${cx('titem', sel === c.id && 'on')} onClick=${() => pick(c)}>
        <span class="n">${i + 1}</span><span class="tx">${c.text.split('\n')[0] || '…'}</span><em>${c.start.toFixed(1)}s · ${Math.round((c.confidence ?? 1) * 100)}%</em></button>`)}</div>
    </div>
  </section>`;
}
export function MediaPanel({ tool, store, transport }) {
  const project = useStore(store, (s) => s.project), [tab, setTab] = useState('local'), [kind, setKind] = useState('all'), [grid, setGrid] = useState(true), [library, setLibrary] = useState([]), [libraryKind, setLibraryKind] = useState('Music'), [recording, setRecording] = useState(false), [preview, setPreview] = useState(null), input = useRef(), recorder = useRef(), chunks = useRef([]);
  const media = Object.values(project.media || {});
  useEffect(() => { if (tab !== 'library') return; fetch('/api/library/' + libraryKind).then((r) => r.ok ? r.json() : []).then(setLibrary).catch(() => setLibrary([])); }, [tab, libraryKind]);
  if (tool === 'text') return html`<${TextPanel} store=${store} transport=${transport} />`;
  if (tool !== 'media') return html`<section class="panel media"><div class="phead"><b>${L(tool)}</b></div><div class="empty"><${Icon} name=${tool} size=${34} /><p>${H(tool)}</p><small>ဒီအပိုင်းကို နောက်အဆင့်မှာ ဆက်လုပ်ပါမယ်</small></div></section>`;
  const accept = kind === 'audios' ? 'audio/*' : kind === 'videos' ? 'video/*' : kind === 'photos' ? 'image/*' : 'audio/*,video/*,image/*';
  const onFiles = async (list) => { for (const file of [...list]) { try { const meta = await importFile(file); addMedia(store, transport, meta); } catch (e) { console.error(e); } } };
  const startRecord = async () => { if (recording) { recorder.current?.stop(); return; } const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks.current = []; const r = new MediaRecorder(stream); recorder.current = r; r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data); r.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); setRecording(false); const file = new File([new Blob(chunks.current, { type: r.mimeType || 'audio/webm' })], `recording-${Date.now()}.webm`, { type: r.mimeType || 'audio/webm' }); const meta = await importFile(file); addMedia(store, transport, meta); }; r.start(); setRecording(true); };
  const addLibrary = async (item) => { try { const name = item.name || item.key; const r = await fetch('/api/asset/' + libraryKind + '/' + name.split('/').map(encodeURIComponent).join('/')); if (!r.ok) return; const blob = await r.blob(); const meta = await importFile(new File([blob], name.split('/').pop(), { type: blob.type })); if (libraryKind === 'SE') meta.role = 'se'; addMedia(store, transport, meta); } catch (e) { console.error(e); } };
  const localTiles = media.filter((m) => kind === 'all' || (kind === 'audios' && m.kind === 'audio') || (kind === 'videos' && m.kind === 'video') || (kind === 'photos' && m.kind === 'image'));
  return html`<section class="panel media"><${Tabs} value=${tab} onChange=${setTab} tabs=${[['local', L('local'), H('local')], ['library', L('library'), H('library')], ['audio', L('audios'), H('audios')], ['record', L('record'), H('record')]]} /><div class="pbody">
    ${tab === 'record' ? html`<button type="button" class=${cx('uploadbtn', recording && 'recording')} onClick=${startRecord}><${Icon} name="audio" size=${20} /><span>${recording ? 'Stop recording' : 'Record microphone'}</span></button><small class="muted">Microphone permission လိုအပ်ပါတယ်</small>` : tab === 'library' ? html`<${Select} value=${libraryKind} onChange=${setLibraryKind} options=${[['Music', 'Music / BG'], ['SE', 'Sound effects / SE']]} /><div class="mgrid">${library.length ? library.map((x) => html`<button type="button" class="mtile add" onClick=${() => addLibrary(x)}><${Icon} name="audio" size=${24} /><span>${x.name || x.key}</span></button>`) : html`<div class="empty"><p>R2 ${libraryKind} library</p><small>Library မရရှိသေးပါ</small></div>`}</div>` : html`<button type="button" class="uploadbtn" title=${H('upload')} onClick=${() => input.current?.click()}><${Icon} name="upload" size=${20} /><span>${L('upload')}</span><${Icon} name="chevron" size=${14} /></button><input ref=${input} type="file" accept=${accept} multiple hidden onChange=${(e) => onFiles(e.target.files)} /><div class="filterrow"><${Select} value=${kind} onChange=${setKind} cls="compact" options=${[['all', L('all')], ['videos', L('videos')], ['photos', L('photos')], ['audios', L('audios')]]} /><div class="spacer"></div><${IconBtn} name="grid" active=${grid} title="Grid" onClick=${() => setGrid(true)} size=${17} /><${IconBtn} name="list" active=${!grid} title="List" onClick=${() => setGrid(false)} size=${17} /></div>${preview && html`<${MediaPreview} media=${preview} />`}${preview?.kind === 'image' && html`<button type="button" class="btn ghost wide" onClick=${() => addOverlayLogo(store, transport, preview)}><${Icon} name="layers" size=${16} /><span>Add as corner logo</span></button>`}<div class=${cx('mgrid', !grid && 'list')}>${localTiles.map((m) => html`<button type="button" class=${cx('mtile', 'g-' + m.kind, preview?.id === m.id && 'on')} onClick=${() => { setPreview(m); const c = project.tracks.flatMap((t) => t.clips).find((c) => c.mediaId === m.id); if (c) store.select(c.id); }}><span class="mnote"><${Icon} name=${m.kind === 'audio' ? 'audio' : m.kind === 'video' ? 'video' : 'image'} size=${26} /></span><span class="dur">${m.name}</span></button>`)}${!localTiles.length && html`<div class="empty"><p>Local media မရှိသေးပါ</p><small>Upload Media ကိုနှိပ်ပြီး ဖိုင်ရွေးပါ</small></div>`}</div>`}
  </div></section>`;
}
// ---------------- right panel (top): Inspector — edits the selected text clip ----------------
export function Inspector({ store, fonts }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const [tab, setTab] = useState('text');
  const found = sel ? findClip(project, sel) : null, c = found ? found.clip : null;
  const [W] = RATIOS[project.size], [, H2] = RATIOS[project.size];
  const upd = (key, fn) => store.edit((d) => { const f = findClip(d, sel); if (f) fn(f.clip); }, { key: key + sel });
  const updTrack = (key, fn) => store.edit((d) => { const f = findClip(d, sel); if (f) fn(f.track); }, { key: 'track-' + key + sel });
  const updMedia = (key, fn) => store.edit((d) => { const f = findClip(d, sel), m = f?.clip?.mediaId ? d.media?.[f.clip.mediaId] : null; if (m) fn(m); }, { key: 'media-' + key + sel });
  const tabs = html`<${Tabs} value=${tab} onChange=${setTab} tabs=${[['text', L('tText'), H('tText')], ['anim', L('tAnimation'), H('tAnimation')], ['timing', L('tTiming'), H('tTiming')]]} />`;
  if (!c) return html`<aside class="panel inspector">${tabs}<div class="empty"><${Icon} name="text" size=${32} /><p>Select a text clip</p><small>Timeline မှာ စာတန်းတစ်ခု ရွေးပါ၊ ဒါမှမဟုတ် Text tool မှာ Add text နှိပ်ပါ</small></div></aside>`;
  if (c.kind === 'audio') return html`<aside class="panel inspector">${tabs}<div class="pbody scroll">
    <div class="audioins"><b>${c.name || project.media?.[c.mediaId]?.name || 'Audio clip'}</b><small>Audio clip settings</small></div>
    <${Slider} label="Track volume" tip="Audio track master volume" value=${Math.round((found.track.mixer?.volume ?? 1) * 100)} min=${0} max=${150} onChange=${(v) => updTrack('volume', (k) => { k.mixer = { ...(k.mixer || {}), volume: v / 100 }; })} unit="%" />
    <${Slider} label="Track pan" tip="Audio track pan" value=${Math.round((found.track.mixer?.pan || 0) * 100)} min=${-100} max=${100} onChange=${(v) => updTrack('pan', (k) => { k.mixer = { ...(k.mixer || {}), pan: v / 100 }; })} unit="%" />
    <${Field} label="Ducking" tip="Voice clip ပေါ်ချိန် Music အသံလျှော့"><label class="switch"><input type="checkbox" checked=${!!found.track.mixer?.ducking} onChange=${() => updTrack('ducking', (k) => { k.mixer = { ...(k.mixer || {}), ducking: !k.mixer?.ducking }; })} /><i></i></label><//>
    <${Slider} label="Gain" tip="အသံအတိုးအကျယ်" value=${Math.round((c.gain ?? 1) * 100)} min=${0} max=${200} onChange=${(v) => upd('gain', (k) => { k.gain = v / 100; })} unit="%" />
    <${Slider} label="Volume" tip="Clip volume" value=${Math.round((c.volume ?? 1) * 100)} min=${0} max=${150} onChange=${(v) => upd('volume', (k) => { k.volume = v / 100; })} unit="%" />
    <${Slider} label="Pan" tip="ဘယ်/ညာ stereo pan" value=${Math.round((c.pan ?? 0) * 100)} min=${-100} max=${100} onChange=${(v) => upd('pan', (k) => { k.pan = v / 100; })} unit="%" />
    <${Slider} label="EQ Low" tip="Bass" value=${Math.round(c.eq?.low || 0)} min=${-12} max=${12} onChange=${(v) => upd('eql', (k) => { k.eq = { ...(k.eq || {}), low: v }; })} unit="dB" />
    <${Slider} label="EQ Mid" tip="Mid" value=${Math.round(c.eq?.mid || 0)} min=${-12} max=${12} onChange=${(v) => upd('eqm', (k) => { k.eq = { ...(k.eq || {}), mid: v }; })} unit="dB" />
    <${Slider} label="EQ High" tip="Treble" value=${Math.round(c.eq?.high || 0)} min=${-12} max=${12} onChange=${(v) => upd('eqh', (k) => { k.eq = { ...(k.eq || {}), high: v }; })} unit="dB" />
    <${Field} label="Compressor" tip="Dynamic range control"><label class="switch"><input type="checkbox" checked=${!!c.compressor?.enabled} onChange=${() => upd('comp', (k) => { k.compressor = { ...(k.compressor || {}), enabled: !k.compressor?.enabled }; })} /><i></i></label><//>
    <${Slider} label="Echo" tip="Delay echo" value=${Math.round((c.echo || 0) * 100)} min=${0} max=${100} onChange=${(v) => upd('echo', (k) => { k.echo = v / 100; })} unit="%" />
    <${Slider} label="Reverb" tip="Convolution room reverb" value=${Math.round((c.reverb || 0) * 100)} min=${0} max=${100} onChange=${(v) => upd('reverb', (k) => { k.reverb = v / 100; })} unit="%" />
    <${Field} label="Bypass" tip="DSP ကို ပိတ်/ဖွင့်"><label class="switch"><input type="checkbox" checked=${!!c.bypass} onChange=${() => upd('bypass', (k) => { k.bypass = !k.bypass; })} /><i></i></label><//>
    <${Field} label="Fade in" tip="အသံဝင်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${c.fade?.in || 0} onInput=${(e) => upd('fadein', (k) => { k.fade = { ...(k.fade || {}), in: Math.max(0, +e.target.value || 0) }; })} /></label><//>
    <${Field} label="Fade out" tip="အသံထွက်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${c.fade?.out || 0} onInput=${(e) => upd('fadeout', (k) => { k.fade = { ...(k.fade || {}), out: Math.max(0, +e.target.value || 0) }; })} /></label><//>
    <${Field} label="Loop" tip="Music ကို ပြန်လည်ဖွင့်ရန်"><label class="switch"><input type="checkbox" checked=${!!c.loop} onChange=${() => upd('loop', (k) => { k.loop = !k.loop; })} /><i></i></label><//>
    <${Field} label="Start" tip="စတင်ချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0" value=${+c.start.toFixed(2)} onInput=${(e) => upd('ast', (k) => { k.start = Math.max(0, +e.target.value || 0); })} /></label><//>
    <${Field} label="Duration" tip="ကြာချိန်"><label class="xy"><em>s</em><input type="number" step="0.1" min="0.1" value=${+c.dur.toFixed(2)} onInput=${(e) => upd('adu', (k) => { k.dur = Math.max(0.1, +e.target.value || 0.1); })} /></label><//>
  </div></aside>`;
  if (c.kind === 'video' || c.kind === 'image') { const m = project.media?.[c.mediaId] || {}, a = m.adjust || {}; return html`<aside class="panel inspector">${tabs}<div class="pbody scroll">
    <div class="audioins"><b>${c.name || m.name || (c.kind === 'video' ? 'Video clip' : 'Photo clip')}</b><small>Visual clip settings</small></div>
    <${Field} label="Fit"><${Select} value=${c.fit || 'cover'} onChange=${(v) => upd('fit', (k) => { k.fit = v; })} options=${[['cover', 'Cover'], ['contain', 'Contain']]}/><//>
    <${Slider} label="Opacity" value=${c.opacity ?? 100} min=${0} max=${100} onChange=${(v) => upd('opacity', (k) => { k.opacity = v; })} unit="%" />
    ${found.track.kind === 'overlay' && html`<${Slider} label="Logo size" value=${Math.round((c.pos?.scale || .18) * 100)} min=${5} max=${60} onChange=${(v) => upd('logosize', (k) => { k.pos = { ...(k.pos || {}), scale: v / 100 }; })} unit="%" />`}
    <${Slider} label="Brightness" value=${a.brightness || 0} min=${-100} max=${100} onChange=${(v) => updMedia('brightness', (k) => { k.adjust = { ...(k.adjust || {}), brightness: v }; })} unit="%" />
    <${Slider} label="Contrast" value=${a.contrast || 0} min=${-100} max=${100} onChange=${(v) => updMedia('contrast', (k) => { k.adjust = { ...(k.adjust || {}), contrast: v }; })} unit="%" />
    <${Slider} label="Saturation" value=${a.saturation || 0} min=${-100} max=${100} onChange=${(v) => updMedia('saturation', (k) => { k.adjust = { ...(k.adjust || {}), saturation: v }; })} unit="%" />
    <${Slider} label="Blur" value=${a.blur || 0} min=${0} max=${20} onChange=${(v) => updMedia('blur', (k) => { k.adjust = { ...(k.adjust || {}), blur: v }; })} unit="px" />
    <${Field} label="Transition in"><${Select} value=${c.transition?.in || 'fade'} onChange=${(v) => upd('tin', (k) => { k.transition = { ...(k.transition || {}), in: v }; })} options=${[['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide']]}/><//>
    <${Field} label="Transition out"><${Select} value=${c.transition?.out || 'fade'} onChange=${(v) => upd('tout', (k) => { k.transition = { ...(k.transition || {}), out: v }; })} options=${[['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide']]}/><//>
  </div></aside>`; }
  const s = c.style || {}, fontOpts = fonts.includes(s.font) ? fonts : [s.font, ...fonts];
  return html`<aside class="panel inspector">${tabs}
    <div class="pbody scroll">
      ${tab === 'text' ? html`
        <div class="textbox"><textarea value=${c.text} maxlength="500" onInput=${(e) => upd('text', (k) => { k.text = e.target.value; })} placeholder="စာသား ရိုက်ပါ" /><span class="count">${c.text.length} / 500</span></div>
        <div class="reviewrow"><span>Review</span><${IconBtn} name="edit" active=${c.review === 'draft'} title="Draft" onClick=${() => upd('review-draft', (k) => { k.review = 'draft'; })} /><${IconBtn} name="check" active=${c.review === 'review'} title="Review" onClick=${() => upd('review', (k) => { k.review = 'review'; })} /><${IconBtn} name="lock" active=${!!c.locked} title="Lock" onClick=${() => upd('lock', (k) => { k.locked = !k.locked; })} /></div>
        <${Field} label="Reveal" tip="Typewriter / Word reveal"><${Select} value=${c.reveal?.mode || 'none'} onChange=${(v) => upd('reveal', (k) => { k.reveal = { ...(k.reveal || {}), mode: v }; })} options=${[['none', 'None'], ['typewriter', 'Typewriter'], ['word', 'Word reveal']]}/><//>
        <${Field} label=${L('font')} tip=${H('font')}><${Select} value=${s.font} onChange=${(v) => upd('font', (k) => { k.style.font = v; })} options=${fontOpts} /><//>
        <${Field} label=${L('style')} tip=${H('style')}>
          <div class="seg"><${IconBtn} name="bold" active=${s.bold} onClick=${() => upd('b', (k) => { k.style.bold = !k.style.bold; })} title="Bold" /><${IconBtn} name="italic" active=${s.italic} onClick=${() => upd('i', (k) => { k.style.italic = !k.style.italic; })} title="Italic" /><${IconBtn} name="underline" active=${s.underline} onClick=${() => upd('u', (k) => { k.style.underline = !k.style.underline; })} title="Underline" /></div>
          <div class="seg">${[['left', 'alignLeft'], ['center', 'alignCenter'], ['right', 'alignRight']].map(([a, ic]) => html`<${IconBtn} name=${ic} active=${s.align === a} onClick=${() => upd('al', (k) => { k.style.align = a; })} title=${a} />`)}</div>
        <//>
        <${Field} label=${L('color')} tip=${H('color')}><label class="swatch"><input type="color" value=${s.fill} onInput=${(e) => upd('fill', (k) => { k.style.fill = e.target.value; })} /><span style=${{ background: s.fill }}></span></label><//>
        <${Field} label="Fill 2 / Gradient" tip="ဒုတိယအရောင်နှင့် gradient"><label class="switch"><input type="checkbox" checked=${!!s.gradient} onChange=${() => upd('gradient', (k) => { k.style.gradient = !k.style.gradient; })} /><i></i></label><label class="swatch"><input type="color" value=${s.fill2 || s.fill} onInput=${(e) => upd('fill2', (k) => { k.style.fill2 = e.target.value; })} /><span style=${{ background: s.fill2 || s.fill }}></span></label><//>
        <${Field} label="Shadow" tip="စာသားအရိပ်"><label class="switch"><input type="checkbox" checked=${!!s.shadow?.on} onChange=${() => upd('shadow', (k) => { k.style.shadow = { ...(k.style.shadow || {}), on: !k.style.shadow?.on }; })} /><i></i></label><//>
        <${Field} label="Glow" tip="စာသားအလင်းရောင်"><label class="switch"><input type="checkbox" checked=${!!s.glow?.on} onChange=${() => upd('glow', (k) => { k.style.glow = { ...(k.style.glow || {}), on: !k.style.glow?.on }; })} /><i></i></label><//>
        <${Field} label="Effects" tip="စာသား effect ၁၅ ခု"><div class="effectgrid">${EFFECTS.map(([key, label]) => html`<button type="button" class=${cx('chip', (s.effects || []).includes(key) && 'on')} onClick=${() => upd('fx-' + key, (k) => { const a = k.style.effects || []; k.style.effects = a.includes(key) ? a.filter((x) => x !== key) : [...a, key]; })}>${label}</button>`)}</div><//>
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
        <${Field} label="Transition in" tip="Clip ဝင်လာ transition"><${Select} value=${c.transition?.in || 'none'} onChange=${(v) => upd('tin', (k) => { k.transition = { ...(k.transition || {}), in: v }; })} options=${[['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide']]}/><//>
        <${Field} label="Transition out" tip="Clip ထွက်သွား transition"><${Select} value=${c.transition?.out || 'none'} onChange=${(v) => upd('tout', (k) => { k.transition = { ...(k.transition || {}), out: v }; })} options=${[['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide']]}/><//>
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
