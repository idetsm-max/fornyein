// Stage 11 module: Audio Engine (Web Audio).
// ONE graph builder (buildBus) is used for the live preview (AudioContext) AND for export (OfflineAudioContext),
// so what you hear = what is exported.
// Signal path per track: input -> HPF -> EQ(low/mid/high) -> compressor -> reverb(wet/dry) -> echo -> volume -> pan -> master -> limiter.
// The main voice may start later on the timeline (P.audioOffset): ducking, music and SE all follow timeline time.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P, ac = FN.ac;
const db2g = (db) => Math.pow(10, db / 20);
const fmt = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const assetUrl = (type, name) => `/api/asset/${type}/${name.split('/').map(encodeURIComponent).join('/')}`;
const offT = () => P().audioOffset || 0;

// ---------- settings (stored in the project: P.audio) ----------
const FXD = { hp: 0, low: 0, mid: 0, high: 0, comp: 0, compT: -24, compR: 3, rev: 0, decay: 1.8, pre: 0.02, damp: 0.5, echo: 0, echoT: 0.3, echoFb: 0.35 };
const track = (vol) => ({ vol, mute: false, solo: false, pan: 0, fx: { ...FXD } });
function A() {
  const p = P(), a = (p.audio = p.audio || {});
  if (!a.main) a.main = track(0);
  if (!a.music) a.music = { ...track(p.media?.musicDb ?? -18), loop: true };
  for (const t of [a.main, a.music]) { t.fx = t.fx || {}; for (const k in FXD) if (t.fx[k] === undefined) t.fx[k] = FXD[k]; }
  a.duck = a.duck || {}; const D = { on: true, thr: -40, red: -12, att: 0.08, rel: 0.5 }; for (const k in D) if (a.duck[k] === undefined) a.duck[k] = D[k];
  if (a.limiter === undefined) a.limiter = true;
  a.se = a.se || [];
  return a;
}
const VOICES = {
  'Poem Clean': { hp: 80, mid: 1, high: 1.5, comp: 1, compT: -22, compR: 2.5, rev: 0.08, decay: 1.2 },
  'Warm': { hp: 70, low: 3, high: -2, comp: 1, rev: 0.1, decay: 1.6 },
  'Hall': { hp: 80, comp: 1, rev: 0.35, decay: 3.2, pre: 0.04 },
  'Radio': { hp: 300, low: -6, mid: 4, high: -3, comp: 1, compR: 4 },
  'Cave': { hp: 60, low: 2, rev: 0.5, decay: 4.5, pre: 0.06, damp: 0.7, echo: 0.25, echoT: 0.38, echoFb: 0.45 },
  'Effect မရှိ': {},
};

// ---------- deterministic reverb impulse response (seeded noise, cached) ----------
const irCache = new Map();
function makeIR(ctx, decay, pre, damp) {
  const sr = ctx.sampleRate, key = [sr, decay, pre, damp].join('|');
  if (irCache.has(key)) return irCache.get(key);
  const len = Math.max(1, Math.floor((decay + pre) * sr)), buf = ctx.createBuffer(2, len, sr), preN = Math.floor(pre * sr), coef = 1 - 0.92 * damp;
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c); let seed = 12345 + c * 777, lp = 0;
    for (let i = preN; i < len; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = (seed / 4294967296) * 2 - 1, t = (i - preN) / sr;
      lp += (x - lp) * coef; d[i] = lp * Math.pow(10, (-3 * t) / decay);   // -60 dB at "decay" seconds
    }
  }
  irCache.set(key, buf); return buf;
}

