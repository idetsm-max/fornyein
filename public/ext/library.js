// Stage 10/12 module: R2 library browser (Music / BG / Logo / SE), background image + VIDEO, logo.
// If the MAIN input is a video file: its picture becomes the background, its sound the main audio, and BG selection is locked.
// Music playback / mixing lives in audio.js (Audio Engine); this module only loads the chosen music buffer (FN.music.buf).
// Talks to the Worker (/api/library, /api/asset). Uses hooks in window.FN.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const TYPES = ['Music', 'BG', 'Logo', 'SE'];
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i, VID = /\.(mp4|webm|mov|m4v|mkv)$/i;
const assetUrl = (type, name) => `/api/asset/${type}/${name.split('/').map(encodeURIComponent).join('/')}`;
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

// ---------- list (cached in memory) ----------
const cache = {};
async function list(type, force) {
  if (!force && cache[type]) return cache[type];
  const r = await fetch(`/api/library/${type}`, { cache: 'no-store' });
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
let cur = 'Music', lockBg = false;
const tabBtns = {};
TYPES.forEach((t) => { const b = mk('button', { textContent: t, onclick: () => show(t, false) }); tabBtns[t] = b; tabs.append(b); });
tabs.append(mk('button', { textContent: '↻ Refresh', onclick: () => show(cur, true) }));

function setLock(v) {
  lockBg = v; tabBtns.BG.disabled = v;
  tabBtns.BG.title = v ? 'Video ဖိုင်ကို ပင်မ input အဖြစ် သုံးထားလို့ BG ရွေးလို့မရပါ' : '';
  tabBtns.BG.style.opacity = v ? 0.45 : 1;
  if (v && cur === 'BG') show('Music', false);
}

async function show(type, force) {
  if (type === 'BG' && lockBg) { FN.setStatus('ပင်မ input က Video ဖြစ်နေလို့ BG ရွေးလို့မရပါ (Video ရဲ့ ပုံကို သုံးထားပါတယ်)'); return; }
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
let musicBuf = null, bgImg = null, bgVideo = null, logoImg = null, bgCache = null;
FN.music = { get buf() { return musicBuf; } };
const bgMode = mk('select'); [['cover', 'Cover'], ['contain', 'Contain + blur']].forEach(([v, l]) => bgMode.add(new Option(l, v)));
const logoPos = mk('select'); [['tr', 'ညာပေါ်'], ['tl', 'ဘယ်ပေါ်'], ['br', 'ညာအောက်'], ['bl', 'ဘယ်အောက်']].forEach(([v, l]) => logoPos.add(new Option(l, v)));
const logoSize = mk('input', { type: 'number', min: 3, max: 50, step: 1, value: 12 }); logoSize.style.width = '60px';
const logoOp = mk('input', { type: 'number', min: 0.1, max: 1, step: 0.1, value: 0.9 }); logoOp.style.width = '60px';
ctl.append('BG', bgMode, ' Logo', logoPos, '%', logoSize, 'opacity', logoOp,
  mk('button', { textContent: 'BG/Logo/Music ဖယ်', onclick: clearAll }));

const load = async (type, name) => { const r = await fetch(assetUrl(type, name)); if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r; };
async function choose(type, it) {
  try {
    if (type === 'BG' && lockBg) { FN.setStatus('ပင်မ input က Video ဖြစ်နေလို့ BG ရွေးလို့မရပါ'); return; }
    if (type === 'SE') { FN.setStatus('SE ကို Audio Mixer card ထဲက "SE" အပိုင်းမှာ အချိန်သတ်မှတ်ပြီး ထည့်ပါ'); return; }
    FN.setStatus(`${it.name} ဒေါင်းနေပါတယ်...`);
    if (type === 'Music') { await loadMusic(it.name); P().media.music = `Music/${it.name}`; FN.setStatus(`${it.name} သုံးပြီး`); }
    else if (type === 'BG') {
      if (VID.test(it.name)) { await loadBgVideo(it.name); FN.setStatus(`${it.name} Video BG ဖွင့်ပြီး — Play လုပ်ကြည့်ပါ`); }
      else { await loadBg(it.name); FN.setStatus(`${it.name} သုံးပြီး`); }
      P().media.bg = `BG/${it.name}`;
    } else if (type === 'Logo') { await loadLogo(it.name); P().logo = { ...(P().logo || {}), path: `Logo/${it.name}` }; FN.setStatus(`${it.name} သုံးပြီး`); }
    FN.save(); FN.redraw();
  } catch (e) { FN.setStatus('မရပါ: ' + e.message); }
}
async function loadMusic(name) { musicBuf = await FN.ac.decodeAudioData(await (await load('Music', name)).arrayBuffer()); FN.audioChanged?.(); }
async function loadBg(name) { dropVideo(); bgImg = await createImageBitmap(await (await load('BG', name)).blob()); bgCache = null; }
async function loadLogo(name) { logoImg = await createImageBitmap(await (await load('Logo', name)).blob()); }

// ---------- Video as picture: <video> for preview, Mediabunny CanvasSink for exact export frames ----------
// source is either an R2 BG video (url) or the local main-input video file (file).
function dropVideo() {
  if (!bgVideo) return;
  try { bgVideo.el.pause(); bgVideo.el.removeAttribute('src'); bgVideo.el.load(); } catch {}
  if (bgVideo.local) { try { URL.revokeObjectURL(bgVideo.url); } catch {} }
  try { bgVideo.input?.dispose?.(); } catch {}
  bgVideo = null;
}
async function openVideo(url, name, file) {
  dropVideo(); bgImg = null; bgCache = null;
  const el = mk('video', { muted: true, loop: true, playsInline: true, preload: 'auto' });
  el.muted = true; el.src = url;
  await new Promise((res, rej) => { el.onloadeddata = res; el.onerror = () => rej(new Error('Video ဖွင့်မရပါ (codec မပံ့ပိုးနိုင်)')); });
  el.addEventListener('seeked', () => FN.redraw());
  bgVideo = { el, name, url, file: file || null, local: !!file, frame: null, sinkP: null, sink: null, input: null, vdur: el.duration, useEl: false };
  el.currentTime = 0;
}
const loadBgVideo = (name) => openVideo(assetUrl('BG', name), name, null);

let mbP;
const mediabunny = () => (mbP = mbP || import('https://cdn.jsdelivr.net/npm/mediabunny@1/+esm'));
async function initSink(v) {
  const mb = await mediabunny();
  const source = v.file ? new mb.BlobSource(v.file) : new mb.UrlSource(new URL(v.url, location.href).href);
  v.input = new mb.Input({ source, formats: mb.ALL_FORMATS });
  const track = await v.input.getPrimaryVideoTrack();
  if (!track) throw new Error('video track မတွေ့');
  if (track.canDecode && !(await track.canDecode())) throw new Error('codec decode မရ');
  try { v.vdur = (await track.computeDuration()) || v.vdur; } catch {}
  v.sink = new mb.CanvasSink(track);
}
const seekTo = (el, t) => new Promise((res) => {
  if (Math.abs(el.currentTime - t) < 0.001) { res(); return; }
  const h = () => { el.removeEventListener('seeked', h); res(); };
  el.addEventListener('seeked', h); el.currentTime = t;
});
// export: called before every frame (t = exact timeline time)
FN.beforeFrame = async (t) => {
  const v = bgVideo; if (!v) return;
  const tl = v.vdur > 0 ? t % v.vdur : t;
  if (!v.useEl) {
    try {
      v.sinkP = v.sinkP || initSink(v); await v.sinkP;
      const r = await v.sink.getCanvas(tl);
      if (r?.canvas) { v.frame = r.canvas; return; }
    } catch (e) { v.useEl = true; v.frame = null; FN.setStatus('Video decode (WebCodecs) မရလို့ ပိုနှေးတဲ့နည်းနဲ့ ထုတ်နေပါတယ် — ' + e.message); }
  }
  v.el.pause(); await seekTo(v.el, tl); v.frame = null;
};

// ---------- main input is a VIDEO: use its picture as BG (BG selection locked) ----------
$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  const isVid = f.type.startsWith('video/') || VID.test(f.name);
  const md = P().media;
  if (isVid) {
    md.mainIsVideo = true; setLock(true);
    try { await openVideo(URL.createObjectURL(f), f.name, f); FN.setStatus('Video ရဲ့ ပုံကို BG အဖြစ်၊ အသံကို ပင်မအသံအဖြစ် သုံးပါမယ်'); }
    catch (err) { FN.setStatus('Video ပုံဖွင့်မရပါ: ' + err.message); }
  } else {
    md.mainIsVideo = false; setLock(false);
    if (bgVideo?.local) dropVideo();
    try { if (md.bg && !bgImg && !bgVideo) { const n = md.bg.replace(/^BG\//, ''); if (VID.test(n)) await loadBgVideo(n); else await loadBg(n); } } catch {}
  }
  FN.save(); FN.redraw();
});

function clearAll() {
  musicBuf = logoImg = null; const p = P(); delete p.media.music; delete p.logo;
  if (!lockBg) { bgImg = bgCache = null; dropVideo(); delete p.media.bg; }   // main video's picture stays
  FN.audioChanged?.(); FN.save(); FN.redraw(); FN.setStatus('ဖယ်ရှားပြီး');
}

// ---------- settings -> project ----------
bgMode.onchange = () => { P().media.bgMode = bgMode.value; bgCache = null; FN.save(); FN.redraw(); };
const saveLogo = () => { P().logo = { ...(P().logo || {}), pos: logoPos.value, sizePct: +logoSize.value || 12, opacity: +logoOp.value || 0.9 }; FN.save(); FN.redraw(); };
logoPos.onchange = logoSize.oninput = logoOp.oninput = saveLogo;

// ---------- background + logo (called by drawFrame for every frame) ----------
let smallCv = null;
function drawSrc(c, W, H, s, iw, ih, mode, live) {
  const cover = Math.max(W / iw, H / ih), fit = Math.min(W / iw, H / ih);
  if (mode === 'cover') { c.drawImage(s, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover); return; }
  if (live) {                                // moving video: cheap blurred backdrop (draw small, upscale with blur)
    const sw = Math.max(32, Math.round(W / 10)), sh = Math.max(32, Math.round(H / 10));
    if (!smallCv || smallCv.width !== sw || smallCv.height !== sh) { smallCv = document.createElement('canvas'); smallCv.width = sw; smallCv.height = sh; }
    const g = smallCv.getContext('2d'), sc = Math.max(sw / iw, sh / ih);
    g.drawImage(s, (sw - iw * sc) / 2, (sh - ih * sc) / 2, iw * sc, ih * sc);
    c.save(); c.imageSmoothingQuality = 'high'; c.filter = 'blur(6px)'; c.drawImage(smallCv, 0, 0, W, H); c.restore();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
  } else {                                   // still image: blurred backdrop cached per frame size
    if (!bgCache || bgCache.w !== W || bgCache.h !== H) {
      const o = document.createElement('canvas'); o.width = W; o.height = H; const g = o.getContext('2d');
      g.filter = 'blur(28px)'; g.drawImage(s, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover); g.filter = 'none';
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); bgCache = { w: W, h: H, o };
    }
    c.drawImage(bgCache.o, 0, 0);
  }
  c.drawImage(s, (W - iw * fit) / 2, (H - ih * fit) / 2, iw * fit, ih * fit);
}
FN.drawBackground = (c, W, H, t) => {
  const mode = P().media.bgMode || 'cover', isExport = c.canvas !== FN.cv;
  if (bgImg) drawSrc(c, W, H, bgImg, bgImg.width, bgImg.height, mode, false);
  else if (bgVideo) {
    const v = bgVideo, el = v.el;
    if (isExport && v.frame) drawSrc(c, W, H, v.frame, v.frame.width, v.frame.height, mode, true);
    else if (el.videoWidth && el.readyState >= 2) {
      if (!isExport) {                       // preview: keep the <video> in step with the timeline (tighter for main video)
        const tl = el.duration > 0 ? t % el.duration : t, tol = v.local ? 0.12 : 0.25;
        if (el.paused) { if (Math.abs(el.currentTime - tl) > 0.04) el.currentTime = tl; }
        else if (Math.abs(el.currentTime - tl) > tol) el.currentTime = tl;
      }
      drawSrc(c, W, H, el, el.videoWidth, el.videoHeight, mode, true);
    }
  }
  const L = P().logo;
  if (logoImg && L) {
    const w = W * (L.sizePct || 12) / 100, h = w * logoImg.height / logoImg.width, m = Math.min(W, H) * 0.03;
    const x = (L.pos || 'tr').endsWith('l') ? m : W - w - m, y = (L.pos || 'tr').startsWith('t') ? m : H - h - m;
    c.save(); c.globalAlpha = L.opacity ?? 0.9; c.drawImage(logoImg, x, y, w, h); c.restore();
  }
};

// ---------- video picture follows play / pause ----------
FN.onPlay.push((t) => {
  if (bgVideo) { const el = bgVideo.el; if (el.duration > 0) el.currentTime = t % el.duration; el.play().catch(() => {}); }
});
FN.onPause.push(() => { if (bgVideo) bgVideo.el.pause(); });

// ---------- export: reset video state, then hand the main audio to the Audio Engine (audio.js) ----------
FN.mixExport = async (main) => {
  if (bgVideo) { bgVideo.el.pause(); bgVideo.useEl = false; bgVideo.frame = null; }
  return FN.audioMix ? await FN.audioMix(main) : main;
};

// ---------- restore from project (also after import) ----------
async function restore() {
  const p = P(), md = p.media || {};
  bgMode.value = md.bgMode || 'cover';
  if (p.logo) { logoPos.value = p.logo.pos || 'tr'; logoSize.value = p.logo.sizePct || 12; logoOp.value = p.logo.opacity ?? 0.9; }
  musicBuf = bgImg = logoImg = bgCache = null; dropVideo();
  setLock(!!md.mainIsVideo);                 // main video file must be chosen again; BG stays locked meanwhile
  try {
    if (md.music) await loadMusic(md.music.replace(/^Music\//, ''));
    if (md.bg && !md.mainIsVideo) { const n = md.bg.replace(/^BG\//, ''); if (VID.test(n)) await loadBgVideo(n); else await loadBg(n); }
    if (p.logo?.path) await loadLogo(p.logo.path.replace(/^Logo\//, ''));
  } catch { /* R2 not reachable yet: ignore */ }
  FN.audioChanged?.(); FN.redraw();
}
let lastP = P(); restore(); show('Music', false);
setInterval(() => { if (P() !== lastP) { lastP = P(); restore(); } }, 500);
