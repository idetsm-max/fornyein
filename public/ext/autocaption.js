// Auto caption module (CapCut-style "auto captions") using an open-source Whisper model.
//
//   browser: cut the voice at pauses -> one 16 kHz WAV chunk per request -> ASR server -> { text }
//   The ASR server is the free server in local-asr/ running on YOUR computer (http://127.0.0.1:7860),
//   or any server with the same two endpoints (GET / , POST /transcribe?lang=my). If the "ASR server" box is empty the
//   request goes through the Cloudflare Worker (/api/transcribe) to the address configured there (ASR_URL).
//   Whisper timestamps are never needed: the chunk times come from our own pause detector.
//
//   Mode A  "အသံကနေ စာတန်းထုတ်မယ်"      : every chunk becomes a subtitle line with the text Whisper heard.
//   Mode B  "ကိုယ့်စာသားကို ချိန်ကိုက်မယ်" : you already pasted the poem. Whisper's (imperfect) text is only used to FIND WHERE each
//            of your lines is spoken: both are turned into syllables and aligned (banded Needleman-Wunsch). Your text stays exact.
//            Lines Whisper could not confirm get a low confidence (red/amber in the list, R = review). Locked lines are never moved.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => s.replace(/[\s၊။,.?!"'“”‘’\-–—()]/g, '');
const sylOf = (s) => FN.syllables(clean(s));
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

// ---------- 1. cut the voice at pauses ----------
function energyDb(buf) {
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
  return sm;
}
function runs(m) { const out = []; let i = 0; while (i < m.length) { let j = i; while (j < m.length && m[j] === m[i]) j++; out.push([m[i], i, j]); i = j; } return out; }
function chunkify(buf, sens, pauseMin) {
  const hop = 0.01, db = energyDb(buf), n = db.length; if (n < 10) return [];
  const sorted = Float32Array.from(db).sort(), q = (x) => sorted[Math.floor(x * (n - 1))], thr = q(0.1) + sens * (q(0.9) - q(0.1));
  const m = new Uint8Array(n); for (let i = 0; i < n; i++) m[i] = db[i] > thr ? 1 : 0;
  const gap = Math.max(3, Math.round(pauseMin / hop));
  for (const [v, i, j] of runs(m)) if (v === 0 && j - i < gap && i > 0 && j < n) m.fill(1, i, j);     // pauses shorter than pauseMin are not boundaries
  for (const [v, i, j] of runs(m)) if (v === 1 && j - i < 8) m.fill(0, i, j);                       // blips < 80 ms
  let segs = runs(m).filter((r) => r[0] === 1).map(([, i, j]) => ({ a: i * hop, b: j * hop }));
  const MAXLEN = 25;
  for (let guard = 0; guard < 500; guard++) {                                                       // merge very short pieces into the nearer neighbour
    const k = segs.findIndex((s) => s.b - s.a < 1.0 && !s.tiny && segs.length > 1);
    if (k < 0) break;
    const gl = k > 0 ? segs[k].a - segs[k - 1].b : Infinity, gr = k < segs.length - 1 ? segs[k + 1].a - segs[k].b : Infinity;
    const t = gl <= gr ? k - 1 : k + 1; if (t < 0 || t >= segs.length) break;
    const lo = Math.min(k, t), hi = Math.max(k, t);
    if (segs[hi].b - segs[lo].a > MAXLEN) { segs[k] = { ...segs[k], tiny: true }; continue; }
    segs.splice(lo, 2, { a: segs[lo].a, b: segs[hi].b });
  }
  const out = [];
  for (const s of segs) {                                                                           // split over-long pieces at the quietest point
    const len = s.b - s.a;
    if (len <= MAXLEN) { out.push({ a: s.a, b: s.b }); continue; }
    const parts = Math.ceil(len / 20); let prev = s.a;
    for (let p = 1; p <= parts; p++) {
      let cut = s.a + len * p / parts;
      if (p < parts) { const i0 = clamp(Math.round((cut - 1) / hop), 0, n - 1), i1 = clamp(Math.round((cut + 1) / hop), 0, n - 1); let best = i0; for (let i = i0; i <= i1; i++) if (db[i] < db[best]) best = i; cut = best * hop; } else cut = s.b;
      out.push({ a: prev, b: cut }); prev = cut;
    }
  }
  return out.map((s) => ({ a: Math.max(0, s.a - 0.05), b: Math.min(buf.duration, s.b + 0.05) })).filter((s) => s.b - s.a > 0.25);
}