// ---------- graph ----------
function channel(ctx, t, fxOn, anySolo) {
  const input = ctx.createGain(); let node = input; const f = t.fx;
  const chain = (n) => { node.connect(n); node = n; return n; };
  const split = (wetNode, wetGain) => {          // parallel dry + wet, summed
    const sum = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(); wet.gain.value = wetGain;
    node.connect(dry); node.connect(wetNode); wetNode.connect(wet); dry.connect(sum); wet.connect(sum); node = sum;
  };
  if (fxOn) {
    if (f.hp > 0) { const b = ctx.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = f.hp; chain(b); }
    for (const [type, freq, g, Q] of [['lowshelf', 200, f.low], ['peaking', 1500, f.mid, 1], ['highshelf', 5000, f.high]]) {
      if (g) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = freq; b.gain.value = g; if (Q) b.Q.value = Q; chain(b); }
    }
    if (f.comp) { const c = ctx.createDynamicsCompressor(); c.threshold.value = f.compT; c.ratio.value = f.compR; c.knee.value = 6; c.attack.value = 0.01; c.release.value = 0.2; chain(c); }
    if (f.rev > 0) { const cv = ctx.createConvolver(); cv.buffer = makeIR(ctx, f.decay, f.pre, f.damp); split(cv, f.rev); }
    if (f.echo > 0) {
      const dl = ctx.createDelay(1.5), fb = ctx.createGain(); dl.delayTime.value = f.echoT; fb.gain.value = f.echoFb; dl.connect(fb); fb.connect(dl);
      split(dl, f.echo);
    }
  }
  const vol = ctx.createGain(), silent = t.mute || (anySolo && !t.solo); vol.gain.value = silent ? 0 : db2g(t.vol); chain(vol);
  const pan = ctx.createStereoPanner(); pan.pan.value = t.pan || 0; chain(pan);
  return { input, output: node };
}
function buildBus(ctx, dest, { bypass = false, meter = false } = {}) {
  const a = A(), anySolo = a.main.solo || a.music.solo;
  const master = ctx.createGain(), lim = ctx.createDynamicsCompressor();
  if (a.limiter) { lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.1; }
  else { lim.threshold.value = 0; lim.knee.value = 0; lim.ratio.value = 1; }
  master.connect(lim);
  let an = null;
  if (meter) { an = ctx.createAnalyser(); an.fftSize = 1024; lim.connect(an); an.connect(dest); } else lim.connect(dest);
  const m = channel(ctx, a.main, !bypass, anySolo); m.output.connect(master);
  const duck = ctx.createGain(), fade = ctx.createGain(), mu = channel(ctx, a.music, !bypass, anySolo);
  duck.connect(fade); fade.connect(mu.input); mu.output.connect(master);
  const se = ctx.createGain(); se.connect(master);
  return { mainIn: m.input, musicIn: duck, duck, fade, seIn: se, master, an, teardown() { master.disconnect(); lim.disconnect(); if (an) an.disconnect(); } };
}

// ---------- ducking: music goes down while the voice is speaking (offline RMS analysis, in VOICE-FILE time) ----------
const STEP = 0.05;
let duckKey = '', duckVal = null;
function duckCurve(main, d) {
  const key = [main.length, main.sampleRate, d.thr, d.red, d.att, d.rel].join('|');
  if (key === duckKey) return duckVal;
  const ch = main.getChannelData(0), n = Math.ceil(main.duration / STEP), w = Math.floor(STEP * main.sampleRate), out = new Float32Array(n);
  const target = db2g(d.red), thr = db2g(d.thr), ka = Math.exp(-STEP / Math.max(0.01, d.att)), kr = Math.exp(-STEP / Math.max(0.01, d.rel));
  let g = 1;
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let j = i * w; j < (i + 1) * w && j < ch.length; j += 4) { s += ch[j] * ch[j]; c++; }
    const want = Math.sqrt(s / Math.max(1, c)) > thr ? target : 1, k = want < g ? ka : kr;
    g = want + (g - want) * k; out[i] = g;
  }
  duckKey = key; duckVal = out; return out;
}
// fromT = position inside the voice file; when = context time at which that position starts to play
function applyDuck(b, main, fromT, when) {
  b.duck.gain.cancelScheduledValues(0); b.duck.gain.value = 1;
  const d = A().duck; if (!d.on || !main) return;
  const c = duckCurve(main, d), sl = c.slice(Math.max(0, Math.min(c.length - 2, Math.floor(fromT / STEP))));
  if (sl.length >= 2) b.duck.gain.setValueCurveAtTime(sl, when, sl.length * STEP);
}

// ---------- sound effect buffers ----------
const seBufs = new Map();
async function seBuf(name) {
  if (seBufs.has(name)) return seBufs.get(name);
  try {
    const r = await fetch(assetUrl('SE', name)); if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await ac.decodeAudioData(await r.arrayBuffer()); seBufs.set(name, b); return b;
  } catch (e) { FN.setStatus('SE ဖွင့်မရ: ' + name + ' — ' + e.message); return null; }
}
const preloadSE = () => A().se.forEach((s) => seBuf(s.name));

