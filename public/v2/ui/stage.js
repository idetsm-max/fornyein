import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { createQualityGovernor } from '../engine/perf.js';
import { useStore, useTransport } from './hooks.js';
import { L, H } from './strings.js';
import { T } from './locale-core.js';
import { RATIOS, findClip, projectDuration, fmtClock } from '../engine/model.js';
import { drawFrame, bboxes, measureText } from '../engine/render.js';
import { deleteSelected, deleteClips, duplicateSelected, toggleTrack, trimClip, splitClip, addText } from '../engine/actions.js';
import { splitClips } from '../engine/timeline.js'; import { applyClipDrag } from './clip-drag.js';
import { marqueeStyle, useMarquee } from './marquee.js'; import { clipsRightOf } from './timeline-keys.js';
import { scrubSeek } from './scrub.js'; import { useTimelineScroll } from './tl-scroll.js'; import { clipVisible } from '../engine/virtual.js';
import { addMarker, markers, removeMarker } from '../engine/markers.js'; import { linkClips } from '../engine/groups.js';
import { TrackHead } from './track-head.js'; import { useTimelineKeys } from './timeline-keys.js';
import { clipMediaId } from '../engine/clip.js';
import { clipMenu, trackMenu, rulerMenu } from './menus.js';
import { toast } from './toast.js';
import { addKeyframe, removeKeyframeAt, resolvedTransform } from '../engine/keyframes.js';
import { qualityCap, snapSeconds } from '../engine/settings.js'; import { dropOnTimeline } from '../engine/timeline-drop.js';

