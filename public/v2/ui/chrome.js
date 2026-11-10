import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { useStore } from './hooks.js';
import { L, H } from './strings.js';
import { listProjects, deleteProject } from '../engine/storage.js';
import { RATIOS } from '../engine/model.js';
import { createMediabunnyJob, saveExportResult } from '../engine/export.js';

const ago = (ts) => { const s = Math.max(0, Math.round((Date.now() - ts) / 1000)); return s < 10 ? 'just now' : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };

function ShortcutsDialog({ onClose }) { return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && onClose()}><div class="exportbox shortcutbox"><div class="exporthead"><b>Keyboard shortcuts</b><button type="button" class="x" onClick=${onClose}>×</button></div><div class="shortcutlist"><span><kbd>Space</kbd> Play / pause</span><span><kbd>Ctrl/Cmd + Z</kbd> Undo</span><span><kbd>Ctrl/Cmd + Y</kbd> Redo</span><span><kbd>Ctrl/Cmd + D</kbd> Duplicate selected clip</span><span><kbd>Ctrl/Cmd + B</kbd> Split at playhead</span><span><kbd>Delete</kbd> Delete selected clip</span><span><kbd>Shift + Delete</kbd> Ripple delete</span></div></div></div>`; }
function ProjectsMenu({ onNew, onOpen, onExportJson, onImportJson }) {
  const [open, setOpen] = useState(false), [items, setItems] = useState([]);
  useEffect(() => { if (!open) return; const close = () => setOpen(false); const id = setTimeout(() => document.addEventListener('click', close), 0); return () => { clearTimeout(id); document.removeEventListener('click', close); }; }, [open]);
  const toggle = async () => { if (!open) setItems(await listProjects().catch(() => [])); setOpen(!open); };
  const remove = async (e, p) => { e.stopPropagation(); if (!confirm(`"${p.name}" ကို ဖျက်မလား?`)) return; await deleteProject(p.id); setItems(await listProjects().catch(() => [])); };
  return html`<div class="menuwrap">
    <button type="button" class="navbtn" title=${H('projects')} onClick=${toggle}><span>${L('projects')}</span><${Icon} name="chevron" size=${14} /></button>
    ${open && html`<div class="menu" onClick=${(e) => e.stopPropagation()}>
      <button type="button" class="menuitem new" onClick=${() => { setOpen(false); onNew(); }}><${Icon} name="plus" size=${16} /><span>New project</span></button><button type="button" class="menuitem" onClick=${() => { setOpen(false); onExportJson(); }}><${Icon} name="download" size=${16} /><span>Export project JSON</span></button><button type="button" class="menuitem" onClick=${() => { setOpen(false); onImportJson(); }}><${Icon} name="upload" size=${16} /><span>Import project JSON</span></button>
      ${items.length === 0 && html`<div class="menuempty">သိမ်းထားတဲ့ project မရှိသေးပါ</div>`}
      ${items.map((p) => html`<div class="menuitem"><button type="button" class="grow" onClick=${() => { setOpen(false); onOpen(p.id); }}><b>${p.name}</b><em>${ago(p.updated)}</em></button>
        <button type="button" class="x" title="Delete" onClick=${(e) => remove(e, p)}><${Icon} name="trash" size=${15} /></button></div>`)}
    </div>`}
  </div>`;
}

function ExportDialog({ project, onClose }) {
  const [preset, setPreset] = useState('720p'), [format, setFormat] = useState('mp4'), [progress, setProgress] = useState(0), [running, setRunning] = useState(false), [error, setError] = useState(''), job = useRef(null);
  const start = async () => { setError(''); setProgress(0); setRunning(true); try { const j = await createMediabunnyJob(project, preset, { format, onProgress: setProgress }); job.current = j; const result = await j.run(); await saveExportResult(result, `${project.name || 'fornyein'}.${format}`); } catch (e) { setError(e?.message || String(e)); } finally { setRunning(false); } };
  return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && !running && onClose()}><div class="exportbox"><div class="exporthead"><b>Export video</b><button type="button" class="x" disabled=${running} onClick=${onClose}>×</button></div><div class="exportbody"><label>Resolution<${Select} value=${preset} onChange=${setPreset} options=${['720p', '1080p', '9:16', '1:1']} /></label><label>Format<${Select} value=${format} onChange=${setFormat} options=${['mp4', 'webm']} /></label>${running && html`<div class="exportprogress"><div><span>Rendering…</span><b>${Math.round(progress * 100)}%</b></div><progress max="1" value=${progress}></progress></div>`}${error && html`<p class="exporterror">${error}</p>`}</div><div class="exportfoot">${running ? html`<button type="button" class="btn ghost" onClick=${() => job.current?.cancel()}>Cancel</button>` : html`<button type="button" class="btn ghost" onClick=${onClose}>Close</button><button type="button" class="btn primary" onClick=${start}>Export</button>`}</div></div></div>`;
}
export function TopBar({ theme, setTheme, zoom, setZoom, store, save, onNew, onOpen, onExportJson, onImportJson }) {
  const canUndo = useStore(store, (s) => s.canUndo), canRedo = useStore(store, (s) => s.canRedo);
  const project = useStore(store, (s) => s.project), [exporting, setExporting] = useState(false), [shortcuts, setShortcuts] = useState(false);
  const label = save.status === 'saving' ? 'Saving…' : save.status === 'dirty' ? 'Unsaved changes' : save.status === 'error' ? 'Save failed' : save.status === 'saved' ? L('saved') : 'New project';
  return html`<header class="topbar">
    <div class="brand" title="For Nyein"><span class="logo"><${Icon} name="play" size=${15} /></span><span class="brandname">For Nyein</span></div>
    <button type="button" class="navbtn" title=${H('home')} onClick=${onNew}><${Icon} name="home" size=${17} /><span>${L('home')}</span></button>
    <${ProjectsMenu} onNew=${onNew} onOpen=${onOpen} onExportJson=${onExportJson} onImportJson=${onImportJson} />
    <div class=${cx('savedpill', save.status)} title=${H('saved')}><${Icon} name="cloud" size=${18} /><span><b>${label}</b> ${save.at && save.status === 'saved' ? html`<em>${ago(save.at)}</em>` : ''}</span></div>
    <div class="spacer"></div>
    <div class="topctl">
      <${IconBtn} name="undo" title=${L('undo') + ' · Ctrl+Z'} disabled=${!canUndo} onClick=${() => store.undo()} />
      <${IconBtn} name="redo" title=${L('redo') + ' · Ctrl+Y'} disabled=${!canRedo} onClick=${() => store.redo()} />
      <span class="vsep"></span>
      <${Select} value=${zoom} onChange=${setZoom} options=${['50%', '75%', '100%', '150%', '200%']} title="Zoom" cls="compact" />
      <${IconBtn} name="maximize" title=${L('fullscreen') + ' · ' + H('fullscreen')} /><button type="button" class="helpbtn" title="Keyboard shortcuts" onClick=${() => setShortcuts(true)}>?</button>
    </div>
    <button type="button" class="btn ghost" title=${H('preview')}><${Icon} name="play" size=${15} /><span>${L('preview')}</span></button>
    <button type="button" class="btn primary" title=${H('export')} onClick=${() => setExporting(true)}><${Icon} name="export" size=${16} /><span>${L('export')}</span></button>
    <div class="themeswitch" role="group" aria-label="Theme">
      <button type="button" class=${cx(theme === 'light' && 'on')} title="Light" onClick=${() => setTheme('light')}><${Icon} name="sun" size=${16} /></button>
      <button type="button" class=${cx(theme === 'dark' && 'on')} title="Dark" onClick=${() => setTheme('dark')}><${Icon} name="moon" size=${16} /></button>
    </div>
    <div class="avatar" title="Account">N</div>${exporting && html`<${ExportDialog} project=${project} onClose=${() => setExporting(false)} />`}${shortcuts && html`<${ShortcutsDialog} onClose=${() => setShortcuts(false)} />`}
  </header>`;
}

