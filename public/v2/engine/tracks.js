// Track-level commands (rename / height / delete) live apart from clip actions.
export function renameTrack(store, trackId, name) {
  const next = String(name || '').trim();
  if (!next) return;
  store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t.name = next; },
    { key: `rename:${trackId}`, label: 'Rename track' });
}

export function setTrackHeight(store, trackId, height) {
  store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t.height = height; },
    { key: `height:${trackId}`, label: 'Change track height' });
}

export function deleteTrack(store, trackId) {
  store.edit((d) => { if (d.tracks.length > 1) d.tracks = d.tracks.filter((t) => t.id !== trackId); },
    { key: `trackdel:${trackId}`, label: 'Delete track' });
}
