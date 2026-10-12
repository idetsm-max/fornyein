// Stage 10 module: R2 library browser (Music / BG / Logo / SE), background image, logo, music mix.
// Talks to the Worker (/api/library, /api/asset). Uses hooks in window.FN.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const TYPES = ['Music', 'BG', 'Logo', 'SE'];
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i, VID = /\.(mp4|webm|mov|m4v)$/i;
const assetUrl = (type, name) => `/api/asset/${type}/${name.split('/').map(encodeURIComponent).join('/')}`;
const db2g = (db) => Math.pow(10, db / 20);
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

// ---------- list (cached in memory) ----------
const cache = {};
async function list(type, force) {
  if (!force && cache[type]) return cache[type];
  const r = await fetch(`/api/library/${type}`);
  if (!r.ok) throw new Error(r.status === 503 ? 'R2 မချိတ်ရသေးပါ (bucket မရှိသေး)' : `HTTP ${r.status}`);
  return (cache[type] = await r.json());
}

// ---------- UI ----------
const card = mk('div', { className: 'card' }); card.style.marginTop = '14px';
$('list').closest('.card').after(card);
card.append(mk('b', { textContent: 'Library (R2)' }));
const tabs = mk('div', { className: 'row' }), listEl = mk('div'), ctl = mk('div', { className: 'row mut' }), prev = mk('audio', { controls: true });
prev.style.width = '100%'; prev.style.marginTop = '8px';
listEl.style.maxHeight = '220px'; listEl.style.overflow = 'auto'; listEl.style.marginTop = '8px';
card.append(tabs, listEl, prev, ctl);
let cur = 'Music';
const tabBtns = {};
TYPES.forEach((t) => { const b = mk('button', { textContent: t, onclick: () => show(t, false) }); tabBtns[t] = b; tabs.append(b); });
tabs.append(mk('button', { textContent: '↻ Refresh', onclick: () => show(cur, true) }));

async function show(type, force) {
  cur = type; TYPES.forEach((t) => { tabBtns[t].style.borderColor = t === type ? 'var(--ac)' : ''; });
  listEl.textContent = 'စာရင်းယူနေပါတယ်...';
  try {
    const items = await list(type, force); listEl.textContent = '';
    if (!items.length) { listEl.append(mk('div', { className: 'mut', textContent: `${type}/ ထဲမှာ ဖိုင်မရှိသေးပါ` })); return; }
    for (const it of items) {
      const row = mk('div', { className: 'row' }); row.style.marginTop = '4px';
      const name = mk('span', { textContent: `${it.name} · ${fmtSize(it.size)}` }); name.style.flex = '1'; name.style.wordBreak = 'break-all';
      row.append(name,
        mk('button', { textContent: '▶', title: 'နားထောင်', onclick: () => {
          if (IMG.test(it.name) || VID.test(it.name)) { FN.setStatus('ပုံ/Video ကို မြင်ကြည့်ရန် "သုံး" ကို နှိပ်ပါ'); return; }
          prev.src = assetUrl(type, it.name); prev.play().catch(() => {});
        } }),
        mk('button', { textContent: 'သုံး', onclick: () => choose(type, it) }));
      listEl.append(row);
    }
  } catch (e) { listEl.textContent = 'စာရင်းမရပါ: ' + e.message; }
}

// ---------- selection ----------
let musicBuf = null, bgImg = null, logoImg = null, bgCache = null;
const volIn = mk('input', { type: 'number', min: -40, max: 6, step: 1, value: -18 }); volIn.style.width = '60px';
const loopCb = mk('input', { type: 'checkbox', checked: true });
const bgMode = mk('select'); [['cover', 'Cover'], ['contain', 'Contain + blur']].forEach(([v, l]) => bgMode.add(new Option(l, v)));
const logoPos = mk('select'); [['tr', 'ညာပေါ်'], ['tl', 'ဘယ်ပေါ်'], ['br', 'ညာအောက်'], ['bl', 'ဘယ်အောက်']].forEach(([v, l]) => logoPos.add(new Option(l, v)));
const logoSize = mk('input', { type: 'number', min: 3, max: 50, step: 1, value: 12 }); logoSize.style.width = '60px';
const logoOp = mk('input', { type: 'number', min: 0.1, max: 1, step: 0.1, value: 0.9 }); logoOp.style.width = '60px';
ctl.append('Music dB', volIn, mk('label', {}, [loopCb, ' loop']), ' BG', bgMode, ' Logo', logoPos, '%', logoSize, 'opacity', logoOp,
  mk('button', { textContent: 'BG/Logo/Music ဖယ်', onclick: clearAll }));

const load = async (type, name) => { const r = await fetch(assetUrl(type, name)); if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r; };
async function choose(type, it) {
  try {
    FN.setStatus(`${it.name} ဒေါင်းနေပါတယ်...`);
    if (type === 'Music') { await loadMusic(it.name); P().media.music = `Music/${it.name}`; }
    else if (type === 'BG') {
      if (VID.test(it.name)) { FN.setStatus('Video BG က အဆင့် ၁၂ မှာ ထည့်မယ် (အခုပုံတွေပဲ သုံးလို့ရ)'); return; }
      await loadBg(it.name); P().media.bg = `BG/${it.name}`;
    } else if (type === 'Logo') { await loadLogo(it.name); P().logo = { ...(P().logo || {}), path: `Logo/${it.name}` }; }
    else { FN.setStatus('SE က အဆင့် ၁၁ (Audio Engine) မှာ Timeline ပေါ်ထည့်မယ်၊ အခု နားထောင်လို့ပဲရ'); return; }
    FN.save(); FN.redraw(); FN.setStatus(`${it.name} သုံးပြီး`);
  } catch (e) { FN.setStatus('မရပါ: ' + e.message); }
}
async function loadMusic(name) { musicBuf = await FN.ac.decodeAudioData(await (await load('Music', name)).arrayBuffer()); }
async function loadBg(name) { bgImg = await createImageBitmap(await (await load('BG', name)).blob()); bgCache = null; }
async function loadLogo(name) { logoImg = await createImageBitmap(await (await load('Logo', name)).blob()); }
function clearAll() { musicBuf = bgImg = logoImg = bgCache = null; const p = P(); delete p.media.music; delete p.media.bg; delete p.logo; stopM(); FN.save(); FN.redraw(); FN.setStatus('ဖယ်ရှားပြီး'); }

