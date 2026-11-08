import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { useStore, useTransport } from './hooks.js';
import { L, H } from './strings.js';
import { RATIOS, findClip, projectDuration, fmtClock } from '../engine/model.js';
import { drawFrame, bboxes, measureText } from '../engine/render.js';
import { deleteSelected, duplicateSelected, toggleTrack } from '../engine/actions.js';

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
    drag.current = { x: e.clientX, y: e.clientY, px: f.clip.pos.x, py: f.clip.pos.y, rc: frameRef.current.getBoundingClientRect() };
  };
  const move = (e) => {
    const d = drag.current; if (!d) return;
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
          onPointerDown=${down} onPointerMove=${move} onPointerUp=${up}>
          <div class="floatbar" onPointerDown=${(e) => e.stopPropagation()}>
            <${IconBtn} name="copy" size=${16} title="Duplicate · Ctrl+D" onClick=${() => duplicateSelected(store)} /><${IconBtn} name="trash" size=${16} title="Delete" onClick=${() => deleteSelected(store)} />
          </div>
          ${['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((p) => html`<i class=${'h ' + p}></i>`)}</div>`}
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

// ---------------- bottom: Timeline (real clips; drag / trim / split arrive in phase 2) ----------------
const TRACK_UI = { text: ['text', 'trackText'], video: ['video', 'trackVideo'], overlay: ['layers', 'trackOverlay'], audio: ['audio', 'trackAudio'] };
function Playhead({ transport, pps }) {
  const { t } = useTransport(transport);
  return html`<div class="playhead" style=${{ left: (t * pps) + 'px' }}><i></i></div>`;
}
export function Timeline({ store, transport, pps, setPps }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const canUndo = useStore(store, (s) => s.canUndo), canRedo = useStore(store, (s) => s.canRedo);
  const scrollRef = useRef(), scrubbing = useRef(false);
  const dur = Math.max(30, projectDuration(project) + 5), width = Math.round(dur * pps);
  const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find((s) => s * pps >= 70) || 300;
  const marks = []; for (let i = 0; i * step <= dur; i++) marks.push(i * step);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}${step < 1 ? '.5' : ''}`;
  const seekFromEvent = (e) => { const el = scrollRef.current, r = el.getBoundingClientRect(); transport.seek(Math.max(0, (e.clientX - r.left + el.scrollLeft) / pps)); };

  useEffect(() => transport.subscribe(() => {                    // keep the playhead in view while playing
    if (!transport.playing) return; const el = scrollRef.current, x = transport.t * pps;
    if (el && (x > el.scrollLeft + el.clientWidth - 40 || x < el.scrollLeft)) el.scrollLeft = Math.max(0, x - 60);
  }), [pps]);

  const zoomVal = Math.round(100 * Math.log(pps / 10) / Math.log(20));
  return html`<section class="panel timeline">
    <div class="tltools">
      <${IconBtn} name="undo" size=${17} title=${L('undo') + ' · Ctrl+Z'} disabled=${!canUndo} onClick=${() => store.undo()} /><${IconBtn} name="redo" size=${17} title=${L('redo') + ' · Ctrl+Y'} disabled=${!canRedo} onClick=${() => store.redo()} /><span class="vsep"></span>
      <${IconBtn} name="scissors" size=${17} title="Split · Ctrl+B (phase 2)" disabled=${true} /><${IconBtn} name="trash" size=${17} title="Delete · Del" disabled=${!sel} onClick=${() => deleteSelected(store)} /><${IconBtn} name="copy" size=${17} title="Duplicate · Ctrl+D" disabled=${!sel} onClick=${() => duplicateSelected(store)} />
      <${IconBtn} name="crop" size=${17} title="Crop" disabled=${true} /><${IconBtn} name="speed" size=${17} title="Speed" disabled=${true} /><${IconBtn} name="magnet" size=${17} title="Snap" disabled=${true} /><${IconBtn} name="link" size=${17} title="Link" disabled=${true} />
      <div class="spacer"></div>
      <${IconBtn} name="zoomOut" size=${17} title="Zoom out" onClick=${() => setPps(clamp(pps / 1.4, 10, 200))} />
      <input class="range zoomrange" type="range" min="0" max="100" value=${zoomVal} style=${{ '--p': zoomVal + '%' }} onInput=${(e) => setPps(10 * Math.pow(20, +e.target.value / 100))} />
      <${IconBtn} name="zoomIn" size=${17} title="Zoom in" onClick=${() => setPps(clamp(pps * 1.4, 10, 200))} />
    </div>
    <div class="tlbody">
      <div class="tlheads"><div class="rulerhead"></div>${project.tracks.map((t) => {
        const [icon, key] = TRACK_UI[t.kind] || ['layers', 'trackOverlay'];
        return html`<div class=${cx('thead', t.kind)}><${IconBtn} name=${t.hidden ? 'eyeOff' : 'eye'} size=${16} onClick=${() => toggleTrack(store, t.id, 'hidden')} title="Show / hide" />
          <${IconBtn} name=${t.locked ? 'lock' : 'unlock'} size=${16} onClick=${() => toggleTrack(store, t.id, 'locked')} title="Lock" active=${t.locked} />
          <span class="tname" title=${H(key)}><${Icon} name=${icon} size=${15} /><span>${L(key)}</span></span></div>`;
      })}</div>
      <div class="tlscroll" ref=${scrollRef}>
        <div class="tlinner" style=${{ width: width + 'px' }}>
          <div class="ruler" onPointerDown=${(e) => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromEvent(e); }}
            onPointerMove=${(e) => { if (scrubbing.current) seekFromEvent(e); }} onPointerUp=${() => { scrubbing.current = false; }}>
            ${marks.map((s) => html`<span style=${{ left: (s * pps) + 'px' }}>${fmt(s)}</span>`)}</div>
          ${project.tracks.map((t) => html`<div class=${cx('trow', t.kind, t.hidden && 'hidden', t.locked && 'locked')}
            onPointerDown=${(e) => { if (e.target === e.currentTarget) { store.select(null); seekFromEvent(e); } }}>
            ${t.clips.map((c) => html`<div class=${cx('clip', c.kind === 'text' ? 'purple' : 'film', sel === c.id && 'sel')} style=${{ left: (c.start * pps) + 'px', width: Math.max(6, c.dur * pps) + 'px' }}
              title=${c.text || ''} onPointerDown=${(e) => { e.stopPropagation(); store.select(c.id); }}>
              <span class="clabel">${c.kind === 'text' ? html`<${Icon} name="text" size=${13} />` : ''}${(c.text || '').split('\n')[0]}</span></div>`)}</div>`)}
          <${Playhead} transport=${transport} pps=${pps} />
        </div>
      </div>
    </div>
  </section>`;
}
