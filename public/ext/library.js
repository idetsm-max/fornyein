// Assets module: separate cards for Background music, Background (photo/video) and Logo.
// Each can come from the private R2 library OR from the user's own computer.
// If the MAIN input is a video file: its picture becomes the background, its sound the main audio, and BG selection is locked.
// Music playback / mixing lives in audio.js (Audio Engine); this module only loads the chosen buffer (FN.music.buf).
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i, VID = /\.(mp4|webm|mov|m4v|mkv)$/i;
const assetUrl = (type, name) => `/api/asset/${type}/${name.split('/').map(encodeURIComponent).join('/')}`;
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const isLocal = (s) => typeof s === 'string' && s.startsWith('local:');
const shortName = (s) => (s || '').replace(/^(local:|Music\/|BG\/|Logo\/)/, '');

// ---------- R2 list (cached in memory) ----------
const cache = {};
async function list(type, force) {
  if (!force && cache[type]) return cache[type];
  const r = await fetch(`/api/library/${type}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status === 503 ? 'R2 မချိတ်ရသေးပါ' : `HTTP ${r.status}`);
  return (cache[type] = await r.json());
}
const load = async (type, name) => { const r = await fetch(assetUrl(type, name)); if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r; };

// ---------- shared UI pieces ----------
function makeCard(id, title, sub) {
  const c = mk('div', { className: 'card', id }); c.append(mk('b', { textContent: title }));
  if (sub) c.append(mk('div', { className: 'mut', textContent: sub, style: 'margin:4px 0 8px;line-height:1.6' }));
  return c;
}
function r2Box(type, onUse, prevAudio) {
  const box = mk('div'); box.style.maxHeight = '190px'; box.style.overflow = 'auto';
  async function refresh(force) {
    box.textContent = 'စာရင်းယူနေပါတယ်...';
    try {
      const items = await list(type, force); box.textContent = '';
      if (!items.length) { box.append(mk('div', { className: 'mut', textContent: `${type}/ ထဲမှာ ဖိုင်မရှိသေးပါ` })); return; }
      for (const it of items) {
        const row = mk('div', { className: 'row' }); row.style.marginTop = '4px';
        const nm = mk('span', { textContent: `${it.name} · ${fmtSize(it.size)}` }); nm.style.flex = '1'; nm.style.wordBreak = 'break-all';
        row.append(nm);
        if (prevAudio) row.append(mk('button', { textContent: '▶', title: 'နားထောင်', onclick: () => { prevAudio.src = assetUrl(type, it.name); prevAudio.play().catch(() => {}); } }));
        row.append(mk('button', { textContent: 'သုံး', onclick: () => onUse(it) }));
        box.append(row);
      }
    } catch (e) { box.textContent = 'စာရင်းမရပါ: ' + e.message; }
  }
  return { box, refresh };
}
function uploader(label, accept, onFile) {
  const i = mk('input', { type: 'file', accept });
  i.onchange = async () => { const f = i.files[0]; if (f) { await onFile(f); } i.value = ''; };
  return mk('label', { className: 'mut' }, [label + ' ', i]);
}
const section = (t) => mk('div', { className: 'mut', textContent: t, style: 'margin-top:10px;font-weight:600' });

// ---------- state ----------
let musicBuf = null, bgImg = null, bgVideo = null, logoImg = null, bgCache = null, lockBg = false;
FN.music = { get buf() { return musicBuf; } };

// ================= Background music =================
const musicCard = makeCard('card-music', 'Background Music', 'Library (R2) ကနေ ရွေးမယ်၊ ဒါမှမဟုတ် ကိုယ့်ကွန်ပျူတာထဲက ဖိုင်ကို ထည့်မယ်။ Volume/Ducking ကို အောက်က Audio Mixer မှာ ညှိပါ။');
const musicCur = mk('div', { className: 'row' }), musicPrev = mk('audio', { controls: true }); musicPrev.style.width = '100%'; musicPrev.style.marginTop = '8px';
const musicList = r2Box('Music', (it) => pickMusic(it), musicPrev);
musicCard.append(musicCur, section('ကိုယ်ပိုင်ဖိုင်'), mk('div', { className: 'row' }, [uploader('Music ဖိုင်ရွေး', 'audio/*', pickMusicFile)]),
  section('Library (R2)'), mk('div', { className: 'row' }, [mk('button', { textContent: '↻ Refresh', onclick: () => musicList.refresh(true) })]), musicList.box, musicPrev);
function curLine(el, label, name, onClear) {
  el.textContent = '';
  if (!name) { el.append(mk('span', { className: 'mut', textContent: `${label}: မရွေးရသေးပါ` })); return; }
  el.append(mk('span', { textContent: `${label}: ${shortName(name)}${isLocal(name) ? ' (ကိုယ်ပိုင်)' : ''}` }), mk('button', { textContent: 'ဖယ်ရှား', onclick: onClear }));
}
const refreshCur = () => {
  const md = P().media || {}, L = P().logo;
  curLine(musicCur, 'သုံးနေတာ', md.music, () => { musicBuf = null; delete P().media.music; afterChange(); });
  curLine(bgCur, 'သုံးနေတာ', md.mainIsVideo ? null : md.bg, () => { if (lockBg) return; bgImg = bgCache = null; dropVideo(); delete P().media.bg; afterChange(); });
  curLine(logoCur, 'သုံးနေတာ', L?.path, () => { logoImg = null; delete P().logo; afterChange(); });
};
function afterChange() { refreshCur(); FN.audioChanged?.(); FN.save(); FN.redraw(); }
async function pickMusic(it) {
  try { FN.setStatus(`${it.name} ဒေါင်းနေပါတယ်...`); musicBuf = await FN.ac.decodeAudioData(await (await load('Music', it.name)).arrayBuffer()); P().media.music = `Music/${it.name}`; afterChange(); FN.setStatus(`${it.name} သုံးပြီး`); }
  catch (e) { FN.setStatus('မရပါ: ' + e.message); }
}
async function pickMusicFile(f) {
  try { FN.setStatus('decode လုပ်နေပါတယ်...'); musicBuf = await FN.ac.decodeAudioData(await f.arrayBuffer()); P().media.music = 'local:' + f.name; afterChange(); FN.setStatus(`${f.name} သုံးပြီး (ကိုယ်ပိုင်ဖိုင်)`); }
  catch (e) { FN.setStatus('အသံဖတ်မရပါ: ' + e.message); }
}

// ================= Background (photo / video) =================
const bgCard = makeCard('card-bg', 'နောက်ခံ (Photo / Video)', 'Library (R2) ကနေ ရွေးမယ်၊ ဒါမှမဟုတ် ကိုယ့်ကွန်ပျူတာထဲက ပုံ/Video ကို ထည့်မယ်။');
const bgCur = mk('div', { className: 'row' }), bgLockMsg = mk('div', { className: 'mut', textContent: 'ပင်မ input က Video ဖြစ်နေလို့ Video ရဲ့ ပုံကို နောက်ခံအဖြစ် သုံးထားပါတယ်၊ ဒီမှာ ရွေးလို့မရပါ။' });
bgLockMsg.style.cssText = 'display:none;padding:8px;border:1px dashed var(--line);border-radius:8px;margin-bottom:8px';
const bgMode = mk('select'); [['cover', 'Cover (ဖြတ်ယူ)'], ['contain', 'Contain + blur']].forEach(([v, l]) => bgMode.add(new Option(l, v)));
const bgList = r2Box('BG', (it) => pickBg(it));
const bgBody = mk('div'); bgBody.append(bgCur, section('ကိုယ်ပိုင်ဖိုင်'), mk('div', { className: 'row' }, [uploader('ပုံ/Video ရွေး', 'image/*,video/*', pickBgFile)]),
  section('Library (R2)'), mk('div', { className: 'row' }, [mk('button', { textContent: '↻ Refresh', onclick: () => bgList.refresh(true) })]), bgList.box);
bgCard.append(bgLockMsg, bgBody, mk('div', { className: 'row' }, [mk('label', { className: 'mut' }, ['ပြပုံ ', bgMode])]));
function setLock(v) { lockBg = v; bgLockMsg.style.display = v ? 'block' : 'none'; bgBody.style.opacity = v ? 0.4 : 1; bgBody.style.pointerEvents = v ? 'none' : ''; }
async function pickBg(it) {
  try {
    FN.setStatus(`${it.name} ဒေါင်းနေပါတယ်...`);
    if (VID.test(it.name)) await openVideo(assetUrl('BG', it.name), it.name, null, false);
    else { dropVideo(); bgImg = await createImageBitmap(await (await load('BG', it.name)).blob()); bgCache = null; }
    P().media.bg = `BG/${it.name}`; afterChange(); FN.setStatus(`${it.name} သုံးပြီး`);
  } catch (e) { FN.setStatus('မရပါ: ' + e.message); }
}
async function pickBgFile(f) {
  try {
    if (f.type.startsWith('video/') || VID.test(f.name)) await openVideo(URL.createObjectURL(f), f.name, f, false);
    else { dropVideo(); bgImg = await createImageBitmap(f); bgCache = null; }
    P().media.bg = 'local:' + f.name; afterChange(); FN.setStatus(`${f.name} သုံးပြီး (ကိုယ်ပိုင်ဖိုင်)`);
  } catch (e) { FN.setStatus('ဖွင့်မရပါ: ' + e.message); }
}
bgMode.onchange = () => { P().media.bgMode = bgMode.value; bgCache = null; FN.save(); FN.redraw(); };

// ================= Logo =================
const logoCard = makeCard('card-logo', 'Logo', 'Library (R2) သို့ ကိုယ်ပိုင်ပုံ (png) ကို ထည့်ပါ။');
const logoCur = mk('div', { className: 'row' });
const logoPos = mk('select'); [['tr', 'ညာပေါ်'], ['tl', 'ဘယ်ပေါ်'], ['br', 'ညာအောက်'], ['bl', 'ဘယ်အောက်']].forEach(([v, l]) => logoPos.add(new Option(l, v)));
const logoSize = mk('input', { type: 'number', min: 3, max: 50, step: 1, value: 12 }); logoSize.style.width = '60px';
const logoOp = mk('input', { type: 'number', min: 0.1, max: 1, step: 0.1, value: 0.9 }); logoOp.style.width = '60px';
const logoList = r2Box('Logo', (it) => pickLogo(it));
logoCard.append(logoCur, section('ကိုယ်ပိုင်ဖိုင်'), mk('div', { className: 'row' }, [uploader('Logo ပုံရွေး', 'image/*', pickLogoFile)]),
  section('Library (R2)'), mk('div', { className: 'row' }, [mk('button', { textContent: '↻ Refresh', onclick: () => logoList.refresh(true) })]), logoList.box,
  mk('div', { className: 'row mut' }, ['နေရာ', logoPos, 'အရွယ် %', logoSize, 'opacity', logoOp]));
async function pickLogo(it) {
  try { logoImg = await createImageBitmap(await (await load('Logo', it.name)).blob()); P().logo = { ...(P().logo || {}), path: `Logo/${it.name}` }; afterChange(); FN.setStatus(`${it.name} သုံးပြီး`); }
  catch (e) { FN.setStatus('မရပါ: ' + e.message); }
}
async function pickLogoFile(f) {
  try { logoImg = await createImageBitmap(f); P().logo = { ...(P().logo || {}), path: 'local:' + f.name }; afterChange(); FN.setStatus(`${f.name} သုံးပြီး (ကိုယ်ပိုင်ဖိုင်)`); }
  catch (e) { FN.setStatus('ပုံဖွင့်မရပါ: ' + e.message); }
}
const saveLogo = () => { P().logo = { ...(P().logo || {}), pos: logoPos.value, sizePct: +logoSize.value || 12, opacity: +logoOp.value || 0.9 }; FN.save(); FN.redraw(); };
logoPos.onchange = logoSize.oninput = logoOp.oninput = saveLogo;

// mount point for the layout module; fall back to the right-hand column of the old layout
const fallback = document.querySelectorAll('main > section')[1];
if (fallback) fallback.append(bgCard, logoCard, musicCard);
musicList.refresh(false); bgList.refresh(false); logoList.refresh(false);

// ---------- Video as picture: <video> for preview, Mediabunny CanvasSink for exact export frames ----------
function dropVideo() {
  if (!bgVideo) return;
  try { bgVideo.el.pause(); bgVideo.el.removeAttribute('src'); bgVideo.el.load(); } catch {}
  if (bgVideo.local) { try { URL.revokeObjectURL(bgVideo.url); } catch {} }
  try { bgVideo.input?.dispose?.(); } catch {}
  bgVideo = null;
}
async function openVideo(url, name, file, isMain) {
  dropVideo(); bgImg = null; bgCache = null;
  const el = mk('video', { muted: true, loop: true, playsInline: true, preload: 'auto' });
  el.muted = true; el.src = url;
  await new Promise((res, rej) => { el.onloadeddata = res; el.onerror = () => rej(new Error('Video ဖွင့်မရပါ (codec မပံ့ပိုးနိုင်)')); });
  el.addEventListener('seeked', () => FN.redraw());
  bgVideo = { el, name, url, file: file || null, local: !!file, isMain: !!isMain, frame: null, sinkP: null, sink: null, input: null, vdur: el.duration, useEl: false };
  el.currentTime = 0;
}
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
FN.beforeFrame = async (t) => {            // export: called before every frame (t = exact timeline time)
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
  const isVid = f.type.startsWith('video/') || VID.test(f.name), md = P().media;
  if (isVid) {
    md.mainIsVideo = true; setLock(true);
    try { await openVideo(URL.createObjectURL(f), f.name, f, true); FN.setStatus('Video ရဲ့ ပုံကို BG အဖြစ်၊ အသံကို ပင်မအသံအဖြစ် သုံးပါမယ်'); }
    catch (err) { FN.setStatus('Video ပုံဖွင့်မရပါ: ' + err.message); }
  } else {
    md.mainIsVideo = false; setLock(false);
    if (bgVideo?.isMain) dropVideo();
    try { if (md.bg && !isLocal(md.bg) && !bgImg && !bgVideo) { const n = md.bg.replace(/^BG\//, ''); await pickBg({ name: n }); } } catch {}
  }
  refreshCur(); FN.save(); FN.redraw();
});

// ---------- settings -> project ----------
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
        const tl = el.duration > 0 ? t % el.duration : t, tol = v.isMain ? 0.12 : 0.25;
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
FN.onPlay.push((t) => { if (bgVideo) { const el = bgVideo.el; if (el.duration > 0) el.currentTime = t % el.duration; el.play().catch(() => {}); } });
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
  setLock(!!md.mainIsVideo);                 // main video must be chosen again; BG stays locked meanwhile
  try {
    if (md.music && !isLocal(md.music)) { musicBuf = await FN.ac.decodeAudioData(await (await load('Music', md.music.replace(/^Music\//, ''))).arrayBuffer()); }
    if (md.bg && !isLocal(md.bg) && !md.mainIsVideo) { const n = md.bg.replace(/^BG\//, ''); if (VID.test(n)) await openVideo(assetUrl('BG', n), n, null, false); else { bgImg = await createImageBitmap(await (await load('BG', n)).blob()); } }
    if (p.logo?.path && !isLocal(p.logo.path)) logoImg = await createImageBitmap(await (await load('Logo', p.logo.path.replace(/^Logo\//, ''))).blob());
  } catch { /* R2 not reachable yet: ignore */ }
  refreshCur(); FN.audioChanged?.(); FN.redraw();
}
let lastP = P(); restore();
setInterval(() => { if (P() !== lastP) { lastP = P(); restore(); } }, 500);
