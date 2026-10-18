// Voice cutting on the timeline.  Pick a range (Alt + drag on the blue voice clip, or [ and ] keys / buttons) and cut it out:
// the rest of the voice closes up (ripple delete) and, when "စာတန်းပါလိုက်" is on, the subtitles after the cut move left with it.
// The original recording is never changed: the project stores which parts are KEPT (P.keep), Undo (Ctrl+Z) brings the part back.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
const r2 = (x) => Math.round(x * 100) / 100;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }

// remove edited-time range [e1,e2] from a list of kept raw ranges
function cutEdited(keep, e1, e2) {
  const out = []; let pos = 0;
  for (const [a, b] of keep) {
    const s = pos, e = pos + (b - a);
    if (e2 <= s || e1 >= e) out.push([a, b]);
    else { if (e1 > s) out.push([a, a + (e1 - s)]); if (e2 < e) out.push([a + (e2 - s), b]); }
    pos = e;
  }
  return out.filter(([a, b]) => b - a > 0.005);
}
// close the gap [t1,t2] in the subtitle timeline
function ripple(subs, t1, t2) {
  const L = t2 - t1, out = [];
  for (const s of subs) {
    const st = s.start, en = s.end;
    if (en <= t1) { out.push(s); continue; }
    if (st >= t2) { s.start = r2(st - L); s.end = r2(en - L); out.push(s); continue; }
    if (st >= t1 && en <= t2) continue;                       // completely inside the cut: removed
    if (st < t1 && en > t2) { s.end = r2(en - L); out.push(s); continue; }
    if (st < t1) { s.end = r2(t1); out.push(s); continue; }
    s.start = r2(t1); s.end = r2(en - L); out.push(s);
  }
  return out;
}
const range = () => { const m = FN.mark; return m && m.a != null && m.b != null ? [Math.min(m.a, m.b), Math.max(m.a, m.b)] : null; };

function doCut(a, b) {
  const raw = FN.rawAudio, au = FN.audio, p = P();
  if (!raw || !au) { FN.setStatus('ကဗျာဖတ်သံ အရင်ရွေးပါ'); return; }
  if (p.media.mainIsVideo) { FN.setStatus('Video ဖိုင်ကို ပင်မအသံအဖြစ် သုံးထားရင် ဖြတ်လို့မရသေးပါ (Audio ဖိုင်မှာပဲ ရပါတယ်)'); return; }
  const off = p.audioOffset || 0, t1 = Math.max(a, off), t2 = Math.min(b, off + au.duration), L = t2 - t1;
  if (L < 0.02) { FN.setStatus('ဖြတ်မယ့်အပိုင်းက ကဗျာဖတ်သံထဲ မဝင်ပါ (Alt + ဆွဲပြီး ရွေးပါ)'); return; }
  const keep = p.keep && p.keep.length ? p.keep : [[0, raw.duration]], next = cutEdited(keep, t1 - off, t2 - off);
  if (!next.length) { FN.setStatus('အကုန်လုံး ဖြတ်လို့မရပါ'); return; }
  FN.snap();
  p.keep = next;
  if (p.followSubs !== false) p.subtitles = ripple(p.subtitles, t1, t2);
  FN.rebuildAudio(); FN.mark = null; FN.changed();
  FN.setStatus(`ဖြတ်ထုတ်ပြီး — ${L.toFixed(2)} s (Ctrl+Z နဲ့ ပြန်ယူလို့ရ)`);
}
const cutMarked = () => { const r = range(); if (!r) { FN.setStatus('ဖြတ်မယ့်အပိုင်း ရွေးပါ — Alt + ဆွဲ၊ ဒါမှမဟုတ် [ နဲ့ ] ခလုတ်'); return; } doCut(r[0], r[1]); };
const setIn = () => { FN.mark = { a: FN.nowT(), b: FN.mark ? FN.mark.b : null }; FN.redraw(); };
const setOut = () => { FN.mark = { a: FN.mark ? FN.mark.a : null, b: FN.nowT() }; FN.redraw(); };
const trimStart = () => { const off = P().audioOffset || 0, t = FN.nowT(); if (t <= off) { FN.setStatus('Playhead က ကဗျာဖတ်သံ စတဲ့နေရာထက် နောက်မှာ ထားပါ'); return; } doCut(off, t); };
const trimEnd = () => { const au = FN.audio; if (!au) return; const off = P().audioOffset || 0, t = FN.nowT(); if (t >= off + au.duration) { FN.setStatus('Playhead က ကဗျာဖတ်သံ အဆုံးထက် အရင်မှာ ထားပါ'); return; } doCut(t, off + au.duration); };

// ---------- UI: a "✂ ဖြတ်" popover in the timeline bar ----------
const bar = document.querySelector('.tl .bar');
const pop = mk('div', { className: 'row' }, [
  mk('button', { textContent: '[ အစ', title: 'Playhead ကို ဖြတ်မယ့်အပိုင်း အစအဖြစ် မှတ် ( [ )', onclick: setIn }),
  mk('button', { textContent: 'အဆုံး ]', title: 'Playhead ကို အဆုံးအဖြစ် မှတ် ( ] )', onclick: setOut }),
  mk('button', { textContent: '▶ နားထောင်', title: 'ဖြတ်မယ့်အပိုင်းကို ဖွင့်ကြည့်', onclick: () => { const r = range(); if (r) FN.play(r[0], r[1]); } }),
  mk('button', { className: 'pri', textContent: '✂ ဖြတ်ထုတ် (X)', onclick: cutMarked }),
  mk('button', { textContent: 'ရှေ့ကို ဖြတ်', title: 'ကဗျာဖတ်သံ အစကနေ Playhead အထိ ဖြတ်ထုတ်', onclick: trimStart }),
  mk('button', { textContent: 'နောက်ကို ဖြတ်', title: 'Playhead ကနေ အဆုံးအထိ ဖြတ်ထုတ်', onclick: trimEnd }),
  mk('button', { textContent: 'Mark ဖျက်', onclick: () => { FN.mark = null; FN.redraw(); } }),
  mk('div', { className: 'mut', style: 'width:100%;line-height:1.6', textContent: 'Alt + ဆွဲ (အပြာဘောင်ပေါ်) = ဖြတ်မယ့်အပိုင်း ရွေး · ဖြတ်ပြီးရင် အနောက်ကအပိုင်း ကပ်လာမယ် · Ctrl+Z = ပြန်ယူ · မူရင်းအသံ မပျက်ပါဘူး' }),
]);
const det = mk('details', { className: 'tlset' }, [mk('summary', { textContent: '✂ ဖြတ်' }), pop]);
if (bar) bar.insertBefore(det, bar.querySelector('.tlset')); else document.body.append(det);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.code === 'BracketLeft') setIn(); else if (e.code === 'BracketRight') setOut();
  else if (e.code === 'KeyX') cutMarked(); else if (e.code === 'Escape' && FN.mark) { FN.mark = null; FN.redraw(); }
});