const TOOLS = ['media', 'audio', 'text', 'stickers', 'effects', 'transitions', 'filters', 'adjust', 'templates', 'more'];
export function Rail({ tool, setTool }) {
  return html`<nav class="rail" aria-label="Tools">${TOOLS.map((id) =>
    html`<button type="button" class=${cx('railbtn', tool === id && 'on')} title=${H(id)} onClick=${() => setTool(id)}><${Icon} name=${id} size=${22} /><span>${L(id)}</span></button>`)}</nav>`;
}

export function StatusBar({ store, onSave }) {
  const p = useStore(store, (s) => s.project);
  const [w, h] = RATIOS[p.size];
  return html`<footer class="statusbar">
    <span class="sitem">${L('project')}: <input class="pname" value=${p.name} spellcheck="false" onInput=${(e) => store.edit((d) => { d.name = e.target.value || 'Untitled Project'; }, { key: 'pname' })} /></span><span class="vsep"></span>
    <span class="sitem">${L('resolution')}: <b>${w} × ${h}</b> (${p.size})</span>
    <div class="spacer"></div>
    <button type="button" class="btn ghost" title=${H('save')} onClick=${onSave}><${Icon} name="save" size=${16} /><span>${L('save')}</span></button>
    <button type="button" class="btn primary" title=${H('exportVideo')}><${Icon} name="export" size=${16} /><span>${L('exportVideo')}</span></button>
  </footer>`;
}
