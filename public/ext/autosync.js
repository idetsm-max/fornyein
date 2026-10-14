// Auto-draft module (Plan step 6): VAD-based rough subtitle timing + confidence + Review mode + Lock / Re-align.
// No model, no server: everything runs in the browser on the main AudioBuffer.
//   1. energy VAD finds voiced segments and pauses
//   2. subtitle boundaries are placed on pauses with a Viterbi pass: expected position = syllable-weighted share of the VOICED time
//   3. start is padded earlier (lead), end later (tail); boundaries without a real pause are snapped to the nearest energy valley
//   4. every line gets a confidence (boundary quality x speech-rate sanity). Low ones are marked red/amber in the list.
// Keys: R = review next low-confidence line · V = mark verified (+lock) · L = lock / unlock.  Locked lines are never moved by Auto-draft,
// so "Re-align" = fix some lines, lock them, press Auto-draft again.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function VAD() { const p = P(); p.vad = p.vad || {}; if (p.vad.sens === undefined) p.vad.sens = 40; if (p.vad.pause === undefined) p.vad.pause = 250; return p.vad; }
const wt = (text) => Math.max(1, FN.syllables(text.replace(/[\s၊။]/g, '')).length);

// ---------- 1. energy per 10 ms frame (cached per buffer) ----------
let aKey = '', aVal = null;
function analyze(buf) {
  const key = buf.length + '|' + buf.sampleRate; if (key === aKey) return aVal;
  const sr = buf.sampleRate, hop = Math.round(sr * 0.01), win = Math.round(sr * 0.025), chn = buf.numberOfChannels, chs = [];
  for (let c = 0; c < chn; c++) chs.push(buf.getChannelData(c));
  const n = Math.max(0, Math.floor((buf.length - win) / hop)), db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let j = i * hop; j < i * hop + win; j += 2) { let v = 0; for (let k = 0; k < chn; k++) v += chs[k][j]; v /= chn; s += v * v; c++; }
    db[i] = 10 * Math.log10(s / c + 1e-12);
  }
  const sm = new Float32Array(n);
  for (let i = 0; i < n; i++) sm[i] = (db[Math.max(0, i - 1)] + db[i] + db[Math.min(n - 1, i + 1)]) / 3;
  aKey = key; aVal = { db: sm, hop: 0.01 }; return aVal;
}
function runs(m) { const out = []; let i = 0; while (i < m.length) { let j = i; while (j < m.length && m[j] === m[i]) j++; out.push([m[i], i, j]); i = j; } return out; }
function voiced(A, sens, pauseMin) {
  const { db, hop } = A, n = db.length, sorted = Float32Array.from(db).sort(), q = (x) => sorted[Math.floor(x * (n - 1))];
  const lo = q(0.1), hi = q(0.9), thr = lo + sens * (hi - lo), m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = db[i] > thr ? 1 : 0;
  for (const [v, i, j] of runs(m)) if (v === 0 && j - i < 12 && i > 0 && j < n) m.fill(1, i, j);        // bridge gaps < 120 ms
  for (const [v, i, j] of runs(m)) if (v === 1 && j - i < 6) m.fill(0, i, j);                         // drop blips < 60 ms
  const segs = [], cum = new Float32Array(n + 1);
  for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + (m[i] ? hop : 0);
  for (const [v, i, j] of runs(m)) if (v === 1) segs.push({ s: i * hop, e: j * hop });
  const pauses = [];
  for (let k = 0; k + 1 < segs.length; k++) {
    const s = segs[k].e, e = segs[k + 1].s, d = e - s;
    if (d >= pauseMin) pauses.push({ s, e, c: (s + e) / 2, d });
  }
  return { segs, pauses, cum, hop, db, n, thr };
}
const Vat = (X, t) => X.cum[clamp(Math.round(t / X.hop), 0, X.n)];
function invV(X, v) { let lo = 0, hi = X.n; while (lo < hi) { const mid = (lo + hi) >> 1; if (X.cum[mid] >= v) hi = mid; else lo = mid + 1; } return lo * X.hop; }
function valley(X, t, rad = 0.25) {
  const a = clamp(Math.round((t - rad) / X.hop), 0, X.n - 1), b = clamp(Math.round((t + rad) / X.hop), 0, X.n - 1); let best = a;
  for (let i = a; i <= b; i++) if (X.db[i] < X.db[best]) best = i;
  return best * X.hop;
}