// ---------- live preview ----------
const mainBus = ac.createGain(); FN.mainBus = mainBus;      // the app's main source is routed here (see patch below)
const _cbs = ac.createBufferSource.bind(ac);
ac.createBufferSource = () => { const s = _cbs(), c = s.connect.bind(s); s.connect = (d, ...r) => c(d === ac.destination ? mainBus : d, ...r); return s; };

let bus = null, bypass = false, playing = false, startPos = 0, startAC = 0, mSrc = null, seSrcs = [];
const curT = () => startPos + (ac.currentTime - startAC);
function stopExtras() {
  if (mSrc) { try { mSrc.stop(); } catch {} mSrc.disconnect(); mSrc = null; }
  seSrcs.forEach((s) => { try { s.stop(); } catch {} s.disconnect(); }); seSrcs = [];
}
function startExtras(t) {
  stopExtras(); const a = A(), mb = FN.music?.buf, off = offT();
  if (mb) {
    const s = ac.createBufferSource(); s.buffer = mb; s.loop = a.music.loop; s.connect(bus.musicIn);
    const o = a.music.loop ? t % mb.duration : t; if (o < mb.duration) { s.start(0, o); mSrc = s; }
    applyDuck(bus, FN.audio, Math.max(0, t - off), ac.currentTime + Math.max(0, off - t));
  }
  for (const se of a.se) {
    const buf = seBufs.get(se.name); if (!buf || se.t < t) continue;
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf; g.gain.value = db2g(se.vol || 0); s.connect(g); g.connect(bus.seIn);
    s.start(ac.currentTime + (se.t - t)); seSrcs.push(s);
  }
}
function rebuild() {
  if (bus) bus.teardown(); mainBus.disconnect();
  bus = buildBus(ac, ac.destination, { bypass, meter: true }); mainBus.connect(bus.mainIn);
  if (playing) startExtras(curT());
}
FN.onPlay.push((t) => { playing = true; startPos = t; startAC = ac.currentTime; startExtras(t); meterLoop(); });
FN.onPause.push(() => { playing = false; stopExtras(); });
FN.audioChanged = () => { if (playing) startExtras(curT()); };

// ---------- export mix (same buildBus on an OfflineAudioContext) ----------
// main = the voice file, off = where it starts on the timeline, total = timeline length (all in seconds)
FN.audioMix = async (main, off = 0, total = off + main.duration) => {
  const a = A(), sr = main.sampleRate, ctx = new OfflineAudioContext(2, Math.ceil(total * sr), sr), b = buildBus(ctx, ctx.destination);
  const ms = ctx.createBufferSource(); ms.buffer = main; ms.connect(b.mainIn); ms.start(off);
  const mb = FN.music?.buf;
  if (mb) {
    const s = ctx.createBufferSource(); s.buffer = mb; s.loop = a.music.loop; s.connect(b.musicIn); s.start(0);
    applyDuck(b, main, 0, off);
    b.fade.gain.setValueAtTime(1, Math.max(0, total - 2)); b.fade.gain.linearRampToValueAtTime(0, total);   // music fades out over the last 2 s
  }
  for (const se of a.se) {
    const buf = await seBuf(se.name); if (!buf) continue;
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = db2g(se.vol || 0); s.connect(g); g.connect(b.seIn); s.start(Math.max(0, se.t));
  }
  return await ctx.startRendering();
};

// ---------- UI ----------
const host = document.querySelectorAll('main > section')[1];
const card = mk('div', { className: 'card' }); card.style.marginTop = '14px'; host.append(card);
const meter = mk('canvas', { width: 240, height: 14 }); meter.style.width = '240px'; meter.style.height = '14px'; meter.style.borderRadius = '3px';
let mbuf = null;
function drawMeter() {
  const g = meter.getContext('2d'); g.fillStyle = '#0e121a'; g.fillRect(0, 0, 240, 14);
  if (!bus?.an || !playing) return;
  mbuf = mbuf || new Float32Array(bus.an.fftSize); bus.an.getFloatTimeDomainData(mbuf);
  let pk = 0; for (const x of mbuf) pk = Math.max(pk, Math.abs(x));
  g.fillStyle = pk > 0.98 ? '#ff4d5e' : pk > 0.7 ? '#f5b83d' : '#3ddc84'; g.fillRect(0, 0, Math.min(1, pk) * 240, 14);
}
function meterLoop() { drawMeter(); if (playing) requestAnimationFrame(meterLoop); }