// ---------- 2. one chunk -> 16 kHz mono 16-bit WAV ----------
function wavChunk(buf, a, b) {
  const sr = buf.sampleRate, i0 = Math.max(0, Math.floor((a - 0.15) * sr)), i1 = Math.min(buf.length, Math.ceil((b + 0.15) * sr)), ratio = sr / 16000;
  const n = Math.max(1, Math.floor((i1 - i0) / ratio)), chn = buf.numberOfChannels, chs = [];
  for (let c = 0; c < chn; c++) chs.push(buf.getChannelData(c));
  const f = new Float32Array(n); let peak = 0;
  for (let i = 0; i < n; i++) {
    const s0 = i0 + Math.floor(i * ratio), s1 = Math.max(s0 + 1, Math.min(i1, i0 + Math.floor((i + 1) * ratio))); let acc = 0, cnt = 0;
    for (let s = s0; s < s1; s++) for (let k = 0; k < chn; k++) { acc += chs[k][s]; cnt++; }
    f[i] = acc / cnt; peak = Math.max(peak, Math.abs(f[i]));
  }
  const gain = peak > 0 ? Math.min(8, 0.9 / peak) : 1, dv = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const v = clamp(f[i] * gain, -1, 1); dv.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true); }
  return new Blob([dv], { type: 'audio/wav' });
}

// ---------- 3. talk to the ASR server (your computer, or the Worker -> remote server) ----------
const srv = mk('input', { type: 'text', placeholder: 'http://127.0.0.1:7860', value: store.get('fn.asrUrl', 'http://127.0.0.1:7860'), title: 'အလွတ်ထားရင် Cloudflare Worker (ASR_URL) ကနေ သွားမယ်' });
srv.style.width = '190px'; srv.oninput = () => store.set('fn.asrUrl', srv.value);
const base = () => (srv.value || '').trim().replace(/\/+$/, '');
async function wake(say) {
  const b = base();
  if (b) {                                                     // direct: local-asr/ on this computer
    let lastErr = '';
    for (let i = 0; i < 3; i++) {
      try { const r = await fetch(b + '/', { cache: 'no-store' }); if (r.ok) { const j = await r.json().catch(() => ({})); say(`ASR server အဆင်သင့် — ${j.model || ''} · ${j.device || ''}`); return; } lastErr = 'HTTP ' + r.status; }
      catch (e) { lastErr = e.message; }
      await sleep(1500);
    }
    throw new Error(`ASR server ကို မချိတ်ဆက်နိုင်ပါ (${lastErr}) — start-windows.bat ကို run ထားလား၊ Chrome က "local network" ခွင့်ပြုချက် တောင်းရင် Allow လုပ်ပါ`);
  }
  for (let i = 0; i < 40; i++) {                               // through the Cloudflare Worker (remote server may be asleep)
    let j = {}, st = 0;
    try { const r = await fetch('/api/transcribe', { cache: 'no-store' }); st = r.status; j = await r.json().catch(() => ({})); } catch {}
    if (j.ready) return;
    if (st === 503 && j.error) throw new Error(j.error);
    if (st === 403) throw new Error('Cloudflare Access ကြောင့် ပိတ်ထားပါတယ် (login ပြန်ဝင်ပါ)');
    say(`ASR server ကို နှိုးနေပါတယ် (${i * 5}s)...`); await sleep(5000);
  }
  throw new Error('ASR server မနိုးပါ');
}
async function asr(blob, lang) {
  const url = base() ? `${base()}/transcribe?lang=${encodeURIComponent(lang)}` : `/api/transcribe?lang=${encodeURIComponent(lang)}`;
  for (let tryNo = 0; ; tryNo++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'audio/wav' }, body: blob });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || j.detail || 'HTTP ' + r.status);
      return j.text || '';
    } catch (e) { if (tryNo >= 2) throw e; await sleep(1500 * (tryNo + 1)); }
  }
}
async function transcribeChunks(buf, chunks, lang, say) {
  const out = chunks.map((c) => ({ ...c, text: '' })); let done = 0, next = 0, failed = null;
  const worker = async () => {
    while (!failed) {
      const i = next++; if (i >= out.length) return;
      try { out[i].text = (await asr(wavChunk(buf, out[i].a, out[i].b), lang)).trim(); } catch (e) { failed = e; return; }
      done++; say(`Whisper နဲ့ နားထောင်နေပါတယ် ${done}/${out.length}`, done / out.length);
    }
  };
  await Promise.all([worker(), worker()]);
  if (failed) throw failed;
  return out;
}

