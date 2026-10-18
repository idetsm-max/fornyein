// Per-subtitle style panel (right side, "ပုံစံ" tab): the SELECTED subtitle can have its own colours, stroke and animation,
// instead of one setting for all of them.  Stored on the subtitle:  s.style = {fill, fill2, k, stroke, strokeOn}   s.anim = {in, out, dur}
// effects.js draws it.  "Global အတိုင်း" = nothing stored, the global setting is used.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const seg = new Intl.Segmenter('my', { granularity: 'word' });
const nWords = (t) => [...seg.segment(t)].filter((g) => g.isWordLike).length;
const selIdx = () => [...$('list').children].findIndex((r) => r.classList.contains('sel'));
const A = window.FN_ANIMS || { in: [['fade', 'Fade']], out: [['fade', 'Fade']] };

const pane = (document.querySelectorAll('.side')[1] || document.body).querySelector('.pane') || document.body;
const card = mk('div', { className: 'card' }); pane.append(card);
const lab = (text, ...kids) => mk('label', { className: 'mut' }, [text + ' ', ...kids]);
const row = (...k) => mk('div', { className: 'row' }, k);
const colorIn = (value, onInput) => { const i = mk('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff' }); i.oninput = () => onInput(i.value); return i; };

function build() {
  card.textContent = ''; card.append(mk('b', { textContent: 'ရွေးထားတဲ့ စာတန်း — ပုံစံ' }));
  const i = selIdx(), s = P().subtitles[i];
  if (!s) { card.append(mk('div', { className: 'mut', style: 'margin-top:6px;line-height:1.7', textContent: 'စာတန်းတစ်ကြောင်းချင်းစီကို သီးသန့် အရောင်၊ Stroke၊ Animation ပြောင်းချင်ရင် "စာသား" tab ထဲက စာတန်းစာရင်းမှာ (သို့ Timeline ပေါ်က အပြာတန်းကို) တစ်ကြောင်း ရွေးပါ။' })); return; }
  const G = P().style, st = () => (s.style = s.style || {});
  const touch = () => { FN.save(); FN.redraw(); };
  card.append(mk('div', { className: 'mut', style: 'margin:4px 0', textContent: `${i + 1}. ${s.text.length > 44 ? s.text.slice(0, 44) + '…' : s.text}` }));

  // --- colours ---
  const two = !!(s.style && s.style.fill2), words = nWords(s.text);
  const c1 = colorIn((s.style && s.style.fill) || G.fill || '#ffffff', (v) => { st().fill = v; touch(); });
  const r1 = row(lab(two ? 'အရှေ့စာ အရောင်' : 'စာအရောင်', c1));
  const tw = mk('input', { type: 'checkbox', checked: two });
  tw.onchange = () => { FN.snap(); if (tw.checked) { st().fill2 = st().fill2 || '#ffd166'; st().k = Math.ceil(words / 2); } else { delete st().fill2; delete st().k; } touch(); build(); };
  r1.append(mk('label', { className: 'mut' }, [tw, ' အရောင်နှစ်မျိုး (အရှေ့/အနောက်)']));
  card.append(r1);
  if (two) {
    const c2 = colorIn(s.style.fill2, (v) => { st().fill2 = v; touch(); });
    const k = mk('input', { type: 'number', min: 0, max: words, step: 1, value: s.style.k ?? Math.ceil(words / 2) }); k.style.width = '64px';
    k.oninput = () => { st().k = Math.max(0, Math.min(words, parseInt(k.value, 10) || 0)); touch(); };
    card.append(row(lab('အနောက်စာ အရောင်', c2), lab(`အရှေ့ စာလုံး (စုစုပေါင်း ${words}) လုံးက အရှေ့အရောင်`, k)));
  }

  // --- stroke ---
  const on = (s.style && s.style.strokeOn !== undefined ? s.style.strokeOn : G.strokeOn) !== false;
  const sc = mk('input', { type: 'checkbox', checked: on });
  const sk = colorIn((s.style && s.style.stroke) || G.stroke || '#000000', (v) => { st().stroke = v; touch(); });
  sc.onchange = () => { FN.snap(); st().strokeOn = sc.checked; touch(); };
  card.append(row(mk('label', { className: 'mut' }, [sc, ' Stroke (အနားကွပ်) ပါ']), lab('Stroke အရောင်', sk)));

  // --- animation (empty = global) ---
  const an = s.anim || {}, G2 = P().anim || {};
  const mkSel = (list, cur, key) => {
    const sel = mk('select'); sel.add(new Option('Global အတိုင်း' + (G2[key] ? ` (${G2[key]})` : ''), ''));
    list.forEach(([k, l]) => sel.add(new Option(l, k))); sel.value = cur || '';
    sel.onchange = () => { FN.snap(); s.anim = s.anim || {}; if (sel.value) s.anim[key] = sel.value; else delete s.anim[key]; if (!Object.keys(s.anim).length) delete s.anim; touch(); };
    return sel;
  };
  const dur = mk('input', { type: 'number', min: 0.05, max: 2, step: 0.05, value: an.dur ?? '', placeholder: 'global' }); dur.style.width = '70px';
  dur.oninput = () => { s.anim = s.anim || {}; const v = parseFloat(dur.value); if (v > 0) s.anim.dur = v; else delete s.anim.dur; if (!Object.keys(s.anim).length) delete s.anim; touch(); };
  card.append(row(lab('Animation ဝင်', mkSel(A.in, an.in, 'in')), lab('ထွက်', mkSel(A.out, an.out, 'out')), lab('ကြာ s', dur)));

  // --- actions ---
  const acts = row(
    mk('button', { textContent: 'Global ပြန်သုံး', title: 'ဒီစာတန်းရဲ့ သီးသန့်ပုံစံကို ဖယ်ပြီး Global အတိုင်း ပြန်လုပ်', onclick: () => { FN.snap(); delete s.style; delete s.anim; touch(); build(); } }),
    mk('button', { textContent: 'အားလုံးကို သက်ရောက်', title: 'ဒီစာတန်းရဲ့ အရောင်/Stroke/Animation ကို စာတန်းအားလုံးကို ကူးမယ်', onclick: () => {
      FN.snap(); P().subtitles.forEach((x) => { if (s.style) x.style = JSON.parse(JSON.stringify(s.style)); else delete x.style; if (s.anim) x.anim = { ...s.anim }; else delete x.anim; }); touch(); FN.setStatus('စာတန်းအားလုံးကို သက်ရောက်ပြီး'); } }));
  card.append(acts);
  const A1 = colorIn('#ffffff', () => {}), B1 = colorIn('#ffd166', () => {});
  card.append(row(mk('span', { className: 'mut', textContent: 'အလှည့်ကျ အရောင် (စာတန်းတစ်ကြောင်းကျော်စီ)' }), A1, B1,
    mk('button', { textContent: 'သက်ရောက်', onclick: () => { FN.snap(); P().subtitles.forEach((x, j) => { x.style = x.style || {}; x.style.fill = j % 2 ? B1.value : A1.value; delete x.style.fill2; delete x.style.k; }); touch(); build(); } })));
}
let key = '';
function tick() { const i = selIdx(), k = i + '|' + (P().subtitles.length) + '|' + (P().subtitles[i] ? 1 : 0); if (k !== key) { key = k; build(); } }
let lastP = P(); setInterval(() => { if (P() !== lastP) { lastP = P(); key = ''; } tick(); }, 300); build();
