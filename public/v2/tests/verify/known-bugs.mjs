// Known-bug checks found during verification (see docs/VERIFY.md). Run:  node public/v2/tests/verify/known-bugs.mjs
// Every line should print PASS once the bug is fixed; exit code 1 while any FAIL remains.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as M from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import * as A from '../../engine/actions.js';
import { normalizeMyanmar } from '../../engine/text.js';

let failed = 0; const log = (ok, name, extra = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? '  — ' + extra : ''}`); };
const tr = { t: 0, seek(x) { this.t = x; } };
const here = (p) => fs.readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

// B1 — valid Unicode Burmese must never be changed by the text helpers
for (const s of ['တွေကို', 'ရေကို', 'မြန်မာစာ', 'ဗုဒ္ဓ', 'မန္တလေး', 'ကျွန်တော် သူငယ်ချင်းတွေကို ချစ်တယ်']) {
  const o = normalizeMyanmar(s); log(o === s, `B1 normalizeMyanmar keeps "${s}"`, o === s ? '' : 'became ' + o);
}
// B4 — splitting / trimming an AUDIO clip must keep the position inside the file
{
  const s = createStore(M.newProject()); A.addMedia(s, tr, { id: 'm1', kind: 'audio', name: 'v.wav', dur: 8 });
  const id = s.get().selection, right = A.splitClip(s, id, 4, { snap: false });
  const r = s.get().project.tracks.find((t) => t.kind === 'audio').clips.find((c) => c.id === right);
  log(!!r && ('in' in r || 'offset' in r || 'srcStart' in r), 'B4 split audio: right half knows where it starts inside the file', JSON.stringify(r));
  const s2 = createStore(M.newProject()); A.addMedia(s2, tr, { id: 'm2', kind: 'audio', name: 'v.wav', dur: 8 });
  A.trimClip(s2, s2.get().selection, 'left', 3, { snap: false }); const c = s2.get().project.tracks.find((t) => t.kind === 'audio').clips[0];
  log('in' in c || 'offset' in c || 'srcStart' in c, 'B4 trim-left audio: content does not slide', JSON.stringify(c));
}
// B7 — no overlap on the same track
{
  const s = createStore(M.newProject()); tr.t = 0; A.addText(s, tr, 'a'); A.addText(s, tr, 'b');
  const [, b] = M.textTrack(s.get().project).clips; A.moveClip(s, b.id, 0.5, { snap: false });
  const [a2, b2] = M.textTrack(s.get().project).clips; log(b2.start >= a2.start + a2.dur - 1e-6, 'B7 moving a clip onto another clip on the same track is prevented', `b.start=${b2.start}`);
}
// B2 / B3 / B8 — export pipeline (static checks of engine/export.js)
{
  const src = here('../../engine/export.js'), job = src.slice(src.indexOf('export async function createMediabunnyJob'));
  log(!/WebmOutputFormat/.test(job), 'B3 uses the real Mediabunny class name WebMOutputFormat');
  const iStart = job.indexOf('output.start()'), iAudio = job.indexOf('addAudioTrack');
  log(iAudio >= 0 && iStart > iAudio, 'B2 audio track is added BEFORE output.start()', `start@${iStart} addAudioTrack@${iAudio}`);
  log(/opus/.test(job) && /isConfigSupported/.test(src), 'B8 falls back to Opus when AAC is not supported');
}
console.log(failed ? `\n${failed} known bug check(s) still failing` : '\nall known-bug checks pass'); process.exit(failed ? 1 : 0);