let rbT;
const changed = () => { FN.save(); clearTimeout(rbT); rbT = setTimeout(rebuild, 120); };
function slider(label, min, max, step, get, set, unit = '') {
  const r = mk('input', { type: 'range', min, max, step }); r.value = get();
  const v = mk('span', { className: 'mut', textContent: fmt(get()) + unit }); v.style.minWidth = '46px';
  r.oninput = () => { set(+r.value); v.textContent = fmt(+r.value) + unit; changed(); };
  const l = mk('label', { className: 'mut' }, [label + ' ', r, v]); l.style.display = 'flex'; l.style.gap = '6px'; l.style.alignItems = 'center'; return l;
}
function check(label, get, set) {
  const c = mk('input', { type: 'checkbox', checked: !!get() }); c.onchange = () => { set(c.checked); changed(); };
  return mk('label', { className: 'mut' }, [c, ' ' + label]);
}
function toggleBtn(label, get, set) {
  const b = mk('button', { textContent: label }); const paint = () => { b.style.borderColor = get() ? '#ffb02e' : ''; b.style.color = get() ? '#ffb02e' : ''; };
  b.onclick = () => { set(!get()); paint(); changed(); }; paint(); return b;
}
const grid = () => { const g = mk('div', { className: 'row' }); g.style.display = 'grid'; g.style.gridTemplateColumns = 'repeat(auto-fill,minmax(250px,1fr))'; return g; };

function trackBlock(title, getT, open) {
  const box = mk('details'); box.open = open; box.style.marginTop = '10px';
  box.append(mk('summary', { textContent: title, style: 'cursor:pointer;font-weight:600' }));
  const head = mk('div', { className: 'row' });
  head.append(slider('Volume', -40, 6, 1, () => getT().vol, (v) => { getT().vol = v; }, ' dB'),
    slider('Pan', -1, 1, 0.1, () => getT().pan, (v) => { getT().pan = v; }),
    toggleBtn('Mute', () => getT().mute, (v) => { getT().mute = v; }), toggleBtn('Solo', () => getT().solo, (v) => { getT().solo = v; }));
  const g = grid(), F = () => getT().fx, s = (k, label, min, max, step, unit) => g.append(slider(label, min, max, step, () => F()[k], (v) => { F()[k] = v; }, unit));
  s('hp', 'High-pass', 0, 400, 10, ' Hz'); s('low', 'EQ Low', -12, 12, 0.5, ' dB'); s('mid', 'EQ Mid', -12, 12, 0.5, ' dB'); s('high', 'EQ High', -12, 12, 0.5, ' dB');
  g.append(check('Compressor', () => F().comp, (v) => { F().comp = v ? 1 : 0; })); s('compT', 'Comp threshold', -50, 0, 1, ' dB'); s('compR', 'Comp ratio', 1, 12, 0.5, ':1');
  s('rev', 'Reverb', 0, 1, 0.01); s('decay', 'Decay', 0.3, 6, 0.1, ' s'); s('pre', 'Pre-delay', 0, 0.15, 0.005, ' s'); s('damp', 'Damping', 0, 1, 0.05);
  s('echo', 'Echo', 0, 1, 0.01); s('echoT', 'Echo time', 0.05, 1, 0.01, ' s'); s('echoFb', 'Feedback', 0, 0.8, 0.01);
  box.append(head, g); return box;
}

