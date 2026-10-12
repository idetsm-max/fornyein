// Stage 9 module: 15 Canvas-2D text effects, in/out animations, presets.
// Replaces FN.drawSubtitle. Deterministic: output depends only on (t, params) — no Math.random.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const rnd = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }; // seeded hash
const seg = new Intl.Segmenter('my', { granularity: 'word' });
const EASE = { out: (x) => 1 - Math.pow(1 - x, 3), back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); } };

// [id, label, needsTest]  (needsTest = Myanmar text still to be verified)
const FXLIST = [
  ['outline', 'Outline', 0], ['shadow', 'Shadow', 0], ['longshadow', 'Long Shadow', 1], ['glow', 'Glow', 0], ['neon', 'Neon', 0],
  ['gradient', 'Gradient', 0], ['gold', 'Gold / Metallic', 1], ['emboss', '3D / Emboss', 1], ['float', 'Float', 0], ['pulse', 'Pulse', 0],
  ['shimmer', 'Shimmer', 0], ['flicker', 'Neon Flicker', 0], ['shake', 'Shake', 1], ['wave', 'Wave', 1], ['glitch', 'Glitch', 1],
];
const ANIMS_IN = [['none', 'None'], ['fade', 'Fade'], ['slideUp', 'Slide ↑'], ['slideDown', 'Slide ↓'], ['slideLeft', 'Slide ←'], ['slideRight', 'Slide →'], ['zoom', 'Zoom'], ['pop', 'Pop'], ['blur', 'Blur'], ['typewriter', 'Typewriter'], ['word', 'Word reveal']];
const ANIMS_OUT = ANIMS_IN.filter(([k]) => !['typewriter', 'word'].includes(k));

// ---------- animation state ----------
function applyAnim(kind, pr, dir, fs, st) {
  const p = EASE.out(pr);
  switch (kind) {
    case 'fade': st.alpha *= p; break;
    case 'slideUp': st.dy += dir * (1 - p) * fs * 1.2; st.alpha *= clamp(p * 1.5); break;
    case 'slideDown': st.dy -= dir * (1 - p) * fs * 1.2; st.alpha *= clamp(p * 1.5); break;
    case 'slideLeft': st.dx += dir * (1 - p) * fs * 3; st.alpha *= clamp(p * 1.5); break;
    case 'slideRight': st.dx -= dir * (1 - p) * fs * 3; st.alpha *= clamp(p * 1.5); break;
    case 'zoom': st.sc *= 0.6 + 0.4 * p; st.alpha *= p; break;
    case 'pop': st.sc *= dir > 0 ? EASE.back(pr) : p; st.alpha *= clamp(pr * 3); break;
    case 'blur': st.blur = Math.max(st.blur, (1 - p) * fs * 0.25); st.alpha *= p; break;
    case 'typewriter': case 'word': if (dir > 0) st.reveal = kind; else st.alpha *= p; break;
  }
}

