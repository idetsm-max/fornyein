// Stage 5 module: fonts (GitHub), colors, per-aspect text position, Zawgyi -> Unicode.
// Loaded by app.html via import('/ext/style.js'); talks to the app through window.FN.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;

function mk(tag, props = {}, kids = []) {
  const e = Object.assign(document.createElement(tag), props);
  kids.forEach((k) => e.append(k)); return e;
}
const extra = $('extra');

// ---------- 1. Fonts: system fallback + files listed in /fonts/fonts.json ----------
const fontSel = mk('select', { id: 'fontSel', title: 'Font' });
const families = new Set();
function addFamily(name, label) { if (families.has(name)) return; families.add(name); fontSel.add(new Option(label || name, name)); }

async function loadFonts() {
  addFamily('Noto Sans Myanmar', 'Noto Sans Myanmar (စနစ်ထဲက)');
  let list = [], missing = [];
  try { list = (await (await fetch('/fonts/fonts.json')).json()).fonts || []; } catch {}
  for (const f of list) {
    try {
      const ff = new FontFace(f.family, `url(/fonts/${encodeURI(f.file)})`, { weight: String(f.weight || 400) });
      await ff.load(); document.fonts.add(ff);
      families.delete(f.family); // let the loaded file replace a same-named system entry
      for (const o of [...fontSel.options]) if (o.value === f.family) o.remove();
      addFamily(f.family, f.name + (f.myanmarFull === false ? ' (မြန်မာစာ မပြည့်စုံ)' : ''));
    } catch { missing.push(f.file); }
  }
  if (missing.length) console.info('Font file မတွေ့သေး:', missing);
  const cur = P().style.font;
  if (cur && !families.has(cur)) addFamily(cur);
  fontSel.value = cur || 'Noto Sans Myanmar';
}
fontSel.onchange = async () => {
  P().style.font = fontSel.value;
  try { await document.fonts.load(`40px "${fontSel.value}"`, 'မြန်မာ'); } catch {}
  FN.save(); FN.redraw();
};
$('font').style.display = 'none';
$('font').before(fontSel);

// ---------- 2. Colors ----------
const st = () => P().style;
const fill = mk('input', { type: 'color', value: st().fill || '#ffffff', title: 'စာအရောင်' });
const stroke = mk('input', { type: 'color', value: st().stroke || '#000000', title: 'အနားကွပ်အရောင်' });
fill.oninput = () => { st().fill = fill.value; FN.save(); FN.redraw(); };
stroke.oninput = () => { st().stroke = stroke.value; FN.save(); FN.redraw(); };
extra.append(mk('span', { className: 'mut', textContent: 'စာ' }), fill, mk('span', { className: 'mut', textContent: 'အနား' }), stroke);

// ---------- 3. Position stored per aspect ratio, drag on the preview ----------
const key = () => P().output.size.split(' ')[0];
function layout() {
  const p = P(); p.layout = p.layout || {};
  return p.layout[key()] || { x: 50, y: p.style.yPct || 80 };
}
function setLayout(x, y) { P().layout = P().layout || {}; P().layout[key()] = { x: +x.toFixed(1), y: +y.toFixed(1) }; }

FN.drawSubtitle = (c, W, H, s) => {
  const S = st(), L = layout(), fs = Math.round(H * S.sizePct / 100), cx = W * L.x / 100;
  c.font = `${fs}px "${S.font}", sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = fs / 7; c.strokeStyle = S.stroke || '#000'; c.fillStyle = S.fill || '#fff';
  const maxW = Math.min(W * 0.9, 2 * Math.min(cx, W - cx));
  const lines = FN.wrap(c, s.text, maxW), lh = fs * 1.5, y0 = H * L.y / 100 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => { c.strokeText(l, cx, y0 + i * lh); c.fillText(l, cx, y0 + i * lh); });
};

let dragging = false;
function moveTo(e) {
  const r = FN.cv.getBoundingClientRect();
  let x = (e.clientX - r.left) / r.width * 100; const y = (e.clientY - r.top) / r.height * 100;
  if (Math.abs(x - 50) < 2) x = 50;                                  // snap to center
  setLayout(Math.max(5, Math.min(95, x)), Math.max(5, Math.min(95, y)));
  $('ypos').value = layout().y; FN.save(); FN.redraw();
}
FN.cv.style.touchAction = 'none';
FN.cv.addEventListener('pointerdown', (e) => { dragging = true; FN.cv.setPointerCapture(e.pointerId); moveTo(e); });
FN.cv.addEventListener('pointermove', (e) => { if (dragging) moveTo(e); });
FN.cv.addEventListener('pointerup', () => { dragging = false; });
$('ypos').addEventListener('input', () => { setLayout(layout().x, parseFloat($('ypos').value) || 80); FN.redraw(); });
extra.append(mk('span', { className: 'mut', textContent: '(စာတန်းကို preview ပေါ်မှာ ဆွဲရွှေ့လို့ရ၊ aspect တစ်ခုချင်းစီ သီးသန့်မှတ်)' }));

// ---------- 4. Zawgyi -> Unicode (rabbit-node, MIT) ----------
const isZawgyi = (s) =>
  /[\u1060-\u1097]/.test(s) ||
  /(^|[^\u1000-\u1021\u103b-\u103e\u102c-\u1032\u1036\u1037])\u1031[\u1000-\u1021]/.test(s);

let rabbitP;
function loadRabbit() {
  if (window.Rabbit?.zg2uni) return Promise.resolve(window.Rabbit);
  rabbitP = rabbitP || new Promise((res, rej) => {
    const s = mk('script', { src: 'https://cdn.jsdelivr.net/npm/rabbit-node@1.0.3/dist/rabbit.min.js' });
    s.onload = () => (window.Rabbit?.zg2uni ? res(window.Rabbit) : rej(new Error('Rabbit မတွေ့')));
    s.onerror = () => rej(new Error('Rabbit ဒေါင်းမရ'));
    document.head.append(s);
  });
  return rabbitP;
}
async function convertText(ask) {
  const ta = $('txt'), text = ta.value;
  if (!text.trim()) return;
  if (ask && !isZawgyi(text)) return;
  if (ask && !confirm('ဒီစာသားက Zawgyi ပုံစံ ဖြစ်နိုင်ပါတယ်။ Unicode ပြောင်းမလား?\n(100% မှန်မယ်လို့ အာမမခံပါ၊ ပြောင်းပြီး ကြည့်ပါ)')) return;
  try {
    const R = await loadRabbit(); ta.value = R.zg2uni(text);
    FN.setStatus('Zawgyi → Unicode ပြောင်းပြီး — စာသားကို ကြည့်ပြီး မှန်မမှန် စစ်ပါ');
  } catch (e) { FN.setStatus('ပြောင်းမရ: ' + e.message); }
}
$('txt').addEventListener('paste', () => setTimeout(() => convertText(true), 0));
const zgBtn = mk('button', { textContent: 'Zawgyi → Unicode', title: 'စာသားကို Zawgyi လို့ သတ်မှတ်ပြီး ပြောင်းမယ်' });
zgBtn.onclick = () => convertText(false);
$('split').after(zgBtn);

await loadFonts();
FN.redraw();
