import { html, useState, useRef } from './deps.js';
import { Select } from './widgets.js';
import { createMediabunnyJob, saveExportResult } from '../engine/export.js';
import { trimProject, stripCaptions } from '../engine/export-range.js';
import { textToSrt } from '../engine/actions.js';

function downloadSrt(project) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + textToSrt(project)], { type: 'text/plain;charset=utf-8' }));
  a.download = `${project.name || 'fornyein'}.srt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ExportDialog({ project, transport, onClose }) {
  const [preset, setPreset] = useState('720p'), [format, setFormat] = useState('mp4'), [range, setRange] = useState('all'), [caps, setCaps] = useState('burn');
  const [progress, setProgress] = useState(0), [running, setRunning] = useState(false), [error, setError] = useState(''), job = useRef(null);
  const start = async () => {
    setError(''); setProgress(0); setRunning(true);
    try {
      const inOut = transport?.range || {};
      const useRange = range === 'range' && inOut.out > inOut.in;
      let base = useRange ? trimProject(project, inOut.in, inOut.out) : project;
      if (caps === 'srt') { downloadSrt(project); base = stripCaptions(base); }
      const j = await createMediabunnyJob(base, preset, { format, onProgress: setProgress });
      job.current = j;
      const result = await j.run();
      await saveExportResult(result, `${project.name || 'fornyein'}.${format}`);
    } catch (e) { setError(e?.message || String(e)); } finally { setRunning(false); }
  };
  return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && !running && onClose()}><div class="exportbox"><div class="exporthead"><b>Export video</b><button type="button" class="x" disabled=${running} onClick=${onClose}>×</button></div><div class="exportbody"><label>Resolution<${Select} value=${preset} onChange=${setPreset} options=${['720p', '1080p', '9:16', '1:1']} /></label><label>Format<${Select} value=${format} onChange=${setFormat} options=${['mp4', 'webm']} /></label>
<label title="In–out range (I/O keys)">Range<${Select} value=${range} onChange=${setRange} options=${['all', 'range']} /></label>
<label title="Burn captions into the video or save them as .srt">Captions<${Select} value=${caps} onChange=${setCaps} options=${['burn', 'srt']} /></label>${running && html`<div class="exportprogress"><div><span>Rendering…</span><b>${Math.round(progress * 100)}%</b></div><progress max="1" value=${progress}></progress></div>`}${error && html`<p class="exporterror">${error}</p>`}</div><div class="exportfoot">${running ? html`<button type="button" class="btn ghost" onClick=${() => job.current?.cancel()}>Cancel</button>` : html`<button type="button" class="btn ghost" onClick=${onClose}>Close</button><button type="button" class="btn primary" onClick=${start}>Export</button>`}</div></div></div>`;
}
