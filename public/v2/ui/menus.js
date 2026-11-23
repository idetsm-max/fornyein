// Context-menu registry: target -> items. Add a menu here instead of hard-coding
// buttons in a component.
import { findClip } from '../engine/model.js';
import { duplicateSelected, deleteClips, splitClip, toggleTrack, addText, addMediaAt, addOverlayLogo } from '../engine/actions.js';
import { renameTrack, setTrackHeight, deleteTrack } from '../engine/tracks.js';
import { copyClips, cutClips, pasteClips, hasClipboard } from '../engine/clipboard.js';
import { deleteLeft, deleteRight } from '../engine/timeline.js';
import { addMarker, removeMarkerAt } from '../engine/markers.js';
import { deleteRange } from '../engine/timeline.js';

export function clipMenu({ store, transport, clipId, x, y }) {
  const found = findClip(store.get().project, clipId);
  const locked = !found || found.clip.locked || found.track.locked;
  return {
    x, y, title: found?.clip.text?.split('\n')[0] || found?.clip.name || 'Clip',
    items: [
      { label: 'Cut', shortcut: 'Ctrl+X', disabled: locked, run: () => cutClips(store, [clipId]) },
      { label: 'Copy', shortcut: 'Ctrl+C', disabled: locked, run: () => copyClips(store, [clipId]) },
      { label: 'Paste', shortcut: 'Ctrl+V', disabled: !hasClipboard(), run: () => pasteClips(store, transport) },
      { sep: true },
      { label: 'Duplicate', shortcut: 'Ctrl+D', disabled: locked, run: () => { store.select(clipId); duplicateSelected(store); } },
      { label: 'Delete', shortcut: 'Del', disabled: locked, run: () => deleteClips(store, [clipId]) },
      { label: 'Ripple delete', shortcut: 'Shift+Del', disabled: locked, run: () => deleteClips(store, [clipId], { ripple: true }) },
      { label: 'Split at playhead', shortcut: 'Ctrl+B', disabled: locked, run: () => splitClip(store, clipId, transport.t) },
    ],
  };
}

export function trackMenu({ store, trackId, x, y }) {
  const track = store.get().project.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  return {
    x, y, title: track.name || 'Track',
    items: [
      { label: 'Rename track…', run: () => { const name = window.prompt('Track name', track.name || ''); if (name) renameTrack(store, trackId, name); } },
      { label: track.hidden ? 'Show track' : 'Hide track', run: () => toggleTrack(store, trackId, 'hidden') },
      { label: track.locked ? 'Unlock track' : 'Lock track', run: () => toggleTrack(store, trackId, 'locked') },
      ...(track.kind === 'audio' ? [
        { label: track.muted ? 'Unmute track' : 'Mute track', run: () => toggleTrack(store, trackId, 'muted') },
        { label: track.solo ? 'Unsolo track' : 'Solo track', run: () => toggleTrack(store, trackId, 'solo') },
      ] : []),
      { sep: true },
      { label: 'Small height', checked: track.height === 's', run: () => setTrackHeight(store, trackId, 's') },
      { label: 'Medium height', checked: !track.height || track.height === 'm', run: () => setTrackHeight(store, trackId, 'm') },
      { label: 'Large height', checked: track.height === 'l', run: () => setTrackHeight(store, trackId, 'l') },
      { sep: true },
      { label: 'Delete track', run: () => deleteTrack(store, trackId), disabled: store.get().project.tracks.length < 2 },
    ],
  };
}

export function rulerMenu({ store, transport, x, y, onFit }) {
  return {
    x, y, title: 'Timeline',
    items: [
      { label: 'Paste at playhead', shortcut: 'Ctrl+V', disabled: !hasClipboard(), run: () => pasteClips(store, transport) },
      { label: 'Add text at playhead', run: () => addText(store, transport) },
      { label: 'Add marker', shortcut: 'M', run: () => addMarker(store, transport.t) },
      { label: 'Delete marker at playhead', run: () => removeMarkerAt(store, transport.t) },
      { sep: true },
      { label: 'Delete left of playhead', shortcut: 'Q', run: () => deleteLeft(store, transport.t) },
      { label: 'Delete right of playhead', shortcut: 'W', run: () => deleteRight(store, transport.t) },
      { label: 'Lift in–out', run: () => {
        const { in: a, out: b } = transport.range;
        if (a != null && b != null && b > a) deleteRange(store, a, b);
      } },
      { label: 'Extract in–out', run: () => {
        const { in: a, out: b } = transport.range;
        if (a != null && b != null && b > a) deleteRange(store, a, b, { ripple: true });
      } },
      { label: 'Clear in–out', run: () => transport.setRange({ in: null, out: null }) },
      { label: 'Zoom to fit', shortcut: 'Shift+Z', run: () => onFit?.() },
    ],
  };
}

export function mediaMenu({ store, transport, media, x, y }) {
  return {
    x, y, title: media.name,
    items: [
      { label: 'Add to timeline', run: () => addMediaAt(store, transport, media, transport.t) },
      ...(media.kind === 'image' ? [{ label: 'Add as corner logo', run: () => addOverlayLogo(store, transport, media) }] : []),
    ],
  };
}
