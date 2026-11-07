import { html, render, useState, useEffect } from './ui/deps.js';
import { TopBar, Rail, StatusBar } from './ui/chrome.js';
import { MediaPanel, Inspector, EffectsPanel } from './ui/panels.js';
import { Player, Timeline, RATIOS } from './ui/stage.js';

function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('fn.theme') || 'dark'; } catch { return 'dark'; } });
  const [tool, setTool] = useState('media');
  const [ratio, setRatio] = useState('16:9');
  const [zoom, setZoom] = useState('100%');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(12.5);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('fn.theme', theme); } catch { /* private mode */ } }, [theme]);
  // Phase 0 only: a demo playhead so the layout looks alive (the real transport arrives with the engine)
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => (t >= 29.9 ? 0 : t + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing]);
  return html`<div class="app">
    <${TopBar} theme=${theme} setTheme=${setTheme} zoom=${zoom} setZoom=${setZoom} />
    <div class="main">
      <${Rail} tool=${tool} setTool=${setTool} />
      <${MediaPanel} tool=${tool} />
      <${Player} ratio=${ratio} setRatio=${setRatio} time=${time} duration=${30} playing=${playing} setPlaying=${setPlaying} />
      <${Inspector} />
      <${Timeline} time=${time} />
      <${EffectsPanel} />
    </div>
    <${StatusBar} ratio=${ratio} res=${RATIOS[ratio]} />
  </div>`;
}
render(html`<${App} />`, document.getElementById('app'));
