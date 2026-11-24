// One timeline track header: visibility, lock, audio mute/solo, inline rename.
import { html } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, cx } from './widgets.js';
import { toggleTrack } from '../engine/actions.js';
import { renameTrack } from '../engine/tracks.js';
import { L } from './strings.js';
const TRACK_UI = { text: ['text', 'trackText'], video: ['video', 'trackVideo'], overlay: ['layers', 'trackOverlay'], audio: ['audio', 'trackAudio'] };

export function TrackHead({ store, track, renaming, setRenaming, onMenu }) {
  const [icon, key] = TRACK_UI[track.kind] || ['layers', 'trackOverlay'];
  const label = L(key);
  const DEFAULT_NAMES = { text: 'Text', video: 'Video', overlay: 'Overlay', audio: 'Audio' };
  const shown = track.name && track.name !== (DEFAULT_NAMES[track.kind] || '') ? track.name : label;
  const toggle = (key) => () => toggleTrack(store, track.id, key);
  const onContext = (e) => { e.preventDefault(); onMenu?.({ trackId: track.id, x: e.clientX, y: e.clientY }); };
  return html`<div class=${cx('thead', track.kind, track.height && `h-${track.height}`)} onContextMenu=${onContext}>
    <${IconBtn} name=${track.hidden ? 'eyeOff' : 'eye'} size=${16} onClick=${toggle('hidden')} title="Show / hide" />
    <${IconBtn} name=${track.locked ? 'lock' : 'unlock'} size=${16} onClick=${toggle('locked')} title="Lock" active=${track.locked} />
    ${track.kind === 'audio' && html`<${IconBtn} name=${track.muted ? 'volumeOff' : 'volume'} size=${16}
        onClick=${toggle('muted')} title="Mute" active=${track.muted} /><button type="button"
        class=${cx('ibtn solo', track.solo && 'on')} title="Solo" onClick=${toggle('solo')}>S</button>`}
    ${renaming === track.id
      ? html`<input class="trename" value=${track.name || ''} autoFocus
          onBlur=${(e) => { renameTrack(store, track.id, e.target.value); setRenaming(null); }}
          onKeyDown=${(e) => { if (e.key === 'Enter') e.currentTarget.blur(); else if (e.key === 'Escape') setRenaming(null); }} />`
      : html`<span class="tname" title=${shown + ' · double-click to rename'}
          onDblClick=${(e) => { e.stopPropagation(); setRenaming(track.id); }}>
          <${Icon} name=${icon} size=${15} /><span>${shown}</span></span>`}
  </div>`;
}