function buildUI() {
  const a = A(); card.textContent = '';
  const top = mk('div', { className: 'row' }); top.style.marginTop = '0';
  const byp = mk('input', { type: 'checkbox', checked: bypass }); byp.onchange = () => { bypass = byp.checked; rebuild(); };
  top.append(mk('b', { textContent: 'Audio Mixer' }), meter,
    check('Limiter (master)', () => a.limiter, (v) => { A().limiter = v; }),
    mk('label', { className: 'mut', title: 'Preview မှာပဲ — Export မထိပါ' }, [byp, ' Effect ပိတ်ကြည့်မယ်']));
  card.append(top);
  // main voice
  card.append(trackBlock('Main — ကဗျာဖတ်သံ', () => A().main, true));
  const pr = mk('div', { className: 'row' }); pr.append(mk('span', { className: 'mut', textContent: 'Voice preset:' }));
  for (const [name, v] of Object.entries(VOICES)) pr.append(mk('button', { textContent: name, onclick: () => { A().main.fx = { ...FXD, ...v }; buildUI(); changed(); } }));
  card.append(pr);
  // music + ducking
  card.append(trackBlock('Music', () => A().music, false));
  const md = mk('div', { className: 'row' });
  md.append(check('Music loop', () => a.music.loop, (v) => { A().music.loop = v; }), check('Ducking (ဖတ်သံပေါ်ရင် Music ကျ)', () => a.duck.on, (v) => { A().duck.on = v; }),
    slider('Threshold', -60, -15, 1, () => A().duck.thr, (v) => { A().duck.thr = v; }, ' dB'), slider('ကျမယ့်ပမာဏ', -30, 0, 1, () => A().duck.red, (v) => { A().duck.red = v; }, ' dB'),
    slider('Attack', 0.02, 0.5, 0.01, () => A().duck.att, (v) => { A().duck.att = v; }, ' s'), slider('Release', 0.1, 2, 0.05, () => A().duck.rel, (v) => { A().duck.rel = v; }, ' s'));
  card.append(md);
  // SE clips
  const se = mk('div'); se.style.marginTop = '10px'; se.append(mk('b', { textContent: 'SE (Sound Effect)' }));
  const add = mk('div', { className: 'row' }), sel = mk('select'), tIn = mk('input', { type: 'number', min: 0, step: 0.1, value: 0 }), dIn = mk('input', { type: 'number', min: -40, max: 6, step: 1, value: 0 });
  tIn.style.width = '70px'; dIn.style.width = '60px';
  fetch('/api/library/SE', { cache: 'no-store' }).then((r) => r.ok ? r.json() : []).then((l) => { sel.textContent = ''; l.forEach((x) => sel.add(new Option(x.name, x.name))); if (!l.length) sel.add(new Option('(SE/ ထဲမှာ ဖိုင်မရှိ)', '')); }).catch(() => {});
  add.append(sel, mk('span', { className: 'mut', textContent: 'အချိန် s' }), tIn, mk('span', { className: 'mut', textContent: 'dB' }), dIn,
    mk('button', { textContent: '＋ ထည့်', onclick: async () => { if (!sel.value) return; A().se.push({ name: sel.value, t: +tIn.value || 0, vol: +dIn.value || 0 }); await seBuf(sel.value); buildUI(); changed(); FN.redraw(); } }));
  se.append(add);
  a.se.forEach((x, i) => {
    const r = mk('div', { className: 'row' }), ti = mk('input', { type: 'number', min: 0, step: 0.1, value: x.t }), di = mk('input', { type: 'number', min: -40, max: 6, step: 1, value: x.vol || 0 });
    ti.style.width = '70px'; di.style.width = '60px';
    ti.oninput = () => { A().se[i].t = +ti.value || 0; changed(); FN.redraw(); }; di.oninput = () => { A().se[i].vol = +di.value || 0; changed(); };
    r.append(mk('span', { textContent: x.name }), ti, mk('span', { className: 'mut', textContent: 's' }), di, mk('span', { className: 'mut', textContent: 'dB' }),
      mk('button', { textContent: '✕', onclick: () => { A().se.splice(i, 1); buildUI(); changed(); FN.redraw(); } }));
    se.append(r);
  });
  card.append(se, mk('div', { className: 'mut', style: 'margin-top:8px', textContent: 'Reverb/Echo အမြီးကို video အဆုံးမှာ ဖြတ်ထားပါတယ် (video ကြာချိန်မတိုးပါ)။ Effect အားလုံးက Preview နဲ့ Export တူပါတယ်။' }));
}

let lastP = P();
rebuild(); preloadSE(); buildUI();
setInterval(() => { if (P() !== lastP) { lastP = P(); preloadSE(); buildUI(); rebuild(); } }, 500);
