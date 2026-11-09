import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { useStore, useTransport } from './hooks.js';
import { L, H } from './strings.js';
import { RATIOS, findClip, projectDuration, fmtClock } from '../engine/model.js';
import { drawFrame, bboxes, measureText } from '../engine/render.js';
import { deleteSelected, deleteClips, duplicateSelected, toggleTrack, moveClip, trimClip, splitClip } from '../engine/actions.js';

export { RATIOS };

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------------- centre: Player (real canvas) ----------------
export function Player({ store, transport, fonts }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const { t, playing } = useTransport(transport);
  const [w, h] = RATIOS[project.size], dur = projectDuration(project);
  const frameRef = useRef(), canvasRef = useRef(), drag = useRef(null), ovKey = useRef('');
  const [dim, setDim] = useState({ cw: 960, ch: 540 }), [ov, setOv] = useState(null);

  useEffect(() => {                                              // canvas resolution follows the frame size on screen
    const el = frameRef.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      setDim((d) => { const cw = Math.max(64, Math.round(r.width * dpr)), ch = Math.max(64, Math.round(r.height * dpr)); return d.cw === cw && d.ch === ch ? d : { cw, ch }; }); };
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, [project.size]);

  useEffect(() => {                                              // draw + place the selection box
    const cv = canvasRef.current; if (!cv) return;
    if (cv.width !== dim.cw) cv.width = dim.cw; if (cv.height !== dim.ch) cv.height = dim.ch;
    const ctx = cv.getContext('2d'); drawFrame(ctx, dim.cw, dim.ch, project, t);
    let b = null; const f = sel ? findClip(project, sel) : null;
    if (f && f.clip.kind === 'text') b = bboxes.get(sel) || measureText(ctx, dim.cw, dim.ch, f.clip);
    const key = b ? [b.cx / b.cw, b.cy / b.ch, b.w / b.cw, b.h / b.ch, b.rot].map((x) => x.toFixed(4)).join(',') : '';
    if (key !== ovKey.current) { ovKey.current = key; setOv(b ? { x: b.cx / b.cw * 100, y: b.cy / b.ch * 100, w: b.w / b.cw * 100, h: b.h / b.ch * 100, rot: b.rot } : null); }
  }, [project, t, dim, sel, fonts]);

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
    if (Math.abs(nx - 50) < 1.2) nx = 50; if (Math.abs(ny - 50) < 1.2) ny = 50;
    nx = +clamp(nx, 0, 100).toFixed(2); ny = +clamp(ny, 0, 100).toFixed(2);
    store.edit((dr) => { const g = findClip(dr, sel); if (g) { g.clip.pos.x = nx; g.clip.pos.y = ny; } }, { key: 'move:' + sel });
  };
  const up = () => { drag.current = null; };

  return html`<section class="panel player">
    <div class="stagewrap">
      <div class="frame" ref=${frameRef} style=${{ width: `min(100cqw, calc(100cqh * ${w / h}))`, aspectRatio: `${w} / ${h}` }} onPointerDown=${(e) => { if (e.target === e.currentTarget || e.target === canvasRef.current) store.select(null); }}>
        <canvas ref=${canvasRef} class="stagecanvas"></canvas>
        ${ov && html`<div class="sel" style=${{ left: (ov.x - ov.w / 2) + '%', top: (ov.y - ov.h / 2) + '%', width: ov.w + '%', height: ov.h + '%', transform: `rotate(${ov.rot}deg)` }}
          onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onDblClick=${() => document.querySelector('.inspector textarea')?.focus()}>
          <div class="floatbar" onPointerDown=${(e) => e.stopPropagation()}>
            <${IconBtn} name="copy" size=${16} title="Duplicate · Ctrl+D" onClick=${() => duplicateSelected(store)} /><${IconBtn} name="trash" size=${16} title="Delete" onClick=${() => deleteSelected(store)} />
          </div>
          ${['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((p) => html`<i class=${'h ' + p} onPointerDown=${(e) => handleDown(e, 'resize')}></i>`)}<i class="rotator" onPointerDown=${(e) => handleDown(e, 'rotate')}></i></div>`}
        ${dur === 0 && html`<div class="hint">Text tool မှာ <b>Add text</b> နှိပ်ပါ</div>`}
      </div>
    </div>
    <div class="transport">
      <span class="tcode"><b>${fmtClock(t)}</b> / ${fmtClock(dur)}</span>
      <div class="tbtns">
        <${IconBtn} name="prev" size=${20} title="Start" onClick=${() => transport.seek(0)} />
        <button type="button" class="playbtn" title=${(playing ? 'Pause' : 'Play') + ' · Space'} onClick=${() => transport.toggle()}><${Icon} name=${playing ? 'pause' : 'play'} size=${22} /></button>
        <${IconBtn} name="next" size=${20} title="End" onClick=${() => transport.seek(dur)} />
      </div>
      <div class="tright">
        <${Select} value=${project.size} onChange=${(v) => store.edit((d) => { d.size = v; })} cls="compact" title="Aspect ratio" options=${Object.keys(RATIOS)} />
        <${IconBtn} name="maximize" size=${18} title=${L('fullscreen')} />
      </div>
    </div>
  </section>`;
}

// ---------------- bottom: Timeline (Phase 2 clip operations) ----------------
const TRACK_UI = { text: ['text', 'trackText'], video: ['video', 'trackVideo'], overlay: ['layers', 'trackOverlay'], audio: ['audio', 'trackAudio'] };
function Wave({ peaks = [] }) { const n = peaks.length || 48; const d = Array.from({ length: n }, (_, i) => { const v = peaks[i] ?? (0.2 + Math.abs(Math.sin(i * .73)) * .6); const x = i / n * 100; return `M${x.toFixed(2)} ${(50 - v * 44).toFixed(1)}V${(50 + v * 44).toFixed(1)}`; }).join(''); return html`<svg class="wave" viewBox="0 0 100 100" preserveAspectRatio="none"><path d=${d} /></svg>`; }
function Playhead({ transport, pps }) { const { t } = useTransport(transport); return html`<div class="playhead" style=${{ left: (t * pps) + 'px' }}><i></i></div>`; }
export function Timeline({ store, transport, pps, setPps }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const canUndo = useStore(store, (s) => s.canUndo), canRedo = useStore(store, (s) => s.canRedo);
  const [selectedIds, setSelectedIds] = useState(() => sel ? [sel] : []), [snap, setSnap] = useState(true);
  const scrollRef = useRef(), gesture = useRef(null), scrubbing = useRef(false);
  useEffect(() => { if (sel && !selectedIds.includes(sel)) setSelectedIds([sel]); }, [sel]);
  const dur = Math.max(30, projectDuration(project) + 5), width = Math.round(dur * pps);
  const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find((s) => s * pps >= 70) || 300;
  const marks = []; for (let i = 0; i * step <= dur; i++) marks.push(i * step);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}${step < 1 ? '.5' : ''}`;
  const seekFromEvent = (e) => { const el = scrollRef.current, r = el.getBoundingClientRect(); transport.seek(Math.max(0, (e.clientX - r.left + el.scrollLeft) / pps)); };
  const pick = (e, c) => { e.stopPropagation(); const multi = e.shiftKey || e.ctrlKey || e.metaKey; const ids = multi ? (selectedIds.includes(c.id) ? selectedIds.filter((x) => x !== c.id) : [...selectedIds, c.id]) : [c.id]; setSelectedIds(ids); store.select(c.id); transport.seek(c.start + .01); };
  const downClip = (e, c) => { pick(e, c); const r = e.currentTarget.getBoundingClientRect(); const edge = e.clientX - r.left < 9 ? 'left' : r.right - e.clientX < 9 ? 'right' : 'move'; gesture.current = { id: c.id, edge, x: e.clientX, start: c.start, end: c.start + c.dur, pps }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const moveClipEvent = (e) => { const g = gesture.current; if (!g) return; const delta = (e.clientX - g.x) / g.pps; if (g.edge === 'move') moveClip(store, g.id, g.start + delta, { snap, key: 'tlmove' }); else trimClip(store, g.id, g.edge, g.edge === 'left' ? g.start + delta : g.end + delta, { snap }); };
  const upClip = () => { gesture.current = null; };
  const split = () => { const id = selectedIds[0] || sel; if (id) splitClip(store, id, transport.t, { snap }); };
  const remove = (ripple = false) => { deleteClips(store, selectedIds.length ? selectedIds : [sel], { ripple }); setSelectedIds([]); };
  useEffect(() => transport.subscribe(() => { if (!transport.playing) return; const el = scrollRef.current, x = transport.t * pps; if (el && (x > el.scrollLeft + el.clientWidth - 40 || x < el.scrollLeft)) el.scrollLeft = Math.max(0, x - 60); }), [pps]);
  const zoomVal = Math.round(100 * Math.log(pps / 10) / Math.log(20));
  return html`<section class="panel timeline"><div class="tltools">
    <${IconBtn} name="undo" size=${17} title=${L('undo') + ' · Ctrl+Z'} disabled=${!canUndo} onClick=${() => store.undo()} /><${IconBtn} name="redo" size=${17} title=${L('redo') + ' · Ctrl+Y'} disabled=${!canRedo} onClick=${() => store.redo()} /><span class="vsep"></span>
    <${IconBtn} name="scissors" size=${17} title="Split · Ctrl+B" disabled=${!selectedIds.length} onClick=${split} /><${IconBtn} name="trash" size=${17} title="Delete · Del" disabled=${!selectedIds.length} onClick=${() => remove(false)} /><${IconBtn} name="crop" size=${17} title="Ripple delete · Shift+Del" disabled=${!selectedIds.length} onClick=${() => remove(true)} /><${IconBtn} name="copy" size=${17} title="Duplicate · Ctrl+D" disabled=${selectedIds.length !== 1} onClick=${() => duplicateSelected(store)} /><${IconBtn} name="magnet" size=${17} title="Snap" active=${snap} onClick=${() => setSnap(!snap)} />
    <div class="spacer"></div><${IconBtn} name="zoomOut" size=${17} title="Zoom out" onClick=${() => setPps(clamp(pps / 1.4, 10, 200))} /><input class="range zoomrange" type="range" min="0" max="100" value=${zoomVal} style=${{ '--p': zoomVal + '%' }} onInput=${(e) => setPps(10 * Math.pow(20, +e.target.value / 100))} /><${IconBtn} name="zoomIn" size=${17} title="Zoom in" onClick=${() => setPps(clamp(pps * 1.4, 10, 200))} />
  </div><div class="tlbody"><div class="tlheads"><div class="rulerhead"></div>${project.tracks.map((t) => { const [icon, key] = TRACK_UI[t.kind] || ['layers', 'trackOverlay']; return html`<div class=${cx('thead', t.kind)}><${IconBtn} name=${t.hidden ? 'eyeOff' : 'eye'} size=${16} onClick=${() => toggleTrack(store, t.id, 'hidden')} title="Show / hide" /><${IconBtn} name=${t.locked ? 'lock' : 'unlock'} size=${16} onClick=${() => toggleTrack(store, t.id, 'locked')} title="Lock" active=${t.locked} /><span class="tname" title=${H(key)}><${Icon} name=${icon} size=${15} /><span>${L(key)}</span></span></div>`; })}</div><div class="tlscroll" ref=${scrollRef}><div class="tlinner" style=${{ width: width + 'px' }}>
    <div class="ruler" onPointerDown=${(e) => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromEvent(e); }} onPointerMove=${(e) => { if (scrubbing.current) seekFromEvent(e); }} onPointerUp=${() => { scrubbing.current = false; }}>${marks.map((s) => html`<span style=${{ left: (s * pps) + 'px' }}>${fmt(s)}</span>`)}</div>
    ${project.tracks.map((t) => html`<div class=${cx('trow', t.kind, t.hidden && 'hidden', t.locked && 'locked')} onPointerDown=${(e) => { if (e.target === e.currentTarget) { setSelectedIds([]); store.select(null); seekFromEvent(e); } }}>${t.clips.map((c) => html`<div class=${cx('clip', c.kind === 'text' ? 'purple' : c.kind === 'audio' ? 'green' : 'film', selectedIds.includes(c.id) && 'sel')} style=${{ left: (c.start * pps) + 'px', width: Math.max(8, c.dur * pps) + 'px', cursor: t.locked ? 'not-allowed' : 'grab' }} title=${c.text || c.name || ''} onPointerDown=${(e) => downClip(e, c)} onPointerMove=${moveClipEvent} onPointerUp=${upClip} onDblClick=${() => { store.select(c.id); splitClip(store, c.id, transport.t, { snap }); }}>${c.kind === 'audio' && html`<${Wave} peaks=${project.media?.[c.mediaId]?.peaks} />`}<span class="clabel">${c.kind === 'text' ? html`<${Icon} name="text" size=${13} />` : ''}${(c.text || '').split('\n')[0]}</span></div>`)}</div>`)}
    <${Playhead} transport=${transport} pps=${pps} /></div></div></div></section>`;
}
