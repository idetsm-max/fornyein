// Stage 13 module: Credits — title card (poem title / author / reader) at the start, and/or a small corner credit.
// Drawn inside the one drawFrame, so Preview = Export. Wraps FN.drawBackground (under the subtitles) and FN.drawSubtitle.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }

const DEF = { author: '', reader: '', poem: '', labelAuthor: 'ကဗျာ', labelReader: 'ဖတ်သူ',
  titleCard: true, titleDur: 3, hideSubs: true, corner: false, pos: 'bl', sizePct: 3.2 };
function C() { const p = P(); p.credits = p.credits || {}; for (const k in DEF) if (p.credits[k] === undefined) p.credits[k] = DEF[k]; return p.credits; }
const creditLines = (cc) => {
  const out = [];
  if (cc.author.trim()) out.push(`${cc.labelAuthor} — ${cc.author.trim()}`);
  if (cc.reader.trim()) out.push(`${cc.labelReader} — ${cc.reader.trim()}`);
  return out;
};

// one line of text with the subtitle style, shrunk to fit maxW
function paint(c, text, x, y, fs, align, maxW) {
  const S = P().style;
  c.font = `${fs}px "${S.font}", sans-serif`;
  const w = c.measureText(text).width; if (w > maxW) { fs *= maxW / w; c.font = `${fs}px "${S.font}", sans-serif`; }
  c.textAlign = align; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = fs / 7;
  c.strokeStyle = S.stroke || '#000'; c.fillStyle = S.fill || '#fff';
  c.strokeText(text, x, y); c.fillText(text, x, y);
}

function drawTitle(c, W, H, t, cc) {
  if (!cc.titleCard || t >= cc.titleDur) return;
  const ls = creditLines(cc), poem = cc.poem.trim(); if (!poem && !ls.length) return;
  const a = Math.max(0, Math.min(1, t / 0.4, (cc.titleDur - t) / 0.5));
  const items = []; if (poem) items.push([poem, H * 0.075]); ls.forEach((l) => items.push([l, H * 0.045]));
  const lh = (fs) => fs * 1.5, total = items.reduce((s, [, fs]) => s + lh(fs), 0);
  c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
  let y = H / 2 - total / 2;
  for (const [text, fs] of items) { paint(c, text, W / 2, y + lh(fs) / 2, fs, 'center', W * 0.86); y += lh(fs); }
  c.restore();
}
function drawCorner(c, W, H, cc) {
  if (!cc.corner) return; const ls = creditLines(cc); if (!ls.length) return;
  const fs = H * cc.sizePct / 100, m = Math.min(W, H) * 0.035, left = cc.pos.endsWith('l'), top = cc.pos.startsWith('t'), lh = fs * 1.4;
  ls.forEach((l, i) => {
    const y = top ? m + fs / 2 + i * lh : H - m - fs / 2 - (ls.length - 1 - i) * lh;
    paint(c, l, left ? m : W - m, y, fs, left ? 'left' : 'right', W * 0.5);
  });
}

const bg = FN.drawBackground;
FN.drawBackground = (c, W, H, t) => { if (bg) bg(c, W, H, t); const cc = C(); drawTitle(c, W, H, t, cc); drawCorner(c, W, H, cc); };
const sub = FN.drawSubtitle;
FN.drawSubtitle = (c, W, H, s, t) => {
  const cc = C(); if (cc.titleCard && cc.hideSubs && t < cc.titleDur && (cc.poem.trim() || creditLines(cc).length)) return;
  if (sub) sub(c, W, H, s, t);
};

// ---------- UI ----------
const card = mk('div', { className: 'card' }); card.style.marginTop = '14px';
$('extra').closest('.card').after(card);
function text(label, key, w) {
  const i = mk('input', { value: C()[key] }); i.style.width = w || '150px';
  i.oninput = () => { C()[key] = i.value; FN.save(); FN.redraw(); };
  return mk('label', { className: 'mut' }, [label + ' ', i]);
}
function num(label, key, min, max, step) {
  const i = mk('input', { type: 'number', min, max, step, value: C()[key] }); i.style.width = '70px';
  i.oninput = () => { C()[key] = parseFloat(i.value) || DEF[key]; FN.save(); FN.redraw(); };
  return mk('label', { className: 'mut' }, [label + ' ', i]);
}
function chk(label, key) {
  const i = mk('input', { type: 'checkbox', checked: !!C()[key] });
  i.onchange = () => { C()[key] = i.checked; FN.save(); FN.redraw(); };
  return mk('label', { className: 'mut' }, [i, ' ' + label]);
}
function build() {
  card.textContent = ''; card.append(mk('b', { textContent: 'Credits (စာရေးသူ / ဖတ်သူ)' }));
  const r1 = mk('div', { className: 'row' }), r2 = mk('div', { className: 'row' }), r3 = mk('div', { className: 'row' });
  r1.append(text('ကဗျာခေါင်းစဉ်', 'poem', '200px'), text('စာရေးသူ', 'author'), text('ဖတ်သူ', 'reader'));
  r2.append(chk('Title card (အစမှာ)', 'titleCard'), num('ကြာချိန် s', 'titleDur', 1, 15, 0.5), chk('Title card အတွင်း စာတန်းမပြ', 'hideSubs'));
  const pos = mk('select'); [['bl', 'ဘယ်အောက်'], ['br', 'ညာအောက်'], ['tl', 'ဘယ်ပေါ်'], ['tr', 'ညာပေါ်']].forEach(([v, l]) => pos.add(new Option(l, v)));
  pos.value = C().pos; pos.onchange = () => { C().pos = pos.value; FN.save(); FN.redraw(); };
  r3.append(chk('ထောင့်မှာ ပြ', 'corner'), mk('label', { className: 'mut' }, ['နေရာ ', pos]), num('အရွယ် %', 'sizePct', 1.5, 8, 0.1), text('"ကဗျာ" label', 'labelAuthor', '70px'), text('"ဖတ်သူ" label', 'labelReader', '70px'));
  card.append(r1, r2, r3, mk('div', { className: 'mut', style: 'margin-top:6px', textContent: 'Title card က အသံအစ ၀ စက္ကန့်ကနေ စာတန်းအောက်မှာ ပေါ်ပါတယ်၊ အသံကို မရွှေ့ပါဘူး။ ဒါကြောင့် ကဗျာဖတ်သံ အစစောရင် Title card နဲ့ ထပ်နိုင်ပါတယ်။' }));
}
let lastP = P(); build(); FN.redraw();
setInterval(() => { if (P() !== lastP) { lastP = P(); build(); FN.redraw(); } }, 500);