// ---------- 4. text <-> time ----------
function sc(u, a) { return u === a ? 3 : (u[0] === a[0] ? 1 : -2); }
// banded global alignment of two syllable lists; returns map[u] = index in A (or -1) and q[u] = 1 exact / .5 similar / 0 substituted
function align(U, A) {
  const n = U.length, m = A.length, map = new Int32Array(n).fill(-1), q = new Float32Array(n);
  if (!n || !m) return { map, q };
  const W = Math.max(120, Math.ceil(Math.max(n, m) * 0.25)), BW = 2 * W + 1, NEG = -1e9;
  const S = new Int32Array((n + 1) * BW).fill(NEG), T = new Uint8Array((n + 1) * BW);
  const lo = (i) => Math.max(0, Math.round(i * m / n) - W), idx = (i, j) => i * BW + (j - lo(i));
  const inB = (i, j) => { if (j < 0 || j > m) return false; const k = j - lo(i); return k >= 0 && k < BW; };
  for (let j = 0; j <= m && inB(0, j); j++) { S[idx(0, j)] = -j; T[idx(0, j)] = 3; }
  S[idx(0, 0)] = 0; T[idx(0, 0)] = 0;
  for (let i = 1; i <= n; i++) for (let k = 0; k < BW; k++) {
    const j = lo(i) + k; if (j > m) break; let best = NEG, mv = 0;
    if (j > 0 && inB(i - 1, j - 1)) { const s0 = S[idx(i - 1, j - 1)]; if (s0 > NEG) { const v = s0 + sc(U[i - 1], A[j - 1]); if (v > best) { best = v; mv = 1; } } }
    if (inB(i - 1, j)) { const s0 = S[idx(i - 1, j)]; if (s0 > NEG) { const v = s0 - 1; if (v > best) { best = v; mv = 2; } } }
    if (j > 0 && inB(i, j - 1)) { const s0 = S[idx(i, j - 1)]; if (s0 > NEG) { const v = s0 - 1; if (v > best) { best = v; mv = 3; } } }
    if (mv) { S[idx(i, j)] = best; T[idx(i, j)] = mv; }
  }
  if (!inB(n, m) || S[idx(n, m)] <= NEG) { for (let u = 0; u < n; u++) map[u] = Math.min(m - 1, Math.round(u * m / n)); return { map, q }; }
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const mv = T[idx(i, j)];
    if (mv === 1) { const s = sc(U[i - 1], A[j - 1]); map[i - 1] = j - 1; q[i - 1] = s >= 3 ? 1 : s > 0 ? 0.5 : 0; i--; j--; }
    else if (mv === 2) i--; else if (mv === 3) j--; else break;
  }
  return { map, q };
}
// pad (lead / tail) without letting neighbouring lines overlap
function pad(lines, lead, tail) {
  for (let i = 0; i < lines.length; i++) { lines[i].s = lines[i].t0 - lead; lines[i].e = lines[i].t1 + tail; }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].s < lines[i - 1].e) { const mid = Math.max(lines[i - 1].t1, Math.min(lines[i].t0, (lines[i - 1].t1 + lines[i].t0) / 2)); lines[i - 1].e = Math.max(lines[i - 1].t1, mid); lines[i].s = Math.min(lines[i].t0, mid); }
  }
}

