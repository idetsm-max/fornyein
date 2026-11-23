// Context-menu registry: target -> items. Add a menu here instead of hard-coding
// buttons in a component.
import { findClip } from '../engine/model.js';
import { duplicateSelected, deleteClips, splitClip, toggleTrack, addText, addMediaAt, addOverlayLogo } from '../engine/actions.js';
import { copyClips, cutClips, pasteClips, hasClipboard } from '../engine/clipboard.js';

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
    x, y, title: track.name,
    items: [
      { label: track.hidden ? 'Show track' : 'Hide track', run: () => toggleTrack(store, trackId, 'hidden') },
      { label: track.locked ? 'Unlock track' : 'Lock track', run: () => toggleTrack(store, trackId, 'locked') },
      ...(track.kind === 'audio' ? [{ label: track.muted ? 'Unmute track' : 'Mute track', run: () => toggleTrack(store, trackId, 'muted') }] : []),
    ],
  };
}

export function rulerMenu({ store, transport, x, y }) {
  return {
    x, y, title: 'Timeline',
    items: [
      { label: 'Paste at playhead', shortcut: 'Ctrl+V', disabled: !hasClipboard(), run: () => pasteClips(store, transport) },
      { label: 'Add text at playhead', run: () => addText(store, transport) },
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