// ---------- 2. align one run of unlocked lines inside [t0, t1] ----------
function alignRun(subs, a, b, t0, t1, X, lead, tail) {
  const L = b - a + 1, ws = subs.slice(a, b + 1).map((s) => wt(s.text)), totW = ws.reduce((x, y) => x + y, 0);
  const V0 = Vat(X, t0), Vt = Vat(X, t1) - V0;
  if (Vt < 0.3) {                                   // no usable voice in this window: proportional split, flagged low
    let acc = 0;
    for (let j = 0; j < L; j++) { const s = subs[a + j]; s.start = r2(t0 + acc / totW * (t1 - t0)); acc += ws[j]; s.end = r2(t0 + acc / totW * (t1 - t0)); s.confidence = 0.15; }
    return;
  }
  const avg = Vt / L, tol = Math.max(1.0, 1.5 * avg), pz = X.pauses.filter((p) => p.c > t0 + 0.05 && p.c < t1 - 0.05);
  const cum = []; let acc = 0; for (const w of ws) { acc += w; cum.push(acc / totW); }
  const cands = [];                                 // candidates per boundary (between line i-1 and i)
  for (let i = 1; i < L; i++) {
    const Vi = V0 + Vt * cum[i - 1], list = [];
    for (const p of pz) { const d = (Vat(X, p.c) - Vi) / avg; if (Math.abs(d) * avg <= tol) list.push({ t: p.c, p, cost: d * d - 0.3 * Math.min(1, p.d / 0.6) }); }
    list.push({ t: valley(X, invV(X, Vi)), p: null, cost: 1.2 });
    cands.push(list);
  }
  const gap = 0.15, best = [], from = [];           // Viterbi, times strictly increasing
  cands.forEach((list, i) => {
    best[i] = list.map(() => Infinity); from[i] = list.map(() => -1);
    list.forEach((c, k) => {
      if (i === 0) { if (c.t > t0 + gap) best[i][k] = c.cost; return; }
      cands[i - 1].forEach((pc, k2) => { if (best[i - 1][k2] < Infinity && c.t > pc.t + gap && best[i - 1][k2] + c.cost < best[i][k]) { best[i][k] = best[i - 1][k2] + c.cost; from[i][k] = k2; } });
    });
  });
  let pick = [];
  if (cands.length) {
    const last = best[cands.length - 1]; let k = last.indexOf(Math.min(...last));
    if (!isFinite(last[k])) pick = cands.map((l) => l[l.length - 1]);          // infeasible: interpolation only
    else for (let i = cands.length - 1; i >= 0; i--) { pick[i] = cands[i][k]; k = from[i][k]; }
  }
  const first = X.segs.find((s) => s.e > t0 + 0.02 && s.s < t1), lastSeg = [...X.segs].reverse().find((s) => s.s < t1 - 0.02 && s.e > t0);
  const starts = new Array(L), ends = new Array(L);
  starts[0] = first ? Math.max(t0, Math.max(first.s, t0) - lead) : t0; ends[L - 1] = lastSeg ? Math.min(t1, Math.min(lastSeg.e, t1) + tail) : t1;
  const qb = [0.9];                                 // quality of the boundary left of each line
  pick.forEach((c, i) => {
    if (c.p) { ends[i] = Math.min(c.p.s + tail, c.t); starts[i + 1] = Math.max(c.p.e - lead, c.t); qb.push(0.55 + 0.45 * Math.min(1, c.p.d / 0.5)); }
    else { ends[i] = starts[i + 1] = c.t; qb.push(0.35); }
  });
  qb.push(0.9);
  const rates = [];
  for (let j = 0; j < L; j++) { ends[j] = Math.max(starts[j] + 0.1, ends[j]); rates.push((Vat(X, ends[j]) - Vat(X, starts[j])) / ws[j]); }
  const med = [...rates].sort((x, y) => x - y)[Math.floor(L / 2)] || 1;
  for (let j = 0; j < L; j++) {
    const s = subs[a + j]; s.start = r2(starts[j]); s.end = r2(ends[j]);
    const dev = Math.abs(Math.log((rates[j] || 1e-3) / med)), factor = clamp(1 - Math.max(0, dev - 0.35) * 1.2, 0.3, 1);
    s.confidence = r2(Math.min(qb[j], qb[j + 1]) * factor);
  }
}