export { RATIOS };

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------------- centre: Player (real canvas) ----------------
export function Player({ store, transport, fonts, onMenu, settings }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const { t, playing } = useTransport(transport);
  const empty = !project.tracks.some((track) => track.clips.length);
  const [w, h] = RATIOS[project.size], dur = projectDuration(project);
  const frameRef = useRef(), canvasRef = useRef(), drag = useRef(null), ovKey = useRef('');
  const [fsFallback, setFsFallback] = useState(false), [fsNative, setFsNative] = useState(false), [ctl, setCtl] = useState(true);
  const fs = fsNative || fsFallback;
  const cap = qualityCap(settings), [quality, setQuality] = useState(cap);
  const govRef = useRef(null);
  if (!govRef.current) govRef.current = createQualityGovernor();
  const toggleFs = () => {
    const el = frameRef.current;
    if (document.fullscreenElement) { document.exitFullscreen?.().catch?.(() => {}); setFsFallback(false); return; }
    if (fsFallback) { setFsFallback(false); return; }
    const req = el?.requestFullscreen?.();
    if (req?.catch) req.catch(() => setFsFallback(true));
    else if (!el?.requestFullscreen) setFsFallback(true);
  };
  const [dim, setDim] = useState({ cw: 960, ch: 540 }), [ov, setOv] = useState(null), lastPaint = useRef(0);
  useEffect(() => {
    const onFs = () => setFsNative(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  useEffect(() => {
    if (!fs) return setCtl(true);
    let timer = setTimeout(() => setCtl(false), 2500);
    const wake = () => { setCtl(true); clearTimeout(timer); timer = setTimeout(() => setCtl(false), 2500); };
    window.addEventListener('pointermove', wake);
    return () => { clearTimeout(timer); window.removeEventListener('pointermove', wake); };
  }, [fs]);
  const [safe, setSafe] = useState(false), [zoomPct, setZoomPct] = useState(100), [guides, setGuides] = useState({ v: false, h: false });
  useEffect(() => { const onZoom = (e) => setZoomPct(Math.min(200, Math.max(25, +e.detail || 100))); window.addEventListener('fornyein:zoom', onZoom); return () => window.removeEventListener('fornyein:zoom', onZoom); }, []);

  useEffect(() => {                                              // canvas resolution follows the frame size on screen
    const el = frameRef.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      setDim((d) => { const cw = Math.max(64, Math.round(r.width * dpr)), ch = Math.max(64, Math.round(r.height * dpr)); return d.cw === cw && d.ch === ch ? d : { cw, ch }; }); };
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, [project.size]);

  useEffect(() => {                                              // draw + place the selection box
    const cv = canvasRef.current; if (!cv) return;
    const now = performance.now(); if (playing && now - lastPaint.current < 1000 / 30) return; lastPaint.current = now;
    const bw = Math.max(64, Math.round(dim.cw * quality)), bh = Math.max(64, Math.round(dim.ch * quality));
    if (cv.width !== bw) cv.width = bw; if (cv.height !== bh) cv.height = bh;
    const ctx = cv.getContext('2d');
    const drawStart = performance.now();
    drawFrame(ctx, bw, bh, project, t);
    const nextQuality = govRef.current.sample({ ms: performance.now() - drawStart });
    const capped = Math.min(nextQuality, cap);
    if (capped !== quality) setQuality(capped);
    let b = null; const f = sel ? findClip(project, sel) : null;
    const kf = f ? resolvedTransform(f.clip, t) : null, view = f ? { ...f.clip, pos: { ...f.clip.pos, x: kf.x, y: kf.y, scale: kf.scale }, opacity: kf.opacity } : null;
    if (f && f.clip.kind === 'text') b = bboxes.get(sel) || measureText(ctx, dim.cw, dim.ch, view);
    else if (f) { const sc = Math.min(1, kf.scale); b = { cx: kf.x / 100 * dim.cw, cy: kf.y / 100 * dim.ch, w: dim.cw * sc, h: dim.ch * sc, rot: f.clip.pos?.rot || 0 }; }
    const key = b ? [b.cx / b.cw, b.cy / b.ch, b.w / b.cw, b.h / b.ch, b.rot].map((x) => x.toFixed(4)).join(',') : '';
    if (key !== ovKey.current) { ovKey.current = key; setOv(b ? { x: b.cx / b.cw * 100, y: b.cy / b.ch * 100, w: b.w / b.cw * 100, h: b.h / b.ch * 100, rot: b.rot } : null); }
  }, [project, t, dim, sel, fonts, cap]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && (fsFallback || document.fullscreenElement)) { document.exitFullscreen?.().catch?.(() => {}); setFsFallback(false); return; }
      if (e.key.toLowerCase() !== 'f' || /input|textarea/i.test(e.target.tagName) || e.ctrlKey || e.metaKey) return;
      e.preventDefault(); toggleFs();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fsFallback]);
  const down = (e) => {                                          // drag the selected text on the frame
    const f = sel ? findClip(project, sel) : null; if (!f || f.track.locked) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode: 'move', x: e.clientX, y: e.clientY, px: f.clip.pos.x, py: f.clip.pos.y, rc: frameRef.current.getBoundingClientRect() };
  };
  const handleDown = (e, mode) => { const f = sel ? findClip(project, sel) : null; if (!f || f.track.locked) return; e.stopPropagation(); e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); const rc = frameRef.current.getBoundingClientRect(); drag.current = { mode, x: e.clientX, y: e.clientY, rc, scale: f.clip.pos.scale || 1, rot: f.clip.pos.rot || 0, cx: rc.left + rc.width * f.clip.pos.x / 100, cy: rc.top + rc.height * f.clip.pos.y / 100 }; };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    if (d.mode === 'resize') { const scale = +clamp(d.scale + (e.clientX - d.x) / d.rc.width * 2, .25, 4).toFixed(3); store.edit((dr) => { const g = findClip(dr, sel); if (g) g.clip.pos.scale = scale; }, { key: 'scale:' + sel }); return; }
    if (d.mode === 'rotate') { const a0 = Math.atan2(d.y - d.cy, d.x - d.cx), a1 = Math.atan2(e.clientY - d.cy, e.clientX - d.cx); const rot = +((d.rot + (a1 - a0) * 180 / Math.PI + 540) % 360 - 180).toFixed(1); store.edit((dr) => { const g = findClip(dr, sel); if (g) g.clip.pos.rot = rot; }, { key: 'rotate:' + sel }); return; }
    let nx = d.px + (e.clientX - d.x) / d.rc.width * 100, ny = d.py + (e.clientY - d.y) / d.rc.height * 100;
    const gv = Math.abs(nx - 50) < 1.2, gh = Math.abs(ny - 50) < 1.2;
    setGuides((g) => (g.v === gv && g.h === gh ? g : { v: gv, h: gh }));
    if (gv) nx = 50; if (gh) ny = 50;
    nx = +clamp(nx, 0, 100).toFixed(2); ny = +clamp(ny, 0, 100).toFixed(2);
    store.edit((dr) => { const g = findClip(dr, sel); if (g) { g.clip.pos.x = nx; g.clip.pos.y = ny; } }, { key: 'move:' + sel });
  };
  const up = () => { drag.current = null; setGuides((g) => (g.v || g.h ? { v: false, h: false } : g)); };

  return html`<section class="panel player" tabIndex=${0} aria-label="Preview stage">
    <div class="stagewrap">
      <div class=${cx('frame', fsFallback && 'fsfallback')} ref=${frameRef} style=${{ width: `min(100cqw, calc(100cqh * ${w / h}))`, aspectRatio: `${w} / ${h}`, transform: `scale(${zoomPct / 100})` }} onPointerDown=${(e) => { if (e.target === e.currentTarget || e.target === canvasRef.current) store.select(null); }} onContextMenu=${(e) => { e.preventDefault(); if (sel) onMenu?.(clipMenu({ store, transport, clipId: sel, x: e.clientX, y: e.clientY })); }} onDragOver=${(e) => { if (e.dataTransfer.types.includes('text/x-fornyein-media')) e.preventDefault(); }} onDrop=${(e) => { e.preventDefault(); const meta = project.media?.[e.dataTransfer.getData('text/x-fornyein-media')]; if (meta) addMediaAt(store, transport, meta, transport.t); }}>
        <canvas ref=${canvasRef} class="stagecanvas" role="img" aria-label="Video preview canvas"></canvas>
        ${empty && html`<div class="stageempty"><div class="emptycard"><b>ကဗျာ ဗီဒီယို စတင်ရအောင်</b><ol><li>မီဒီယာ ထည့်ပါ — ဖတ်သံ သို့မဟုတ် ပုံ</li><li>စာတန်း ထည့်ပါ — ကဗျာကို paste လုပ်နိုင်</li><li>Export နှိပ်ပြီး သိမ်းပါ</li></ol><button type="button" class="btn primary" onClick=${() => { addText(store, transport); toast('စာတန်း ထည့်ပြီး', 'ok'); }}>စာတန်း ထည့်ပါ</button></div></div>`}
        ${safe && html`<div class="safearea"><div class="sa outer"></div><div class="sa inner"></div></div>`}
        ${guides.v && html`<div class="guide v"></div>`}
        ${guides.h && html`<div class="guide h"></div>`}
        ${ov && html`<div class="sel" style=${{ left: (ov.x - ov.w / 2) + '%', top: (ov.y - ov.h / 2) + '%', width: ov.w + '%', height: ov.h + '%', transform: `rotate(${ov.rot}deg)` }}
          onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onDblClick=${() => document.querySelector('.inspector textarea')?.focus()}>
          <div class="floatbar" onPointerDown=${(e) => e.stopPropagation()}>
            <${IconBtn} name="copy" size=${16} title="Duplicate · Ctrl+D" onClick=${() => duplicateSelected(store)} /><${IconBtn} name="trash" size=${16} title="Delete" onClick=${() => deleteSelected(store)} /><${IconBtn} name="marker" size=${16} title="Add keyframe at playhead" onClick=${() => { store.edit((d) => { const g = findClip(d, sel); if (g) addKeyframe(g.clip, transport.t); }, { key: 'kf-' + sel }); toast('Keyframe ထည့်ပြီး', 'ok'); }} />
          </div>
          ${['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((p) => html`<i class=${'h ' + p} onPointerDown=${(e) => handleDown(e, 'resize')}></i>`)}<i class="rotator" onPointerDown=${(e) => handleDown(e, 'rotate')}></i></div>`}
        ${fs && html`<div class=${cx('fsctl', !ctl && 'hide')} role="toolbar" aria-label="Fullscreen controls" onPointerDown=${(e) => e.stopPropagation()}>
          <button type="button" class="playbtn" title=${(playing ? 'Pause' : 'Play') + ' · Space'} onClick=${() => transport.toggle()}><${Icon} name=${playing ? 'pause' : 'play'} size=${20} /></button>
          <span class="tcode"><b>${fmtClock(t)}</b> / ${fmtClock(dur)}</span>
          <input class="fsrange" type="range" min="0" max=${Math.max(dur, .01)} step="0.01" value=${t} aria-label="Seek" onInput=${(e) => transport.seek(+e.target.value)} />
          <${IconBtn} name="close" size=${18} title="ထွက် · Esc" onClick=${toggleFs} />
        </div>`}
        ${dur === 0 && html`<div class="hint">Text tool မှာ <b>Add text</b> နှိပ်ပါ</div>`}
      </div>
    </div>
    <div class="transport" role="toolbar" aria-label="Playback">
      <span class="tcode"><b>${fmtClock(t)}</b> / ${fmtClock(dur)}</span>
      <div class="tbtns">
        <${IconBtn} name="prev" size=${20} title="Start" onClick=${() => transport.seek(0)} />
        <button type="button" class="playbtn" title=${(playing ? 'Pause' : 'Play') + ' · Space'} onClick=${() => transport.toggle()}><${Icon} name=${playing ? 'pause' : 'play'} size=${22} /></button>
        <${IconBtn} name="next" size=${20} title="End" onClick=${() => transport.seek(dur)} />
      </div>
      <div class="tright">
        <${Select} value=${project.size} onChange=${(v) => store.edit((d) => { d.size = v; })} cls="compact" title="Aspect ratio" options=${Object.keys(RATIOS)} />
        <${IconBtn} name="safe" size=${18} title="Safe area" onClick=${() => setSafe((v) => !v)} />
        <button type="button" class="zoomchip" title="Preview zoom out" onClick=${() => setZoomPct((z) => Math.max(25, z - 25))}>−</button>
        <button type="button" class="zoomchip" title="Preview zoom reset" onClick=${() => setZoomPct(100)}>${zoomPct}%</button>
        <button type="button" class="zoomchip" title="Preview zoom in" onClick=${() => setZoomPct((z) => Math.min(200, z + 25))}>+</button>
        ${quality < 1 && html`<span class="zoomchip qbadge" title=${T('Preview quality drops automatically when frames run slow; export stays full quality', 'Frame နှေးရင် preview အရည်အသွေး အလိုအလျောက် ကျမည်၊ export က အပြည့်အရည်အသွေး')}>${Math.round(quality * 100)}%</span>`}
        <${IconBtn} name="maximize" size=${18} title=${L('fullscreen') + ' · F'} onClick=${toggleFs} />
      </div>
    </div>
  </section>`;
}

// ---------------- bottom: Timeline (Phase 2 clip operations) ----------------
function Wave({ peaks = [], bars }) { const n = Math.max(4, bars || peaks.length || 48), src = peaks.length || 48; const d = Array.from({ length: n }, (_, i) => { const v = peaks[Math.floor(i / n * src)] ?? (0.2 + Math.abs(Math.sin(i * .73)) * .6); const x = i / n * 100; return `M${x.toFixed(2)} ${(50 - v * 44).toFixed(1)}V${(50 + v * 44).toFixed(1)}`; }).join(''); return html`<svg class="wave" viewBox="0 0 100 100" preserveAspectRatio="none"><path d=${d} /></svg>`; }
function Playhead({ transport, pps }) { const { t } = useTransport(transport); return html`<div class="playhead" style=${{ left: (t * pps) + 'px' }}><i></i></div>`; }
export function Timeline({ store, transport, pps, setPps, onMenu, onMixer, audio, settings }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const canUndo = useStore(store, (s) => s.canUndo), canRedo = useStore(store, (s) => s.canRedo);
  const [selectedIds, setSelectedIds] = useState(() => sel ? [sel] : []), [snap, setSnap] = useState(() => settings?.snap !== false), [drop, setDrop] = useState(null);
  const snapSec = snapSeconds(settings, pps);
  const [razor, setRazor] = useState(false), [renaming, setRenaming] = useState(null); useTransport(transport);
  const scrollRef = useRef(), gesture = useRef(null), scrubbing = useRef(false), scrubAt = useRef(0), view = useTimelineScroll(scrollRef, pps);
  useEffect(() => { if (sel && !selectedIds.includes(sel)) setSelectedIds([sel]); }, [sel]);
  const dur = Math.max(30, projectDuration(project) + 5), width = Math.round(dur * pps);
  const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find((s) => s * pps >= 70) || 300;
  const marks = []; for (let i = 0; i * step <= dur; i++) marks.push(i * step);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}${step < 1 ? '.5' : ''}`;
  const seekFromEvent = (e) => scrubSeek({ transport, project, pps, snap, scrollEl: scrollRef.current, clientX: e.clientX, audio, last: scrubAt });
  const pick = (e, c) => { e.stopPropagation(); const multi = e.shiftKey || e.ctrlKey || e.metaKey; const ids = multi ? (selectedIds.includes(c.id) ? selectedIds.filter((x) => x !== c.id) : [...selectedIds, c.id]) : [c.id]; setSelectedIds(ids); store.select(c.id); transport.seek(c.start + .01); };
  const downClip = (e, c) => { pick(e, c); const r = e.currentTarget.getBoundingClientRect(); if (razor) { splitClips(store, [c.id], c.start + (e.clientX - r.left) / pps, { snap }); return; } const edge = e.clientX - r.left < 9 ? 'left' : r.right - e.clientX < 9 ? 'right' : 'move'; gesture.current = { id: c.id, edge, x: e.clientX, start: c.start, end: c.start + c.dur, pps, shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey, applied: 0 }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const moveClipEvent = (e) => { const g = gesture.current; if (g) applyClipDrag(store, g, e.clientX, snap, snapSec); };
  const upClip = () => { gesture.current = null; };
  const split = () => { const id = selectedIds[0] || sel; if (id) splitClip(store, id, transport.t, { snap, snapSec }); };
  const timeAt = (e) => { const el = scrollRef.current, r = el.getBoundingClientRect(); return Math.max(0, (e.clientX - r.left + el.scrollLeft) / pps); };
  const dropOnTrack = (e, trackId) => { e.preventDefault(); dropOnTimeline(store, transport, project, trackId, timeAt(e), e.dataTransfer); setDrop(null); };
  const remove = (ripple = false) => { deleteClips(store, selectedIds.length ? selectedIds : [sel], { ripple }); setSelectedIds([]); };
  useEffect(() => transport.subscribe(() => { if (!transport.playing) return; const el = scrollRef.current, x = transport.t * pps; if (el && (x > el.scrollLeft + el.clientWidth - 40 || x < el.scrollLeft)) el.scrollLeft = Math.max(0, x - 60); }), [pps]);
  const zoomVal = Math.round(100 * Math.log(pps / 10) / Math.log(20));
  const marquee = useMarquee({ containerRef: scrollRef, onSelect: (ids) => { setSelectedIds(ids); store.select(ids[ids.length - 1]); } });
  const selectRight = () => { const ids = clipsRightOf(project, transport.t); if (ids.length) { setSelectedIds(ids); store.select(ids[ids.length - 1]); } };
  const fit = () => { const el = scrollRef.current; if (el) setPps(clamp((el.clientWidth - 24) / Math.max(1, projectDuration(project)), 10, 200)); };
  useTimelineKeys({ store, transport, setRazor, setSnap, onFit: fit, onSelectRight: selectRight });
  return html`<section class="panel timeline" id="timeline" tabIndex=${-1} aria-label="Timeline"><div class="tltools">
    <${IconBtn} name="undo" size=${17} title=${L('undo') + ' · Ctrl+Z'} disabled=${!canUndo} onClick=${() => store.undo()} /><${IconBtn} name="redo" size=${17} title=${L('redo') + ' · Ctrl+Y'} disabled=${!canRedo} onClick=${() => store.redo()} /><span class="vsep"></span>
    <${IconBtn} name="scissors" size=${17} title="Split · Ctrl+B" disabled=${!selectedIds.length} onClick=${split} /><${IconBtn} name="trash" size=${17} title="Delete · Del" disabled=${!selectedIds.length} onClick=${() => remove(false)} /><${IconBtn} name="crop" size=${17} title="Ripple delete · Shift+Del" disabled=${!selectedIds.length} onClick=${() => remove(true)} /><${IconBtn} name="copy" size=${17} title="Duplicate · Ctrl+D" disabled=${selectedIds.length !== 1} onClick=${() => duplicateSelected(store)} /><${IconBtn} name="magnet" size=${17} title="Snap" active=${snap} onClick=${() => setSnap(!snap)} /><span class="vsep"></span><${IconBtn} name="scissors" size=${17} title="Razor · B" active=${razor} onClick=${() => setRazor((v) => !v)} /><${IconBtn} name="frame" size=${17} title="Zoom to fit · Shift+Z" onClick=${fit} /><${IconBtn} name="link" size=${17} title="Link clips" disabled=${selectedIds.length < 2} onClick=${() => linkClips(store, selectedIds)} /><${IconBtn} name="marker" size=${17} title="Add marker · M" onClick=${() => addMarker(store, transport.t)} /><${IconBtn} name="repeat" size=${17} title="Loop in–out" active=${!!transport.range.loop} onClick=${() => transport.setRange({ loop: !transport.range.loop })} />
    <${IconBtn} name="mixer" size=${17} title="Mixer · Ctrl+Shift+M" onClick=${() => onMixer?.()} /><div class="spacer"></div><${IconBtn} name="zoomOut" size=${17} title="Zoom out" onClick=${() => setPps(clamp(pps / 1.4, 10, 200))} /><input class="range zoomrange" type="range" min="0" max="100" value=${zoomVal} style=${{ '--p': zoomVal + '%' }} onInput=${(e) => setPps(10 * Math.pow(20, +e.target.value / 100))} /><${IconBtn} name="zoomIn" size=${17} title="Zoom in" onClick=${() => setPps(clamp(pps * 1.4, 10, 200))} />
  </div><div class="tlbody"><div class="tlheads"><div class="rulerhead"></div>${project.tracks.map((t) => html`<${TrackHead} store=${store} track=${t} renaming=${renaming} setRenaming=${setRenaming} onMenu=${(m) => onMenu?.(trackMenu({ store, ...m }))} />`)}</div><div class="tlscroll" ref=${scrollRef}><div class="tlinner" style=${{ width: width + 'px' }} onPointerDown=${marquee.start} onPointerMove=${marquee.move} onPointerUp=${marquee.end}>
    <div class="ruler" onPointerDown=${(e) => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromEvent(e); }} onPointerMove=${(e) => { if (scrubbing.current) seekFromEvent(e); }} onPointerUp=${() => { scrubbing.current = false; }} onContextMenu=${(e) => { e.preventDefault(); onMenu?.(rulerMenu({ store, transport, x: e.clientX, y: e.clientY, onFit: fit })); }}>${transport.range.in != null && transport.range.out != null && html`<div class="range" style=${{ left: (transport.range.in * pps) + 'px', width: Math.max(0, transport.range.out - transport.range.in) * pps + 'px' }} />`}${marks.map((s) => html`<span style=${{ left: (s * pps) + 'px' }}>${fmt(s)}</span>`)}${markers(project).map((m) => html`<div class="marker" style=${{ left: (m.t * pps) + 'px' }} title=${m.label || 'Marker'} onClick=${(e) => { e.stopPropagation(); transport.seek(m.t); }} onContextMenu=${(e) => { e.preventDefault(); e.stopPropagation(); removeMarker(store, m.id); }} />`)}</div>
    ${project.tracks.map((t) => html`<div class=${cx('trow', t.kind, t.height && `h-${t.height}`, t.hidden && 'hidden', t.locked && 'locked')} onDragOver=${(e) => { if (!e.dataTransfer.types.includes('text/x-fornyein-media')) return; e.preventDefault(); setDrop({ time: timeAt(e), trackId: t.id }); }} onDragLeave=${() => setDrop(null)} onDrop=${(e) => dropOnTrack(e, t.id)} onPointerDown=${(e) => { if (e.target === e.currentTarget) { setSelectedIds([]); store.select(null); seekFromEvent(e); } }}>${t.clips.filter((c) => clipVisible(c, pps, view.left, view.width)).map((c) => html`<div data-id=${c.id} class=${cx('clip', c.kind === 'text' ? 'purple' : c.kind === 'audio' ? 'green' : 'film', c.caption && 'caption', selectedIds.includes(c.id) && 'sel')} style=${{ left: (c.start * pps) + 'px', width: Math.max(8, c.dur * pps) + 'px', cursor: t.locked ? 'not-allowed' : 'grab' }} title=${c.text || c.name || ''} tabIndex=${0} role="button" aria-label=${(c.text || c.name || c.kind) + ' clip'} onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.select(c.id); transport.seek(c.start); } }} onPointerDown=${(e) => downClip(e, c)} onPointerMove=${moveClipEvent} onPointerUp=${upClip} onContextMenu=${(e) => { e.preventDefault(); e.stopPropagation(); store.select(c.id); onMenu?.(clipMenu({ store, transport, clipId: c.id, x: e.clientX, y: e.clientY })); }} onDblClick=${() => { store.select(c.id); splitClip(store, c.id, transport.t, { snap }); }}>${c.kind === 'audio' && html`<${Wave} peaks=${project.media?.[clipMediaId(c)]?.peaks} bars=${Math.max(8, Math.min(48, Math.round(c.dur * pps / 4)))} />`}<span class="clabel">${c.kind === 'text' ? html`<${Icon} name="text" size=${13} />` : ''}${(c.text || '').split('\n')[0]}</span>${(c.keys || []).map((k) => html`<i class=${cx('kfdot', Math.abs(k.t - transport.t) < .05 && 'on')} style=${{ left: ((k.t - c.start) * pps) + 'px' }} title=${'Keyframe ' + k.t.toFixed(2) + 's (Shift+click to delete)'} onPointerDown=${(e) => { e.stopPropagation(); if (e.shiftKey) store.edit((d) => { const g = findClip(d, c.id); if (g) removeKeyframeAt(g.clip, k.t); }, { key: 'kf-del-' + c.id }); else { store.select(c.id); transport.seek(k.t); } }}></i>`)}</div>`)}</div>`)}
    ${marquee.box && html`<div class="marquee" style=${marqueeStyle(marquee.box)} />`}
    ${drop && html`<div class="dropline" style=${{ left: (drop.time * pps) + 'px' }}></div>`}
    <${Playhead} transport=${transport} pps=${pps} /></div></div></div></section>`;
}
