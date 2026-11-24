import { html, useEffect, useState } from './deps.js';
import { useStore } from './hooks.js';
import { cx } from './widgets.js';
import { toggleTrack } from '../engine/actions.js';
import { readMeters } from '../engine/meters.js';

const db = (v) => (v <= 0.002 ? '−∞' : (20 * Math.log10(v)).toFixed(1));
const panLabel = (p) => (Math.abs(p) < 0.02 ? 'C' : p < 0 ? 'L' + Math.round(-p * 100) : 'R' + Math.round(p * 100));

export function MixerDialog({ store, onClose }) {
  const project = useStore(store, (s) => s.project);
  const [levels, setLevels] = useState({});
  useEffect(() => {
    let raf = 0;
    const tick = () => { setLevels(readMeters()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const tracks = project.tracks.filter((t) => t.kind === 'audio' || t.kind === 'video');
  const set = (track, key, value, label) => store.edit((d) => {
    const t = d.tracks.find((x) => x.id === track.id);
    if (t) t.mixer = { ...t.mixer, [key]: value };
  }, { key: `mix:${key}:${track.id}`, label });
  const resetAll = () => store.edit((d) => {
    for (const t of d.tracks) if (t.mixer) t.mixer = { ...t.mixer, volume: 1, pan: 0 };
  }, { key: 'mix:reset', label: 'Reset mixer' });
  return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="exportbox mixerbox" role="dialog" aria-modal="true" aria-label="Mixer">
      <div class="exporthead"><b>Mixer</b><small class="mixsub">အသံ / pan / mute / solo</small>
        <button type="button" class="x" title="ပိတ် · Esc" onClick=${onClose}>✕</button></div>
      <div class="mixbody">
        <div class="mixhead"><span>Track</span><span>Level</span><span>Volume</span>
          <span>Pan</span><span></span></div>
        ${tracks.map((t) => {
          const vol = t.mixer?.volume ?? 1, pan = t.mixer?.pan || 0;
          const lvl = Math.min(1, levels[t.id] || 0), hot = lvl > 0.9;
          return html`<div class=${cx('mixrow', t.kind)} data-track=${t.id}>
            <div class="mixname"><b>${t.name}</b><em>${t.kind}</em></div>
            <div class="mixmeter" aria-hidden="true">
              <span class=${cx('lvl', hot && 'hot')} style=${{ width: Math.round(lvl * 100) + '%' }}></span></div>
            <div class="mixvol">
              <input class="range mixfader" type="range" min="0" max="1.5" step="0.01" value=${vol}
                style=${{ '--p': Math.round((vol / 1.5) * 100) + '%' }} aria-label=${t.name + ' volume'}
                onInput=${(e) => set(t, 'volume', +e.target.value, 'Volume ' + t.name)} />
              <output class="mixdb">${db(vol)} dB</output>
            </div>
            <div class="mixpan">
              <input class="range mixpanin" type="range" min="-1" max="1" step="0.05" value=${pan}
                style=${{ '--p': Math.round(((pan + 1) / 2) * 100) + '%' }} aria-label=${t.name + ' pan'}
                onInput=${(e) => set(t, 'pan', +e.target.value, 'Pan ' + t.name)} />
              <output class="mixpanout">${panLabel(pan)}</output>
            </div>
            <div class="mixtoggles">
              <button type="button" class=${cx('ibtn mixm', t.muted && 'on')} title="Mute"
                aria-pressed=${!!t.muted} onClick=${() => toggleTrack(store, t.id, 'muted')}>M</button>
              <button type="button" class=${cx('ibtn mixs', t.solo && 'on')} title="Solo"
                aria-pressed=${!!t.solo} onClick=${() => toggleTrack(store, t.id, 'solo')}>S</button>
              ${t.kind === 'audio' && html`<button type="button" class=${cx('ibtn mixd', t.mixer?.ducking && 'on')}
                title="Duck under voice" aria-pressed=${!!t.mixer?.ducking}
                onClick=${() => set(t, 'ducking', !t.mixer?.ducking, 'Ducking ' + t.name)}>D</button>`}
            </div>
          </div>`;
        })}
        <div class="mixfoot">
          <small>M = mute · S = solo · D = ဖတ်သံအောက် အလိုအလျောက် လျှော့</small>
          <button type="button" class="btn ghost" onClick=${resetAll}>Reset all</button>
        </div>
      </div>
    </div>
  </div>`;
}