// ---------- 5. apply ----------
function applyA(chunks, off, lead, tail) {
  const kept = chunks.filter((c) => c.text); if (!kept.length) throw new Error('Whisper က စာသား မထုတ်ပေးနိုင်ပါ');
  const lines = kept.map((c) => ({ t0: c.a, t1: c.b, text: c.text })); pad(lines, lead, tail);
  P().subtitles = lines.map((l) => ({ text: l.text, start: r2(Math.max(0, l.s + off)), end: r2(Math.max(l.s + off + 0.1, l.e + off)), locked: false, confidence: 0.5 }));
}
function applyB(chunks, off, lead, tail, dur) {
  const subs = P().subtitles, A = [];
  for (const c of chunks) { const sy = sylOf(c.text), d = (c.b - c.a) / Math.max(1, sy.length); sy.forEach((s, i) => A.push({ s, t0: c.a + d * i, t1: c.a + d * (i + 1) })); }
  if (!A.length) throw new Error('Whisper က စာသား မထုတ်ပေးနိုင်ပါ');
  const U = [], lines = [];
  subs.forEach((s) => { const sy = sylOf(s.text), u0 = U.length; U.push(...sy); lines.push({ u0, u1: U.length }); });
  const { map, q } = align(U, A.map((x) => x.s));
  const L = lines.map((ln) => {
    let f = -1, l = -1, qs = 0; const cnt = Math.max(1, ln.u1 - ln.u0);
    for (let u = ln.u0; u < ln.u1; u++) { if (map[u] >= 0) { if (f < 0) f = map[u]; l = map[u]; } qs += q[u]; }
    return { t0: f >= 0 ? A[f].t0 : null, t1: l >= 0 ? A[l].t1 : null, q: qs / cnt, w: cnt };
  });
  for (let i = 0; i < L.length; i++) {                               // lines that found nothing: spread between neighbours by syllable count
    if (L[i].t0 !== null) continue;
    let a = i; while (a < L.length && L[a].t0 === null) a++;
    const tp = i > 0 ? L[i - 1].t1 : 0, tn = a < L.length ? L[a].t0 : dur, tot = L.slice(i, a).reduce((x, y) => x + y.w, 0); let acc = 0;
    for (let k = i; k < a; k++) { L[k].t0 = tp + (tn - tp) * acc / tot; acc += L[k].w; L[k].t1 = tp + (tn - tp) * acc / tot; L[k].q = Math.min(L[k].q, 0.1); }
    i = a - 1;
  }
  const idxs = L.map((_, i) => i).filter((i) => !subs[i].locked);
  const work = L.map((l) => ({ t0: l.t0, t1: Math.max(l.t1, l.t0 + 0.1) })); pad(work, lead, tail);
  for (const i of idxs) {
    subs[i].start = r2(Math.max(0, work[i].s + off)); subs[i].end = r2(Math.max(subs[i].start + 0.1, work[i].e + off));
    subs[i].confidence = r2(clamp(L[i].q, 0.05, 1));
  }
}

