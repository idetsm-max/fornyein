import { html, render, useEffect, useState } from './ui/deps.js';
import { TopBar, Rail, StatusBar } from './ui/chrome.js';
import { MediaPanel, Inspector, EffectsPanel } from './ui/panels.js';
import { Player, Timeline } from './ui/stage.js';
import { newProject, projectDuration } from './engine/model.js';
import { createStore } from './engine/store.js';
import { createTransport } from './engine/transport.js';
import { attachAutosave, loadProject } from './engine/storage.js';
import { baseFonts, loadR2Fonts } from './engine/fonts.js';
import { deleteSelected, duplicateSelected, splitClip } from './engine/actions.js';
import { createAudioController } from './engine/audio.js';

const store = createStore(newProject());
const transport = createTransport(() => projectDuration(store.get().project), () => Math.max(30, projectDuration(store.get().project)));
const save = { status: 'idle', at: 0 };
function setSave(status, at) { save.status = status; save.at = at || save.at; window.dispatchEvent(new Event('fn-save')); }
attachAutosave(store, setSave);
function downloadProjectJson(project) { const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `${project.name || 'fornyein'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function importProjectJson(store, transport) { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; try { const { normalizeImportedProject } = await import('./engine/export.js'); const p = normalizeImportedProject(await file.text()); transport.pause(); store.load(p); } catch (e) { window.dispatchEvent(new CustomEvent('fn-error', { detail: e })); } }; input.click(); }

function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('fn.theme') || 'dark'; } catch { return 'dark'; } });
  const [tool, setTool] = useState('media');
  const [zoom, setZoom] = useState('100%');
  const [pps, setPps] = useState(10);
  const [fonts, setFonts] = useState(baseFonts);
  const [runtimeError, setRuntimeError] = useState('');
  const [, redrawSave] = useState(0);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('fn.theme', theme); } catch {} }, [theme]);
  useEffect(() => { const f = () => redrawSave((n) => n + 1), err = (e) => setRuntimeError(e.detail || e.message || String(e)), reject = (e) => setRuntimeError(e.reason?.message || String(e.reason)); window.addEventListener('fn-save', f); window.addEventListener('fn-error', err); window.addEventListener('error', err); window.addEventListener('unhandledrejection', reject); loadR2Fonts().then((x) => setFonts((old) => [...old, ...x])).catch((e) => setRuntimeError(e)); return () => { window.removeEventListener('fn-save', f); window.removeEventListener('fn-error', err); window.removeEventListener('error', err); window.removeEventListener('unhandledrejection', reject); }; }, []);
  useEffect(() => { const audio = createAudioController(transport, () => store.get().project); return () => audio.dispose(); }, []);
  useEffect(() => { const onKey = (e) => { const typing = /input|textarea/i.test(e.target.tagName); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); store.redo(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !typing) { e.preventDefault(); duplicateSelected(store); } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.key === 's') && !typing) { e.preventDefault(); const id = store.get().selection; if (id) splitClip(store, id, transport.t); } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) { e.preventDefault(); deleteSelected(store, { ripple: e.shiftKey }); } else if (e.code === 'Space' && !typing) { e.preventDefault(); transport.toggle(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const onNew = () => { transport.pause(); store.load(newProject()); };
  const onOpen = async (id) => { const p = await loadProject(id).catch(() => null); if (p) { transport.pause(); store.load(p); } };
  return html`<div class="app" role="main" aria-label="For Nyein video editor">${runtimeError && html`<div class="runtimeerror" role="alert"><b>Something went wrong</b><span>${runtimeError}</span><button type="button" onClick=${() => setRuntimeError('')}>Dismiss</button></div>`}<${TopBar} theme=${theme} setTheme=${setTheme} zoom=${zoom} setZoom=${setZoom} store=${store} save=${save} onNew=${onNew} onOpen=${onOpen} onExportJson=${() => downloadProjectJson(store.get().project)} onImportJson=${() => importProjectJson(store, transport)} /><div class="main"><${Rail} tool=${tool} setTool=${setTool} /><${MediaPanel} tool=${tool} store=${store} transport=${transport} /><${Player} store=${store} transport=${transport} fonts=${fonts} /><${Inspector} store=${store} fonts=${fonts} /><${Timeline} store=${store} transport=${transport} pps=${pps} setPps=${setPps} /><${EffectsPanel} /></div><${StatusBar} store=${store} onSave=${() => { const p = store.get().project; import('./engine/storage.js').then(({ saveProject }) => saveProject(p).then(() => setSave('saved', Date.now()))); }} /></div>`;
}
render(html`<${App} />`, document.getElementById('app'));
