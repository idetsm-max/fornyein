// Single source of truth for keyboard shortcuts: the dialog, docs and tests
// all read this registry instead of keeping their own copies.
export const SHORTCUT_GROUPS = [
  { id: 'playback', en: 'Playback', items: [
    { keys: 'Space', en: 'Play / pause', done: true },
    { keys: 'J / K / L', en: 'Pause + step back 1 s / pause / play', done: true },
    { keys: '← / →', en: 'Nudge one frame (Shift = 1 s)', done: true },
    { keys: 'Home / End', en: 'Go to start / end', done: true },
    { keys: 'Loop button', en: 'Loop the in–out range', done: true },
  ] },
  { id: 'edit', en: 'Editing', items: [
    { keys: 'Ctrl/Cmd + Z', en: 'Undo', done: true },
    { keys: 'Ctrl/Cmd + Shift + Z', en: 'Redo (Ctrl/Cmd + Y also works)', done: true },
    { keys: 'Ctrl/Cmd + C / X / V', en: 'Copy / cut / paste clips', done: true },
    { keys: 'Ctrl/Cmd + D', en: 'Duplicate selected clip', done: true },
    { keys: 'Ctrl/Cmd + B or S', en: 'Split selected clip at playhead', done: true },
    { keys: 'Delete / Backspace', en: 'Delete selected clip (Shift = ripple)', done: true },
    { keys: 'Q / W', en: 'Delete left / right of the playhead', done: true },
    { keys: 'B / V', en: 'Razor / select tool', done: true },
  ] },
  { id: 'select', en: 'Selection & navigation', items: [
    { keys: 'Alt + →', en: 'Select every clip right of the playhead', done: true },
    { keys: 'Drag empty timeline', en: 'Marquee select clips', done: true },
    { keys: 'M', en: 'Add marker', done: true },
    { keys: '↑ / ↓', en: 'Previous / next marker', done: true },
    { keys: 'I / O', en: 'Set in / out (Shift clears)', done: true },
  ] },
  { id: 'trim', en: 'Trim & drag', items: [
    { keys: 'Shift + drag edge', en: 'Ripple trim', done: true },
    { keys: 'Alt + drag edge', en: 'Roll trim (shared edit point)', done: true },
    { keys: 'Alt + drag body', en: 'Slip source', done: true },
    { keys: 'Ctrl + drag body', en: 'Slide clip', done: true },
  ] },
  { id: 'view', en: 'View & app', items: [
    { keys: 'Shift + Z', en: 'Zoom timeline to fit', done: true },
    { keys: 'Shift + wheel', en: 'Scroll the timeline horizontally', done: true },
    { keys: 'N', en: 'Snap on / off', done: true },
    { keys: 'Ctrl/Cmd + S', en: 'Save project', done: true },
    { keys: 'Ctrl/Cmd + E', en: 'Open the export dialog', done: true },
    { keys: '?', en: 'Show this shortcut list', done: true },
    { keys: 'Esc', en: 'Close menus', done: true },
    { keys: 'F / Esc', en: 'Fullscreen preview (Esc leaves)', done: true },
    { keys: 'Tab', en: 'Player-only layout (hide both side panels)', done: true },
  ] },
];

export const implementedShortcuts = () => SHORTCUT_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => item.done) }));