// ---------- 6. UI (top of the "စာသား" tab) ----------
const card = mk('div', { className: 'card' }); card.append(mk('b', { textContent: '✨ Auto caption' }));
const lang = mk('select'); [['my', 'မြန်မာ'], ['en', 'English'], ['th', 'ไทย'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어']].forEach(([v, l]) => lang.add(new Option(v === 'my' ? l : l, v)));
const pauseIn = mk('input', { type: 'number', min: 0.15, max: 1.5, step: 0.05, value: 0.3 }); pauseIn.style.width = '64px';
const bT = mk('button', { textContent: 'စစ်ကြည့်', title: 'ASR server ချိတ်မိမိ စစ်မယ်' });
const bA = mk('button', { textContent: '① အသံကနေ စာတန်းထုတ်မယ်' }), bB = mk('button', { className: 'pri', textContent: '② ကိုယ့်စာသားကို ချိန်ကိုက်မယ်' });
const note = mk('div', { className: 'mut', style: 'margin-top:8px;line-height:1.7' }), prog = mk('progress', { value: 0, max: 1 }); prog.style.cssText = 'width:100%;display:none;margin-top:6px';
card.append(mk('div', { className: 'row' }, [mk('label', { className: 'mut' }, ['ASR server ', srv]), bT]),
  mk('div', { className: 'row' }, [mk('label', { className: 'mut' }, ['ဘာသာစကား ', lang]), mk('label', { className: 'mut', title: 'ဒီထက်ပိုရပ်ရင် စာကြောင်းအသစ်လို့ သတ်မှတ်မယ်' }, ['pause s ', pauseIn])]),
  mk('div', { className: 'row' }, [bA, bB]), prog, note);
const pane = document.querySelectorAll('.side')[0]?.querySelectorAll('.pane')[1] || document.querySelector('main > section:last-child');
pane.prepend(card);

let busy = false, cache = null;
function say(msg, p) { note.textContent = msg; FN.setStatus(msg); if (p != null) { prog.style.display = ''; prog.value = p; } }
bT.onclick = async () => { try { await wake(say); } catch (e) { say(e.message); } };
async function run(mode) {
  if (busy) return;
  const buf = FN.audio, subs = P().subtitles;
  if (!buf) { say('အသံဖိုင် (သို့ အသံသွင်းထားတာ) အရင်လိုပါတယ်'); return; }
  if (mode === 'B' && !subs.length) { say('② အတွက် ကဗျာစာသား paste လုပ်ပြီး "စာတန်းခွဲမယ်" အရင်နှိပ်ပါ'); return; }
  if (mode === 'A' && subs.length && !confirm('ရှိပြီးသား စာတန်းတွေကို Whisper ရဲ့ စာသားနဲ့ အစားထိုးမလား? (Ctrl+Z နဲ့ ပြန်ရ)')) return;
  busy = true; bA.disabled = bB.disabled = bT.disabled = true; prog.style.display = 'none';
  try {
    const sens = (P().vad?.sens ?? 40) / 100, pauseMin = +pauseIn.value || 0.3, key = [buf.length, buf.sampleRate, JSON.stringify(P().keep || null), lang.value, sens, pauseMin, base()].join('|');
    let chunks;
    if (cache && cache.key === key) { chunks = cache.chunks; say('အရင်ရလဒ်ကို ပြန်သုံးပါတယ် (Whisper ပြန်မခေါ်ပါဘူး)'); }
    else {
      say('ရပ်နားတဲ့နေရာတွေ ရှာနေပါတယ်...');
      const cuts = chunkify(buf, sens, pauseMin); if (!cuts.length) throw new Error('အသံကို ခွဲလို့မရပါ (အသံတိတ်နေလား?)');
      await wake(say);
      chunks = await transcribeChunks(buf, cuts, lang.value, say); cache = { key, chunks };
    }
    FN.snap();
    const off = P().audioOffset || 0, lead = (P().leadMs ?? 100) / 1000, tail = (P().tailMs ?? 200) / 1000;
    if (mode === 'A') applyA(chunks, off, lead, tail); else applyB(chunks, off, lead, tail, buf.duration);
    FN.changed();
    const low = P().subtitles.filter((s) => !s.locked && (s.confidence || 0) < 0.7).length;
    say(mode === 'A' ? `စာတန်း ${P().subtitles.length} ကြောင်း ထုတ်ပြီး — Whisper မှားနိုင်လို့ စာသားကို ဖတ်ပြီး ပြင်ပါ (R = ပြန်စစ်)` : `ချိန်ကိုက်ပြီး — ပြန်စစ်ရန် ${low} ကြောင်း (R နှိပ်ပါ)`);
  } catch (e) { say('မအောင်ပါ: ' + e.message); }
  busy = false; bA.disabled = bB.disabled = bT.disabled = false; setTimeout(() => { prog.style.display = 'none'; }, 1500);
}
bA.onclick = () => run('A'); bB.onclick = () => run('B');