// ---------- one text line, all effect passes ----------
function paintLine(c, txt, x, y, w, fs, t, S, I) {
  const fill = S.fill || '#ffffff', stroke = S.stroke || '#000000', glowC = S.glow || '#8fd0ff';
  const ga = c.globalAlpha, wave = I('wave');
  const fl = I('flicker'), flk = fl && rnd(Math.floor(t * 18)) > 1 - 0.3 * fl ? 0.35 : 1;
  c.globalAlpha = ga * flk;
  // per-syllable drawing only for Wave (position by measureText of the prefix)
  const put = (kind, dx = 0, dy = 0) => {
    if (!wave) { kind === 'fill' ? c.fillText(txt, x + dx, y + dy) : c.strokeText(txt, x + dx, y + dy); return; }
    let pre = ''; FN.syllables(txt).forEach((u, k) => {
      const ox = c.measureText(pre).width, oy = Math.sin(t * 2 * Math.PI * 1.1 + k * 0.7) * fs * 0.12 * wave;
      kind === 'fill' ? c.fillText(u, x + ox + dx, y + oy + dy) : c.strokeText(u, x + ox + dx, y + oy + dy); pre += u;
    });
  };
  const fillStyle = () => {
    const sh = I('shimmer'), gold = I('gold'), gr = I('gradient');
    const vert = (stops) => { const g = c.createLinearGradient(0, y - fs * 0.6, 0, y + fs * 0.6); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
    if (sh) {
      const base = gold ? '#e8b923' : fill, pc = ((t * 0.5) % 1.5 - 0.25), bw = 0.1 + 0.12 * sh, g = c.createLinearGradient(x, 0, x + Math.max(w, 1), 0);
      g.addColorStop(0, base); g.addColorStop(clamp(pc - bw), base); g.addColorStop(clamp(pc), '#ffffff'); g.addColorStop(clamp(pc + bw), base); g.addColorStop(1, base); return g;
    }
    if (gold) return vert([[0, '#fff6c2'], [0.45, '#e8b923'], [0.55, '#9a6a00'], [1, '#ffe48a']]);
    if (gr) return vert([[0, fill], [1, '#6fb1ff']]);
    return fill;
  };
  const oStr = I('outline'), sw = fs / 7 * (oStr ? 0.5 + 1.5 * oStr : 1);
  c.lineWidth = sw; c.strokeStyle = I('gold') ? '#4a2f00' : stroke;
  // long shadow
  const ls = I('longshadow');
  if (ls) { c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = Math.round(6 + 24 * ls); i >= 1; i--) put('fill', i * 0.9, i * 0.9); }
  // emboss
  const em = I('emboss');
  if (em) { const d = 1 + fs * 0.025 * em; c.fillStyle = 'rgba(255,255,255,.8)'; put('fill', -d, -d); c.fillStyle = 'rgba(0,0,0,.8)'; put('fill', d, d); }
  // glitch (seeded windows)
  const gl = I('glitch'), gf = Math.floor(t * 14);
  if (gl && rnd(gf) > 1 - 0.45 * gl) { const d = fs * 0.05 * gl * (1 + rnd(gf + 7)); c.globalAlpha = ga * flk * 0.85; c.fillStyle = '#ff2d55'; put('fill', -d, 0); c.fillStyle = '#00e5ff'; put('fill', d, 0); c.globalAlpha = ga * flk; }
  // neon halo
  const nn = I('neon');
  if (nn) { c.shadowColor = glowC; c.fillStyle = fill; for (const b of [0.9, 0.45, 0.2]) { c.shadowBlur = fs * b * nn; put('fill'); } c.shadowBlur = 0; }
  // outline (+ soft shadow)
  const sd = I('shadow');
  if (sd) { c.shadowColor = 'rgba(0,0,0,.75)'; c.shadowBlur = fs * 0.2 * sd; c.shadowOffsetY = fs * 0.04 * sd; }
  put('stroke'); c.shadowBlur = 0; c.shadowOffsetY = 0;
  // glow
  const gw = I('glow');
  if (gw) { c.shadowColor = glowC; c.shadowBlur = fs * 0.7 * gw; c.fillStyle = fill; put('fill'); put('fill'); c.shadowBlur = 0; }
  // main fill
  c.fillStyle = fillStyle(); put('fill');
  c.globalAlpha = ga;
}

