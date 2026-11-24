import { html, useState, useEffect, useRef } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { useStore } from './hooks.js';
import { L, H } from './strings.js';
import { toggleLocale, useLocale } from './locale.js';
import { T } from './locale-core.js'; import { LayoutToggles } from './layout.js';
import { listProjects, deleteProject } from '../engine/storage.js';
import { RATIOS, projectDuration, fmtClock } from '../engine/model.js';
import { ExportDialog } from './export-dialog.js';
import { ShortcutsDialog } from './shortcuts-dialog.js';
import { SettingsDialog } from './settings-dialog.js';
import { toast } from './toast.js';
import { resetLayout } from './layout.js';
import { DEFAULTS } from '../engine/settings.js';

const ago = (ts) => { const s = Math.max(0, Math.round((Date.now() - ts) / 1000)); return s < 10 ? T('just now', 'ယခုလေးတင်') : s < 60 ? `${s}${T(' s ago', ' စက္ကန့်က')}` : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };

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

function ProjectName({ project, store }) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(''), inputRef = useRef(null);
  useEffect(() => { const el = inputRef.current; if (editing && el) { el.focus(); el.select(); } }, [editing]);
  useEffect(() => {
    const start = () => { setDraft(project.name); setEditing(true); };
    window.addEventListener('fornyein:rename', start);
    return () => window.removeEventListener('fornyein:rename', start);
  }, [project.name]);
  const commit = () => { const name = draft.trim() || 'Untitled Project'; if (name !== project.name) store.edit((d) => { d.name = name; }, { key: 'name', label: 'Rename project' }); setEditing(false); };
  if (editing) return html`<input class="projname-input" ref=${inputRef} aria-label="Project name" value=${draft} onInput=${(e) => setDraft(e.target.value)}
    onKeyDown=${(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} onBlur=${commit} />`;
  return html`<button type="button" class="projname" title="Rename · F2" onClick=${() => { setDraft(project.name); setEditing(true); }}><span>${project.name || 'Untitled Project'}</span><${Icon} name="pen" size=${13} /></button>`;
}

export function TopBar({ theme, setTheme, zoom, setZoom, store, save, onNew, onOpen, onExportJson, onImportJson, layout, setLayout, transport, settings, onSettingsChange }) {
  const canUndo = useStore(store, (s) => s.canUndo), canRedo = useStore(store, (s) => s.canRedo);
  const undoLabel = useStore(store, (s) => s.undoLabel), redoLabel = useStore(store, (s) => s.redoLabel);
  const locale = useLocale();
  const project = useStore(store, (s) => s.project), [exporting, setExporting] = useState(false), [shortcuts, setShortcuts] = useState(false), [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const toggleShortcuts = () => setShortcuts((v) => !v);
    const openExport = () => setExporting(true);
    const closeShortcuts = () => { setShortcuts(false); setSettingsOpen(false); };
    window.addEventListener('fornyein:shortcuts', toggleShortcuts);
    window.addEventListener('fornyein:export', openExport);
    window.addEventListener('fornyein:escape', closeShortcuts);
    return () => {
      window.removeEventListener('fornyein:shortcuts', toggleShortcuts);
      window.removeEventListener('fornyein:export', openExport);
      window.removeEventListener('fornyein:escape', closeShortcuts);
    };
  }, []);
  const label = save.status === 'saving' ? 'Saving…' : save.status === 'dirty' ? 'Unsaved changes' : save.status === 'error' ? 'Save failed' : save.status === 'saved' ? L('saved') : 'New project';
  return html`<header class="topbar">
    <div class="brand" title="For Nyein"><span class="logo"><${Icon} name="play" size=${15} /></span><span class="brandname">For Nyein</span></div>
    <button type="button" class="navbtn" title=${H('home')} onClick=${onNew}><${Icon} name="home" size=${17} /><span>${L('home')}</span></button>
    <${ProjectsMenu} onNew=${onNew} onOpen=${onOpen} onExportJson=${onExportJson} onImportJson=${onImportJson} />
    <${ProjectName} project=${project} store=${store} />
    <button type="button" class=${cx('savedpill', save.status)} title=${save.status === 'error' ? 'Save failed — click to retry' : H('saved')} onClick=${save.status === 'error' ? () => window.dispatchEvent(new Event('fornyein:retry-save')) : undefined}>
      <${Icon} name=${save.status === 'error' ? 'alert' : 'cloud'} size=${18} /><span><b>${label}</b> ${save.at && save.status === 'saved' ? html`<em>${ago(save.at)}</em>` : ''}</span>
    </button>
    <div class="spacer"></div>
    <div class="topctl">
      <${IconBtn} name="undo" title=${L('undo') + (undoLabel ? ': ' + undoLabel : '') + ' · Ctrl+Z'} disabled=${!canUndo} onClick=${() => store.undo()} />
      <${IconBtn} name="redo" title=${L('redo') + (redoLabel ? ': ' + redoLabel : '') + ' · Ctrl+Y'} disabled=${!canRedo} onClick=${() => store.redo()} />
      <span class="vsep"></span>
      <${Select} value=${zoom} onChange=${(v) => { setZoom(v); window.dispatchEvent(new CustomEvent('fornyein:zoom', { detail: parseInt(v, 10) })); }} options=${['50%', '75%', '100%', '150%', '200%']} title="Preview zoom" cls="compact" />
      <button type="button" class="langbtn" title="UI language" aria-label="Toggle UI language" onClick=${() => toggleLocale()}>${locale === 'my' ? 'မြ' : 'EN'}</button>
      <${IconBtn} name="maximize" title=${L('fullscreen') + ' · ' + H('fullscreen')} /><button type="button" class="helpbtn" title="Keyboard shortcuts" onClick=${() => setShortcuts(true)}>?</button>
      <${LayoutToggles} layout=${layout} setLayout=${setLayout} />
    </div>
    <button type="button" class="btn ghost" title=${H('preview')}><${Icon} name="play" size=${15} /><span>${L('preview')}</span></button>
    <button type="button" class="btn primary" title=${H('export')} onClick=${() => setExporting(true)}><${Icon} name="export" size=${16} /><span>${L('export')}</span></button>
    <div class="themeswitch" role="group" aria-label="Theme">
      <button type="button" class=${cx(theme === 'light' && 'on')} title="Light" onClick=${() => setTheme('light')}><${Icon} name="sun" size=${16} /></button>
      <button type="button" class=${cx(theme === 'dark' && 'on')} title="Dark" onClick=${() => setTheme('dark')}><${Icon} name="moon" size=${16} /></button>
    </div>
    <${IconBtn} name="gear" title="Settings" onClick=${() => setSettingsOpen(true)} />${exporting && html`<${ExportDialog} project=${project} transport=${transport} onClose=${() => setExporting(false)} />`}${shortcuts && html`<${ShortcutsDialog} onClose=${() => setShortcuts(false)} />`}${settingsOpen && html`<${SettingsDialog} settings=${settings} onChange=${onSettingsChange} onClose=${() => setSettingsOpen(false)} onResetLayout=${() => { resetLayout(setLayout); toast('Layout ပြန်လည်သတ်မှတ်ပြီး', 'ok'); }} onReset=${() => { onSettingsChange({ ...DEFAULTS }); toast('Default ပြန်ထားပြီး', 'ok'); }} onClearCaches=${() => { try { for (const k of Object.keys(localStorage)) if (/^fn\.(peaks|thumbs|wave)/.test(k)) localStorage.removeItem(k); } catch { /* private mode */ } toast('Cache ရှင်းပြီးပါပြီ', 'ok'); }} />`}
  </header>`;
}

