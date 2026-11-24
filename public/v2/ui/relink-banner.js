import { html, useState, useEffect } from './deps.js';
import { useStore } from './hooks.js';
import { T } from './locale-core.js';
import { listMediaIds, saveMedia } from '../engine/storage.js';
import { inspectFile } from '../engine/media.js';
import { missingMediaIds, relinkMedia, relinkLabel } from '../engine/media-status.js';
import { toast } from './toast.js';

export function RelinkBanner({ store }) {
  const project = useStore(store, (s) => s.project);
  const [missing, setMissing] = useState([]);
  const check = async () => setMissing(missingMediaIds(store.get().project, await listMediaIds()));
  useEffect(() => { check().catch(() => setMissing([])); }, [project.media]);
  if (!missing.length) return null;
  const onPick = async (e) => {
    const files = [...(e.target.files || [])];
    let done = 0;
    for (const [i, id] of missing.entries()) {
      const file = files[i];
      if (!file) break;
      const meta = await inspectFile(file).catch(() => ({}));
      await saveMedia(id, file);
      store.edit((d) => { relinkMedia(d, id, { name: file.name, kind: meta.kind, dur: meta.dur, size: file.size, type: file.type }); }, { key: 'relink-' + id });
      done += 1;
    }
    if (done) toast(T(`Relinked ${done} file(s)`, `ဖိုင် ${done} ခု ပြန်ချိတ်ပြီး`), 'ok');
    e.target.value = '';
    check();
  };
  return html`<div class="relinkbar" role="alert">
    <span>⚠ ${relinkLabel(missing.length, T)}</span>
    <label class="btn ghost small">${T('Relink', 'ပြန်ချိတ်')}<input type="file" multiple hidden onChange=${onPick} /></label>
  </div>`;
}