FN.drawSubtitle = (c, W, H, s, t) => {
  const p = P(), S = p.style, L = FN.layout(), fs = Math.round(H * S.sizePct / 100), cx = W * L.x / 100, cy = H * L.y / 100;
  const fx = p.fx || [], an = p.anim || { in: 'fade', out: 'fade', dur: 0.3 };
  const I = (id) => { const e = fx.find((q) => q.id === id); return e ? e.intensity : 0; };
  c.font = `${fs}px "${S.font}", sans-serif`; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
  const maxW = Math.min(W * 0.9, 2 * Math.min(cx, W - cx));
  const lines = FN.wrap(c, s.text, maxW), lh = fs * 1.5, y0 = cy - ((lines.length - 1) * lh) / 2;
  const dur = s.end - s.start, lt = t - s.start, d = Math.max(0.01, Math.min(an.dur || 0.3, dur / 2));
  const st = { alpha: 1, dx: 0, dy: 0, sc: 1, blur: 0, reveal: null };
  applyAnim(an.in, clamp(lt / d), +1, fs, st); applyAnim(an.out, clamp((dur - lt) / d), -1, fs, st);
  // motion effects (global timeline t)
  const fl = I('float'), pu = I('pulse'), sk = I('shake'), sf = Math.floor(t * 30);
  if (fl) st.dy += Math.sin(t * 2 * Math.PI * 0.5) * fs * 0.12 * fl;
  if (pu) st.sc *= 1 + 0.06 * pu * Math.sin(t * 2 * Math.PI * 1.2);
  if (sk) { st.dx += (rnd(sf * 2) - 0.5) * fs * 0.12 * sk; st.dy += (rnd(sf * 2 + 1) - 0.5) * fs * 0.12 * sk; }
  // typewriter / word reveal: how many units are visible
  const unitsOf = (line) => st.reveal === 'word' ? [...seg.segment(line)].map((z) => z.segment) : FN.syllables(line);
  let left = Infinity;
  if (st.reveal) {
    const n = lines.reduce((a, l) => a + unitsOf(l).length, 0), tw = Math.min(dur * 0.7, n * (st.reveal === 'word' ? 0.25 : 0.07));
    left = Math.floor(clamp(lt / Math.max(tw, 0.01)) * n) + (lt > 0 ? 1 : 0);
  }
  c.save();
  c.globalAlpha *= clamp(st.alpha);
  if (st.blur > 0.5) c.filter = `blur(${st.blur.toFixed(1)}px)`;
  c.translate(cx + st.dx, cy + st.dy); c.scale(st.sc, st.sc); c.translate(-cx, -cy);
  // background bar
  if (S.box && S.box.on) {
    const bw = Math.max(...lines.map((l) => c.measureText(l).width)) + fs * 0.9, bh = lines.length * lh + fs * 0.3;
    const ga = c.globalAlpha; c.globalAlpha = ga * (S.box.alpha ?? 0.55); c.fillStyle = S.box.color || '#000';
    c.beginPath(); (c.roundRect ? c.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, fs * 0.25) : c.rect(cx - bw / 2, cy - bh / 2, bw, bh)); c.fill(); c.globalAlpha = ga;
  }
  lines.forEach((line, i) => {
    const y = y0 + i * lh, w = c.measureText(line).width, x = cx - w / 2;
    let txt = line;
    if (st.reveal) { const u = unitsOf(line), k = Math.min(u.length, Math.max(0, left)); left -= k; txt = u.slice(0, k).join(''); }
    if (txt) paintLine(c, txt, x, y, w, fs, t, S, I);
  });
  c.restore();
};

// ---------- presets ----------
const PRESETS = {
  'Classic': { style: { fill: '#ffffff', stroke: '#000000', box: { on: false } }, fx: [], anim: { in: 'fade', out: 'fade', dur: 0.25 } },
  'Poem Elegant': { font: 'Noto Serif Myanmar', style: { fill: '#f6efe2', stroke: '#000000', box: { on: false } }, fx: [{ id: 'shadow', intensity: 0.6 }], anim: { in: 'fade', out: 'fade', dur: 0.6 } },
  'Boxed': { style: { fill: '#ffffff', stroke: '#000000', box: { on: true, color: '#000000', alpha: 0.55 } }, fx: [], anim: { in: 'slideUp', out: 'fade', dur: 0.3 } },
  'Glow Night': { style: { fill: '#dff3ff', stroke: '#0a1a3a', glow: '#8fd0ff', box: { on: false } }, fx: [{ id: 'glow', intensity: 0.7 }, { id: 'float', intensity: 0.3 }], anim: { in: 'fade', out: 'fade', dur: 0.5 } },
  'Typewriter': { style: { fill: '#ffffff', stroke: '#000000', box: { on: false } }, fx: [], anim: { in: 'typewriter', out: 'fade', dur: 0.3 } },
};

// ---------- UI ----------
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const card = mk('div', { className: 'card' }); card.style.marginTop = '14px';
$('extra').closest('.card').after(card);
card.append(mk('b', { textContent: 'Effect / Animation / Preset' }));
const presetRow = mk('div', { className: 'row' }); card.append(presetRow);
const animRow = mk('div', { className: 'row mut' }); card.append(animRow);
const fxGrid = mk('div', { className: 'row' }); fxGrid.style.display = 'grid'; fxGrid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(230px,1fr))'; card.append(fxGrid);
card.append(mk('div', { className: 'mut', style: 'margin-top:8px', textContent: '⚠ = မြန်မာစာနဲ့ စမ်းရန် (သရ/သတ် နေရာ မလွဲတာ ကိုယ်တိုင်စစ်ပါ)။ Effect တစ်ခုထက်မက ထပ်သုံးလို့ရပါတယ်၊ intensity slider ပါပါတယ်။ Preview နှေးရင် Glow/Neon/Shadow ကို ပိတ်ပါ။' }));

