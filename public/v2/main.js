import { html, render, useEffect, useRef, useState } from './ui/deps.js';
import { TopBar, Rail, StatusBar } from './ui/chrome.js';
import { Toaster, toast } from './ui/toast.js';
import { CoachTour, TOUR_KEY } from './ui/tour.js';
import { useLocale } from './ui/locale.js';
import { MediaPanel, Inspector, EffectsPanel } from './ui/panels.js';
import { Player, Timeline } from './ui/stage.js';
import { newProject, projectDuration } from './engine/model.js';
import { createStore } from './engine/store.js';
import { createTransport } from './engine/transport.js';
import { attachAutosave, loadProject, saveProject } from './engine/storage.js';
import { baseFonts, loadR2Fonts } from './engine/fonts.js';
import { deleteSelected, duplicateSelected, splitClip } from './engine/actions.js';
import { createAudioController } from './engine/audio.js';
import { migrate } from './engine/migrate.js';
import { ContextMenu } from './ui/context-menu.js'; import { Splitters, mainProps, useLayout } from './ui/layout.js';
import { copyClips, cutClips, pasteClips } from './engine/clipboard.js';

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
  const [pps, setPps] = useState(60);
  const [fonts, setFonts] = useState(baseFonts);
  const [runtimeError, setRuntimeError] = useState('');
  const [menu, setMenu] = useState(null);
  const [, redrawSave] = useState(0);
  const [layout, setLayout] = useLayout(), shell = mainProps(layout);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('fn.theme', theme); } catch {} }, [theme]);
  useEffect(() => { const f = () => redrawSave((n) => n + 1), err = (e) => setRuntimeError(e.detail || e.message || String(e)), reject = (e) => setRuntimeError(e.reason?.message || String(e.reason)); window.addEventListener('fn-save', f); window.addEventListener('fn-error', err); window.addEventListener('error', err); window.addEventListener('unhandledrejection', reject); loadR2Fonts().then((x) => setFonts((old) => [...old, ...x])).catch((e) => setRuntimeError(e)); return () => { window.removeEventListener('fn-save', f); window.removeEventListener('fn-error', err); window.removeEventListener('error', err); window.removeEventListener('unhandledrejection', reject); }; }, []);
  const audioRef = useRef(null);
  useEffect(() => { const audio = createAudioController(transport, () => store.get().project, store); audioRef.current = audio; return () => { audio.dispose(); audioRef.current = null; }; }, []);
  useEffect(() => { const onKey = (e) => { const typing = /input|textarea/i.test(e.target.tagName), mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase(); if (key === 'escape') { setMenu(null); window.dispatchEvent(new Event('fornyein:escape')); return; } if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); } else if (mod && key === 'y') { e.preventDefault(); store.redo(); } else if (mod && key === 'c' && !typing) { e.preventDefault(); copyClips(store); } else if (mod && key === 'x' && !typing) { e.preventDefault(); cutClips(store); } else if (mod && key === 'v' && !typing) { e.preventDefault(); pasteClips(store, transport); } else if (mod && key === 'd' && !typing) { e.preventDefault(); duplicateSelected(store); } else if (mod && key === 's' && !typing) { e.preventDefault(); saveNow(); } else if (mod && key === 'e' && !typing) { e.preventDefault(); window.dispatchEvent(new Event('fornyein:export')); } else if (e.key === '?' && !typing) { e.preventDefault(); window.dispatchEvent(new Event('fornyein:shortcuts')); } else if (((mod && key === 'b') || (!mod && key === 's')) && !typing) { e.preventDefault(); const id = store.get().selection; if (id) splitClip(store, id, transport.t); } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) { e.preventDefault(); deleteSelected(store, { ripple: e.shiftKey }); } else if (e.code === 'Space' && !typing) { e.preventDefault(); transport.toggle(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const saveNow = async () => { setSave('saving'); try { await saveProject(store.get().project); setSave('saved', Date.now()); toast('သိမ်းပြီးပါပြီ', 'ok'); } catch { setSave('error'); toast('သိမ်းလို့ မရပါ', 'error'); } };
  useLocale();
  const [tour, setTour] = useState(() => { try { return !localStorage.getItem(TOUR_KEY); } catch { return false; } });
  useEffect(() => { const open = () => setTour(true); window.addEventListener('fornyein:tour', open); return () => window.removeEventListener('fornyein:tour', open); }, []);
  const closeTour = () => { setTour(false); try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* private mode */ } };
  const onNew = () => { transport.pause(); store.load(newProject()); };
  const onOpen = async (id) => { const p = await loadProject(id).catch(() => null); if (p) { transport.pause(); store.load(migrate(p)); } };
  return html`<div class="app" role="main" aria-label="For Nyein video editor">${runtimeError && html`<div class="runtimeerror" role="alert"><b>Something went wrong</b><span>${runtimeError}</span><button type="button" onClick=${() => setRuntimeError('')}>Dismiss</button></div>`}<${TopBar} theme=${theme} setTheme=${setTheme} zoom=${zoom} setZoom=${setZoom} store=${store} save=${save} onNew=${onNew} onOpen=${onOpen} onExportJson=${() => downloadProjectJson(store.get().project)} onImportJson=${() => importProjectJson(store, transport)} transport=${transport} layout=${layout} setLayout=${setLayout} /><div class=${shell.class} style=${shell.style}><${Rail} tool=${tool} setTool=${setTool} /><${MediaPanel} tool=${tool} store=${store} transport=${transport} onMenu=${setMenu} /><${Player} store=${store} transport=${transport} fonts=${fonts} onMenu=${setMenu} /><${Inspector} store=${store} fonts=${fonts} transport=${transport} /><${Timeline} store=${store} transport=${transport} pps=${pps} setPps=${setPps} onMenu=${setMenu} audio=${audioRef} /><${EffectsPanel} /><${Splitters} layout=${layout} setLayout=${setLayout} /></div>${tour && html`<${CoachTour} onClose=${closeTour} />`}<${Toaster} /><${ContextMenu} menu=${menu} onClose=${() => setMenu(null)} /><${StatusBar} store=${store} onSave=${() => { const p = store.get().project; import('./engine/storage.js').then(({ saveProject }) => saveProject(p).then(() => setSave('saved', Date.now()))); }} /></div>`;
}
render(html`<${App} />`, document.getElementById('app'));
