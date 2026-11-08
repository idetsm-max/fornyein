import { html, render, useEffect, useState } from './ui/deps.js';
import { TopBar, Rail, StatusBar } from './ui/chrome.js';
import { MediaPanel, Inspector, EffectsPanel } from './ui/panels.js';
import { Player, Timeline } from './ui/stage.js';
import { newProject, projectDuration } from './engine/model.js';
import { createStore } from './engine/store.js';
import { createTransport } from './engine/transport.js';
import { attachAutosave, loadProject } from './engine/storage.js';
import { baseFonts, loadR2Fonts } from './engine/fonts.js';

const store = createStore(newProject());
const transport = createTransport(() => projectDuration(store.get().project), () => Math.max(30, projectDuration(store.get().project)));
const save = { status: 'idle', at: 0 };
function setSave(status, at) { save.status = status; save.at = at || save.at; window.dispatchEvent(new Event('fn-save')); }
attachAutosave(store, setSave);

function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('fn.theme') || 'dark'; } catch { return 'dark'; } });
  const [tool, setTool] = useState('media');
  const [zoom, setZoom] = useState('100%');
  const [pps, setPps] = useState(10);
  const [fonts, setFonts] = useState(baseFonts);
  const [, redrawSave] = useState(0);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('fn.theme', theme); } catch {} }, [theme]);
  useEffect(() => { const f = () => redrawSave((n) => n + 1); window.addEventListener('fn-save', f); loadR2Fonts().then((x) => setFonts((old) => [...old, ...x])); return () => window.removeEventListener('fn-save', f); }, []);
  useEffect(() => { const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); store.redo(); } else if (e.code === 'Space' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); transport.toggle(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const onNew = () => { transport.pause(); store.load(newProject()); };
  const onOpen = async (id) => { const p = await loadProject(id).catch(() => null); if (p) { transport.pause(); store.load(p); } };
  return html`<div class="app"><${TopBar} theme=${theme} setTheme=${setTheme} zoom=${zoom} setZoom=${setZoom} store=${store} save=${save} onNew=${onNew} onOpen=${onOpen} /><div class="main"><${Rail} tool=${tool} setTool=${setTool} /><${MediaPanel} tool=${tool} store=${store} transport=${transport} /><${Player} store=${store} transport=${transport} fonts=${fonts} /><${Inspector} store=${store} fonts=${fonts} /><${Timeline} store=${store} transport=${transport} pps=${pps} setPps=${setPps} /><${EffectsPanel} /></div><${StatusBar} store=${store} onSave=${() => { const p = store.get().project; import('./engine/storage.js').then(({ saveProject }) => saveProject(p).then(() => setSave('saved', Date.now()))); }} /></div>`;
}
render(html`<${App} />`, document.getElementById('app'));