const rows = {};
for (const [id, label, test] of FXLIST) {
  const cb = mk('input', { type: 'checkbox' }), rg = mk('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.6 }); rg.style.width = '80px';
  const lab = mk('label', { className: 'mut' }, [cb, ' ' + label + (test ? ' ⚠' : ' '), rg]); lab.style.display = 'flex'; lab.style.gap = '6px'; lab.style.alignItems = 'center';
  const update = () => {
    const p = P(); p.fx = (p.fx || []).filter((e) => e.id !== id);
    if (cb.checked) p.fx.push({ id, intensity: +rg.value });
    p.fx.sort((a, b) => FXLIST.findIndex((f) => f[0] === a.id) - FXLIST.findIndex((f) => f[0] === b.id));
    FN.save(); FN.redraw();
  };
  cb.onchange = update; rg.oninput = () => { if (cb.checked) update(); };
  rows[id] = { cb, rg }; fxGrid.append(lab);
}
const selIn = mk('select'), selOut = mk('select'), durIn = mk('input', { type: 'number', min: 0.05, max: 2, step: 0.05, value: 0.3 }); durIn.style.width = '70px';
ANIMS_IN.forEach(([k, l]) => selIn.add(new Option(l, k))); ANIMS_OUT.forEach(([k, l]) => selOut.add(new Option(l, k)));
const boxCb = mk('input', { type: 'checkbox' });
animRow.append('In', selIn, 'Out', selOut, 'Duration (s)', durIn, mk('label', {}, [boxCb, ' နောက်ခံ bar']));
const setAnim = () => { P().anim = { in: selIn.value, out: selOut.value, dur: +durIn.value || 0.3 }; FN.save(); FN.redraw(); };
selIn.onchange = selOut.onchange = durIn.oninput = setAnim;
boxCb.onchange = () => { const S = P().style; S.box = { ...(S.box || { color: '#000000', alpha: 0.55 }), on: boxCb.checked }; FN.save(); FN.redraw(); };

function syncUI() {
  const p = P(); p.fx = p.fx || []; p.anim = p.anim || { in: 'fade', out: 'fade', dur: 0.3 };
  for (const [id] of FXLIST) { const e = p.fx.find((q) => q.id === id); rows[id].cb.checked = !!e; if (e) rows[id].rg.value = e.intensity; }
  selIn.value = p.anim.in; selOut.value = p.anim.out; durIn.value = p.anim.dur; boxCb.checked = !!(p.style.box && p.style.box.on);
  const cols = document.querySelectorAll('#extra input[type=color]'); if (cols[0]) cols[0].value = p.style.fill || '#ffffff'; if (cols[1]) cols[1].value = p.style.stroke || '#000000';
}
function applyPreset(pr) {
  const p = P(), fs = document.getElementById('fontSel');
  p.style = { ...p.style, glow: undefined, ...pr.style }; p.fx = (pr.fx || []).map((e) => ({ ...e })); p.anim = { ...pr.anim };
  if (pr.font && fs && [...fs.options].some((o) => o.value === pr.font)) { p.style.font = pr.font; fs.value = pr.font; }
  syncUI(); FN.save(); FN.redraw();
}
function renderPresets() {
  presetRow.innerHTML = ''; presetRow.append(mk('span', { className: 'mut', textContent: 'Preset:' }));
  const all = { ...PRESETS, ...(P().userPresets || {}) };
  for (const name of Object.keys(all)) presetRow.append(mk('button', { textContent: name, onclick: () => applyPreset(all[name]) }));
  presetRow.append(mk('button', { textContent: '＋ Save as preset', onclick: () => {
    const name = prompt('Preset နာမည်?'); if (!name) return; const p = P();
    p.userPresets = { ...(p.userPresets || {}), [name]: { font: p.style.font, style: JSON.parse(JSON.stringify(p.style)), fx: JSON.parse(JSON.stringify(p.fx || [])), anim: { ...p.anim } } };
    FN.save(); renderPresets(); FN.setStatus('Preset သိမ်းပြီး (project ထဲမှာပဲ၊ R2 ကို နောက်မှ)');
  } }));
}
let lastP = P(); syncUI(); renderPresets(); FN.redraw();
setInterval(() => { if (P() !== lastP) { lastP = P(); syncUI(); renderPresets(); } }, 500);   // project import/load
