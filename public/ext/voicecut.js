// Voice-clip tools (timeline toolbar, "✂ ဖြတ်"). The clip engine itself lives in app.html (FN.voice):
//   split at the playhead · trim by dragging a clip edge · move · delete (gap) · delete + close the gap · delete left / right of the playhead.
// This module adds the RANGE tools: mark an In / Out range ( [  ]  or Alt+drag on the voice lane ) and cut it out.
//   X = cut the marked range and close the gap · Shift+X = cut it but leave a gap · Esc = clear the mark.
const FN = window.FN;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);

function setMark(which) {
  const t = FN.nowT(), m = { ...(FN.mark || {}) }; m[which] = t;
  if (m.a != null && m.b != null && m.a > m.b) { const x = m.a; m.a = m.b; m.b = x; }
  FN.mark = { a: m.a ?? null, b: m.b ?? null }; FN.redraw();
}
function range() {
  const m = FN.mark;
  if (!m || m.a == null || m.b == null || Math.abs(m.b - m.a) < 0.02) { FN.setStatus('ဖြတ်မယ့်အပိုင်း ရွေးပါ ( [  ] ခလုတ် သို့ Alt + ဆွဲ )'); return null; }
  return [Math.min(m.a, m.b), Math.max(m.a, m.b)];
}
function cut(ripple) {
  const r = range(); if (!r) return;
  if (FN.voice.cut(r[0], r[1], ripple)) { FN.mark = null; FN.setStatus(`ဖြတ်ထုတ်ပြီး — ${(r[1] - r[0]).toFixed(2)} s${ripple ? '' : ' (ကွက်လပ်ချန်ထား)'}`); FN.redraw(); }
}
const listen = () => { const r = range(); if (r) FN.play(r[0], r[1]); };

const bar = document.querySelector('.tl .bar');
if (bar) {
  const b = (text, title, fn) => mk('button', { textContent: text, title, onclick: fn });
  const row = mk('div', { className: 'row' }, [
    b('[ In', 'Playhead မှာ စမှတ် ( [ )', () => setMark('a')), b('Out ]', 'Playhead မှာ အဆုံးမှတ် ( ] )', () => setMark('b')),
    b('▶ နားထောင်', 'ရွေးထားတဲ့အပိုင်းကို ဖွင့်ကြည့်', listen),
    b('✂ ဖြတ်ထုတ်', 'ဖြတ်ပြီး ကွက်လပ်ပိတ် ( X )', () => cut(true)), b('✂ ဖြတ် (ကွက်လပ်ချန်)', 'ဖြတ်ပြီး ကွက်လပ်ချန် ( Shift+X )', () => cut(false)),
    b('ရှေ့ဖြတ်', 'Playhead ရဲ့ ဘယ်ဘက်ကို ဖြတ်ထုတ် ( Q )', () => FN.voice.trim('left', FN.nowT(), true)), b('နောက်ဖြတ်', 'Playhead ရဲ့ ညာဘက်ကို ဖြတ်ထုတ် ( W )', () => FN.voice.trim('right', FN.nowT(), true)),
    b('Mark ဖျက်', 'ရွေးထားတာ ဖျက် ( Esc )', () => { FN.mark = null; FN.redraw(); }),
  ]);
  const box = mk('details', { className: 'tlset' }, [mk('summary', { textContent: '✂ ဖြတ်' }), row]);
  const before = bar.querySelector('.tlset');
  bar.insertBefore(box, before);
}
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
  if (e.code === 'BracketLeft') setMark('a');
  else if (e.code === 'BracketRight') setMark('b');
  else if (e.code === 'KeyX') cut(!e.shiftKey);
});