// ---------- settings -> project ----------
volIn.oninput = () => { P().media.musicDb = +volIn.value; if (mGain) mGain.gain.value = db2g(+volIn.value); FN.save(); };
loopCb.onchange = () => { P().media.musicLoop = loopCb.checked; FN.save(); };
bgMode.onchange = () => { P().media.bgMode = bgMode.value; bgCache = null; FN.save(); FN.redraw(); };
const saveLogo = () => { P().logo = { ...(P().logo || {}), pos: logoPos.value, sizePct: +logoSize.value || 12, opacity: +logoOp.value || 0.9 }; FN.save(); FN.redraw(); };
logoPos.onchange = logoSize.oninput = logoOp.oninput = saveLogo;

// ---------- background + logo (called by drawFrame for every frame) ----------
FN.drawBackground = (c, W, H) => {
  if (bgImg) {
    const iw = bgImg.width, ih = bgImg.height, mode = P().media.bgMode || 'cover';
    const cover = Math.max(W / iw, H / ih), fit = Math.min(W / iw, H / ih);
    if (mode === 'cover') c.drawImage(bgImg, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover);
    else {
      if (!bgCache || bgCache.w !== W || bgCache.h !== H) {         // blurred backdrop cached per frame size
        const o = document.createElement('canvas'); o.width = W; o.height = H; const g = o.getContext('2d');
        g.filter = 'blur(28px)'; g.drawImage(bgImg, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover); g.filter = 'none';
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); bgCache = { w: W, h: H, o };
      }
      c.drawImage(bgCache.o, 0, 0); c.drawImage(bgImg, (W - iw * fit) / 2, (H - ih * fit) / 2, iw * fit, ih * fit);
    }
  }
  const L = P().logo;
  if (logoImg && L) {
    const w = W * (L.sizePct || 12) / 100, h = w * logoImg.height / logoImg.width, m = Math.min(W, H) * 0.03;
    const x = (L.pos || 'tr').endsWith('l') ? m : W - w - m, y = (L.pos || 'tr').startsWith('t') ? m : H - h - m;
    c.save(); c.globalAlpha = L.opacity ?? 0.9; c.drawImage(logoImg, x, y, w, h); c.restore();
  }
};

// ---------- music: preview in sync with the main clock ----------
let mSrc = null, mGain = null;
function stopM() { if (mSrc) { try { mSrc.stop(); } catch {} mSrc.disconnect(); mSrc = null; } }
FN.onPlay.push((t) => {
  stopM(); if (!musicBuf) return;
  const loop = loopCb.checked, off = loop ? t % musicBuf.duration : t; if (off >= musicBuf.duration) return;
  mGain = FN.ac.createGain(); mGain.gain.value = db2g(+volIn.value); mGain.connect(FN.ac.destination);
  mSrc = FN.ac.createBufferSource(); mSrc.buffer = musicBuf; mSrc.loop = loop; mSrc.connect(mGain); mSrc.start(0, off);
});
FN.onPause.push(stopM);

// ---------- music: export mix (basic; the full mixer comes with the Audio Engine) ----------
FN.mixExport = async (main) => {
  if (!musicBuf) return main;
  const D = main.duration, oc = new OfflineAudioContext(2, main.length, main.sampleRate);
  const m = oc.createBufferSource(); m.buffer = main; m.connect(oc.destination);
  const mu = oc.createBufferSource(); mu.buffer = musicBuf; mu.loop = loopCb.checked;
  const g = oc.createGain(), v = db2g(+volIn.value); g.gain.setValueAtTime(v, 0); g.gain.setValueAtTime(v, Math.max(0, D - 2)); g.gain.linearRampToValueAtTime(0, D);
  mu.connect(g); g.connect(oc.destination); m.start(0); mu.start(0);
  return await oc.startRendering();
};

// ---------- restore from project (also after import) ----------
async function restore() {
  const p = P(), md = p.media || {};
  volIn.value = md.musicDb ?? -18; loopCb.checked = md.musicLoop ?? true; bgMode.value = md.bgMode || 'cover';
  if (p.logo) { logoPos.value = p.logo.pos || 'tr'; logoSize.value = p.logo.sizePct || 12; logoOp.value = p.logo.opacity ?? 0.9; }
  musicBuf = bgImg = logoImg = bgCache = null;
  try {
    if (md.music) await loadMusic(md.music.replace(/^Music\//, ''));
    if (md.bg) await loadBg(md.bg.replace(/^BG\//, ''));
    if (p.logo?.path) await loadLogo(p.logo.path.replace(/^Logo\//, ''));
  } catch { /* R2 not reachable yet: ignore */ }
  FN.redraw();
}
let lastP = P(); restore(); show('Music', false);
setInterval(() => { if (P() !== lastP) { lastP = P(); restore(); } }, 500);