function autoDraft() {
  const buf = FN.audio, subs = P().subtitles;
  if (!buf || !subs.length) { FN.setStatus('Auto-draft: အသံဖိုင်နဲ့ စာတန်း အရင်လိုပါတယ်'); return; }
  FN.setStatus('Auto-draft တွက်နေပါတယ်...');
  setTimeout(() => {
    const v = VAD(), X = voiced(analyze(buf), v.sens / 100, v.pause / 1000), lead = P().leadMs / 1000, tail = P().tailMs / 1000;
    FN.snap();
    let a = 0;
    while (a < subs.length) {
      if (subs[a].locked) { a++; continue; }
      let b = a; while (b + 1 < subs.length && !subs[b + 1].locked) b++;
      alignRun(subs, a, b, a > 0 ? subs[a - 1].end : 0, b < subs.length - 1 ? subs[b + 1].start : buf.duration, X, lead, tail);
      a = b + 1;
    }
    FN.changed();
    const low = subs.filter((s) => !s.locked && s.confidence < 0.7).length;
    FN.setStatus(`Auto-draft ပြီး — pause ${X.pauses.length} ခု တွေ့၊ ပြန်စစ်ရန် ${low} ကြောင်း (R နှိပ်ပါ)`);
  }, 30);
}

// ---------- 3. review / verify / lock (keys + list decoration) ----------
const selIdx = () => [...$('list').children].findIndex((r) => r.classList.contains('sel'));
function focusRow(i) { const inp = $('list').children[i]?.querySelector('input'); if (inp) { inp.focus(); inp.blur(); } }   // selects the row without leaving the keyboard in an input
function review() {
  const subs = P().subtitles, n = subs.length, from = selIdx();
  for (let k = 1; k <= n; k++) {
    const i = (from + k + n) % n, s = subs[i];
    if (!s.locked && s.confidence < 0.7) { focusRow(i); $('aud').click(); FN.setStatus(`Review: စာတန်း ${i + 1}/${n} (confidence ${s.confidence}) — ကိုက်ရင် V၊ မကိုက်ရင် ပြင်ပြီး V`); return; }
  }
  FN.setStatus('ပြန်စစ်ရန် စာတန်း မကျန်တော့ပါ ✔');
}
function lockSel(verify) {
  const i = selIdx(), s = P().subtitles[i]; if (!s) { FN.setStatus('စာတန်း ရွေးပါ'); return; }
  FN.snap(); if (verify) { s.locked = true; s.confidence = 1; } else s.locked = !s.locked;
  FN.changed(); focusRow(i);
}
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.code === 'KeyR') review(); else if (e.code === 'KeyV') lockSel(true); else if (e.code === 'KeyL') lockSel(false);
});
function decorate() {
  const subs = P().subtitles;
  [...$('list').children].forEach((r, i) => {
    const s = subs[i]; if (!s) return; const c = s.confidence || 0;
    r.style.borderLeft = s.locked ? '3px solid #3ddc84' : c > 0 && c < 0.5 ? '3px solid #ff5b6e' : c > 0 && c < 0.75 ? '3px solid #f5b83d' : '3px solid transparent';
    const n = r.firstElementChild; if (n) { n.textContent = (i + 1) + (s.locked ? '🔒' : ''); n.style.whiteSpace = 'nowrap'; }
    r.title = c ? `confidence ${c}${s.locked ? ' · locked' : ''}` : '';
  });
}
new MutationObserver(decorate).observe($('list'), { childList: true }); setInterval(decorate, 800); decorate();

// ---------- 4. buttons + settings (added to the Timeline tools; layout.js moves them) ----------
const mkBtn = (text, title, fn) => mk('button', { textContent: text, title, onclick: fn });
$('aud').after(mkBtn('⚡ Auto-draft', 'VAD နဲ့ စာတန်းအချိန်ကို အကြမ်းချိန်ပေးမယ် (🔒 ထားတဲ့စာတန်းတွေ မရွှေ့ဘူး)', autoDraft), mkBtn('🔍 Review (R)', 'confidence နိမ့်တာကို တစ်ခုချင်း ခုန်ကြည့်မယ်', review), mkBtn('🔒 Lock (L)', 'ရွေးထားတဲ့စာတန်းကို lock / unlock', () => lockSel(false)));
const num = (label, key, min, max, step) => {
  const i = mk('input', { type: 'number', min, max, step, value: VAD()[key] }); i.style.width = '62px';
  i.oninput = () => { VAD()[key] = parseFloat(i.value) || VAD()[key]; FN.save(); };
  return mk('label', { className: 'mut', title: label }, [label + ' ', i]);
};
$('lead').closest('.row').append(num('VAD %', 'sens', 10, 80, 5), num('Pause ms', 'pause', 100, 800, 50));
