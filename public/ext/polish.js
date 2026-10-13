// Polish module: SRT export + 9:16 safe-area guide (preview only, never exported).
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }

// ---------- SRT export ----------
const pad = (n, l = 2) => String(n).padStart(l, '0');
function ts(sec) {
  const ms = Math.round(Math.max(0, sec) * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}
function toSrt() {
  const subs = [...P().subtitles].filter((s) => s.text.trim() && s.end > s.start).sort((a, b) => a.start - b.start);
  return subs.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text.trim()}\n`).join('\n');
}
const srtBtn = mk('button', { textContent: 'SRT export', title: 'စာတန်းတွေကို .srt ဖိုင်အဖြစ် ထုတ်မယ်' });
srtBtn.onclick = () => {
  const out = toSrt(); if (!out) { FN.setStatus('SRT ထုတ်စရာ စာတန်း မရှိပါ'); return; }
  const base = (P().media.main || 'poem').replace(/^local:/, '').replace(/\.[^.]+$/, '');
  const a = mk('a', { href: URL.createObjectURL(new Blob(['\uFEFF' + out], { type: 'text/plain;charset=utf-8' })), download: base + '.srt' });
  a.click(); FN.setStatus('SRT ထုတ်ပြီး — ' + base + '.srt');
};
$('saveJson').after(srtBtn);

// ---------- safe-area guide (DOM overlay on the preview; the exported video is untouched) ----------
const cb = mk('input', { type: 'checkbox' });
const lab = mk('label', { className: 'mut', title: 'TikTok/Reels UI ဖုံးနိုင်တဲ့နေရာ (ခန့်မှန်း) — Export ထဲ မပါပါ' }, [cb, ' Safe area (9:16)']);
$('time').after(lab);
const host = FN.cv.parentElement; host.style.position = 'relative';
const ov = mk('div'); ov.style.cssText = 'position:absolute;pointer-events:none;display:none;';
const band = (css) => { const d = mk('div'); d.style.cssText = 'position:absolute;background:rgba(255,60,60,.28);' + css; return d; };
const frame = mk('div'); frame.style.cssText = 'position:absolute;left:5%;top:10%;right:14%;bottom:22%;border:1px dashed rgba(255,255,255,.8);';
ov.append(band('left:0;right:0;top:0;height:10%'), band('left:0;right:0;bottom:0;height:22%'), band('right:0;width:14%;top:10%;bottom:22%'), frame);
host.append(ov);
function place() {
  const cv = FN.cv, portrait = P().output.size.startsWith('9:16');
  ov.style.left = cv.offsetLeft + 'px'; ov.style.top = cv.offsetTop + 'px'; ov.style.width = cv.clientWidth + 'px'; ov.style.height = cv.clientHeight + 'px';
  ov.style.display = cb.checked && portrait ? 'block' : 'none';
  lab.style.opacity = portrait ? 1 : 0.4;
}
cb.onchange = place; window.addEventListener('resize', place); setInterval(place, 300); place();