const TOOLS = ['media', 'audio', 'text', 'stickers', 'effects', 'transitions', 'filters', 'adjust', 'templates', 'more'];
export function Rail({ tool, setTool }) {
  return html`<nav class="rail" aria-label="Tools">${TOOLS.map((id) =>
    html`<button type="button" data-tool=${id} class=${cx('railbtn', tool === id && 'on')} title=${H(id)} aria-label=${L(id)} aria-pressed=${tool === id} onClick=${() => setTool(id)}><${Icon} name=${id} size=${22} /><span>${L(id)}</span></button>`)}</nav>`;
}

const fmtSecs = (t) => { const s = Math.max(0, Math.floor(t || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function Fps({ on }) {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0, frames = 0, last = performance.now();
    const tick = () => { frames += 1; const now = performance.now(); if (now - last >= 500) { setFps(Math.round(frames * 1000 / (now - last))); frames = 0; last = now; } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return on ? html`<span class="sitem sb-fps" title="Preview frame rate"><b>${fps}</b> fps</span>` : null;
}

export function StatusBar({ store, onSave, settings }) {
  const p = useStore(store, (s) => s.project), selection = useStore(store, (s) => s.selection);
  const [w, h] = RATIOS[p.size], sec = settings?.timecode === 'sec';
  return html`<footer class="statusbar">
    <span class="sitem">${L('project')}: <input class="pname" value=${p.name} spellcheck="false" onInput=${(e) => store.edit((d) => { d.name = e.target.value || 'Untitled Project'; }, { key: 'pname' })} /></span><span class="vsep"></span>
    <button type="button" class="sitem sbtn" title="Project settings" onClick=${() => store.select(null)}>${L('resolution')}: <b>${w} × ${h}</b> (${p.size})</button>
    <span class="sitem sb-meta">${p.fps || 30} fps · ${sec ? fmtSecs(projectDuration(p)) : fmtClock(projectDuration(p))}</span>
    <${Fps} on=${!!settings?.perfHud} />
    ${selection && html`<span class="sitem sb-sel">${T('1 clip selected', 'clip ၁ ခု ရွေးထားသည်')}</span>`}
    <div class="spacer"></div>
    <button type="button" class="btn ghost" title=${H('save')} onClick=${onSave}><${Icon} name="save" size=${16} /><span>${L('save')}</span></button>
    <button type="button" class="btn primary" title=${H('exportVideo')} onClick=${() => window.dispatchEvent(new Event('fornyein:export'))}><${Icon} name="export" size=${16} /><span>${L('exportVideo')}</span></button>
  </footer>`;
}
