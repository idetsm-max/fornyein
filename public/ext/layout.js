// Layout module (loaded LAST): CapCut-style single-screen editor. The page itself never scrolls.
//   Top bar: brand · frame size · status · project · EXPORT
//   Middle : tool rail | tool panel (one step at a time) | PREVIEW | subtitle list
//   Bottom : TIMELINE (transport, Tap-sync, split/merge, undo, waveform with subtitle blocks)
// It does not rebuild any feature: it moves the elements the other modules created into the right place,
// so every handler / id keeps working.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const short = (s) => (s || '').replace(/^(local:|Music\/|BG\/|Logo\/)/, '');

// ---------- design ----------
document.head.append(mk('style', { textContent: `
:root{--bg:#0b0e14;--bg2:#10141d;--card:#161b26;--line:#262e42;--tx:#e9edf6;--mut:#8b96b0;--ac:#5b9dff;--ac2:#7c6cff;--ok:#3ddc84}
html,body{height:100%;overflow:hidden;margin:0}
body{background:var(--bg);color:var(--tx)}
.app{height:100vh;height:100dvh;display:grid;grid-template-rows:52px minmax(0,1fr) 224px}
.topbar{display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--bg2);border-bottom:1px solid var(--line);min-width:0}
.brand{font-weight:700;font-size:17px;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
.grow{flex:1;min-width:0}
.topbar #status{color:var(--mut);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34vw}
.topbar select{max-width:170px}
.mid{display:grid;grid-template-columns:68px minmax(300px,350px) minmax(0,1fr) minmax(250px,310px);min-height:0}
.rail{display:flex;flex-direction:column;gap:6px;padding:8px 6px;background:var(--bg2);border-right:1px solid var(--line);overflow:auto}
.rail button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border-radius:10px;border:1px solid transparent;background:transparent;font-size:11px;color:var(--mut);position:relative}
.rail button .ic{font-size:20px;line-height:1}
.rail button.on{background:#1b2336;color:#fff;border-color:var(--ac)}
.rail button.done::after{content:'';position:absolute;top:6px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--ok)}
.leftpanel{overflow:auto;padding:14px;background:var(--bg2);border-right:1px solid var(--line);min-height:0}
.panel{display:none}.panel.on{display:block}
.panel h2{margin:0 0 4px;font-size:18px}
.panel .desc{color:var(--mut);font-size:13px;line-height:1.7;margin-bottom:12px}
.panel .card,.inspector .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 12px}
.panelnav{position:sticky;bottom:-14px;display:flex;justify-content:space-between;gap:8px;padding:10px 0 2px;background:linear-gradient(transparent,var(--bg2) 28%)}
.stage{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;min-width:0;min-height:0;padding:14px;background:radial-gradient(800px 400px at 50% 40%,#151b2b,#0a0d13)}
.stage canvas#cv{flex:none;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,.55)}
.inspector{overflow:auto;padding:12px;background:var(--bg2);border-left:1px solid var(--line);min-height:0}
.inspector #list{max-height:none}
.tl{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:6px;padding:8px 14px 8px;background:var(--bg2);border-top:1px solid var(--line);min-height:0}
.tl .bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tl .bar .sep{width:1px;height:22px;background:var(--line);margin:0 2px}
.tl .row{margin:0}
.tl canvas#wf{width:100%;height:100%;min-height:0;border-radius:8px;border:1px solid var(--line)}
.tl .hint{color:var(--mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
button,select,input,textarea{border-radius:8px}
button{background:#1d2434;border:1px solid var(--line);padding:6px 11px;color:var(--tx)}
button:hover:not(:disabled){border-color:var(--ac)}
button.pri,.bigbtn{background:linear-gradient(135deg,var(--ac),var(--ac2));border-color:transparent;color:#fff}
.bigbtn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:12px;font-weight:600;cursor:pointer;font-size:14px}
.btnlike{border:1px solid var(--line);padding:6px 11px;border-radius:8px;cursor:pointer;color:var(--tx);background:#1d2434;font-size:13px;white-space:nowrap}
#export{padding:8px 18px;font-weight:600}
.check{display:grid;grid-template-columns:22px 1fr;gap:4px 8px;align-items:center;font-size:14px;margin-bottom:10px}
.check .ok{color:var(--ok)}.check .no{color:#f5b83d}
@media(max-width:900px){
  html,body{overflow:auto}.app{height:auto;display:block}.mid{display:block}
  .rail{flex-direction:row;overflow:auto}.rail button{min-width:62px}
  .leftpanel,.inspector{max-height:none}.stage{height:56vw;min-height:240px}.tl{height:230px}
}
` }));

// ---------- grab the pieces the other modules created ----------
const oldHeader = document.querySelector('header'), oldMain = document.querySelector('main');
const cards = [...document.querySelectorAll('.card')];
const byText = (s) => cards.find((c) => c.textContent.trim().startsWith(s));
const previewCard = $('cv').closest('.card'), timelineCard = byText('Timeline ကိရိယာ'), textCard = $('txt').closest('.card'), listCard = $('list').closest('.card');
const effectsCard = byText('Effect / Animation / Preset'), creditsCard = byText('Credits'), mixerCard = cards.find((c) => c.textContent.includes('Audio Mixer'));
const musicCard = $('card-music'), bgCard = $('card-bg'), logoCard = $('card-logo');
const srtBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'SRT export');
const safeLbl = [...document.querySelectorAll('label')].find((l) => l.textContent.includes('Safe area'));
const card = (title, ...kids) => { const c = mk('div', { className: 'card' }); if (title) c.append(mk('b', { textContent: title })); kids.forEach((k) => c.append(k)); return c; };
const row = (...kids) => mk('div', { className: 'row' }, kids);

// ---------- cards that are new / re-assembled ----------
const fileLbl = $('file').closest('label'); fileLbl.childNodes[0].textContent = '';
fileLbl.classList.add('bigbtn'); fileLbl.prepend(mk('span', { textContent: '📂 ဖိုင်ရွေးမယ် (Audio / Video)' })); $('file').style.display = 'none';
const fileInfo = mk('span', { className: 'mut' });
const inputCard = card('ကဗျာဖတ်သံ', row(fileLbl), row(fileInfo),
  mk('div', { className: 'mut', style: 'margin-top:10px;line-height:1.7;font-size:13px', textContent: 'Audio ရွေးရင် နောက်ခံကို "နောက်ခံ" တန်းမှာ သီးသန့်ရွေးပါမယ်။ Video ရွေးရင် Video ထဲက ပုံကို နောက်ခံ၊ အသံကို ပင်မအသံအဖြစ် သုံးပြီး နောက်ခံ ရွေးခွင့်ကို ပိတ်ထားပါမယ်။ Frame size ကို အပေါ်ဆုံး bar မှာ ရွေးပါ။' }));
const styleCard = card('စာတန်း ပုံစံ', $('fsz').closest('.row'), $('extra'));
const checkBox = mk('div', { className: 'check' });
const exportCard = card('စစ်ပြီး ထုတ်မယ်', checkBox,
  row(...(srtBtn ? [srtBtn] : []), mk('span', { className: 'mut', textContent: 'SRT = စာတန်းဖိုင် (YouTube/VLC အတွက်)' })),
  mk('div', { className: 'mut', style: 'margin-top:10px;font-size:13px;line-height:1.7', textContent: 'MP4 ထုတ်ခလုတ်က အပေါ်ဆုံး bar ညာဘက်မှာ ရှိပါတယ်။ ထုတ်နေတုန်း tab ကို မပိတ်ပါနဲ့။' }));

// ---------- tool steps (left rail + panel) ----------
const STEPS = [
  { ic: '🎵', name: 'အသံ', title: '၁. ကဗျာဖတ်သံ', desc: 'ကဗျာဖတ်သံ (Audio) သို့ Video ဖိုင်ကို ရွေးပါ။', els: [inputCard] },
  { ic: '✍️', name: 'စာသား', title: '၂. စာသား', desc: 'ကဗျာစာသား paste လုပ်ပြီး "စာတန်းခွဲမယ်" နှိပ်ပါ (Zawgyi ဆိုရင် Unicode ပြောင်းပေးပါမယ်)။ ပြီးရင် အောက်က Timeline မှာ Tap-sync နဲ့ ချိန်ကိုက်ပါ။', els: [textCard] },
  { ic: '🎨', name: 'ပုံစံ', title: '၃. စာတန်း ပုံစံ', desc: 'Font၊ အရွယ်၊ အရောင်၊ နေရာ (Preview ပေါ်မှာ ဆွဲရွှေ့လို့ရ)၊ Effect၊ Animation၊ Preset။', els: [styleCard, effectsCard] },
  { ic: '🖼', name: 'နောက်ခံ', title: '၄. နောက်ခံ / Logo / Credits', desc: 'နောက်ခံပုံ/Video၊ Logo၊ စာရေးသူ/ဖတ်သူ နာမည်။ Library (R2) သို့ ကိုယ်ပိုင်ဖိုင်။', els: [bgCard, logoCard, creditsCard] },
  { ic: '🎚', name: 'Music', title: '၅. အသံ + Background Music', desc: 'Background Music (Library သို့ ကိုယ်ပိုင်ဖိုင်)၊ ဖတ်သံ Effect၊ Ducking၊ SE။', els: [musicCard, mixerCard] },
  { ic: '📤', name: 'ထုတ်', title: '၆. ထုတ်မယ်', desc: 'အားလုံးစစ်ပြီး MP4 ထုတ်ပါ။', els: [exportCard] },
];
const visited = new Set();
const rail = mk('nav', { className: 'rail' }), leftPanel = mk('div', { className: 'leftpanel' }), railBtns = [], panels = [];
STEPS.forEach((s, i) => {
  railBtns.push(mk('button', { onclick: () => go(i), title: s.title }, [mk('span', { className: 'ic', textContent: s.ic }), s.name])); rail.append(railBtns[i]);
  const p = mk('section', { className: 'panel' }, [mk('h2', { textContent: s.title }), mk('div', { className: 'desc', textContent: s.desc }), ...s.els.filter(Boolean)]);
  p.append(mk('div', { className: 'panelnav' }, [
    i > 0 ? mk('button', { textContent: '← ' + STEPS[i - 1].name, onclick: () => go(i - 1) }) : mk('span'),
    i < STEPS.length - 1 ? mk('button', { className: 'pri', textContent: STEPS[i + 1].name + ' →', onclick: () => go(i + 1) }) : mk('span'),
  ]));
  panels.push(p); leftPanel.append(p);
});
function go(i) {
  panels.forEach((p, j) => p.classList.toggle('on', j === i)); railBtns.forEach((b, j) => b.classList.toggle('on', j === i));
  visited.add(i); location.hash = 'step' + (i + 1); leftPanel.scrollTop = 0; refresh();
}

// ---------- top bar ----------
const importLbl = $('loadJson').closest('label'); importLbl.childNodes[0].textContent = 'Project import'; importLbl.classList.add('btnlike'); $('loadJson').style.display = 'none';
$('saveJson').classList.add('btnlike');
const top = mk('header', { className: 'topbar' }, [mk('span', { className: 'brand', textContent: 'For Nyein' }), $('size'), mk('span', { className: 'grow' }), $('status'), $('saveJson'), importLbl, $('export'), $('cancel'), $('prog')]);
$('prog').style.width = '110px';

// ---------- preview stage (keeps the same element so the safe-area overlay + drag-to-position still work) ----------
const playRow = $('play').closest('.row'), hintDiv = $('wf').nextElementSibling;
const stage = previewCard; stage.className = 'stage'; stage.style.padding = ''; // card -> stage
[...stage.children].forEach((c) => { if (c !== $('cv') && !c.contains?.($('cv')) && !c.classList?.contains('mut') && c.tagName !== 'DIV') { /* keep overlays */ } });

// ---------- timeline (bottom) ----------
const tlTools = timelineCard.querySelector('.row'), tlSettings = $('lead').closest('.row');
tlSettings.classList.remove('mut');
const bar = mk('div', { className: 'bar' }, [$('play'), $('time'), ...(safeLbl ? [safeLbl] : []), mk('span', { className: 'sep' }), ...[...tlTools.children], mk('span', { className: 'sep' }), tlSettings]);
const hint = mk('div', { className: 'hint', textContent: 'Space = Play · T = Tap-sync (စာကြောင်းတစ်ကြောင်း ဖတ်နေစဉ် နှိပ်ထား) · A = audition · S/M = split/merge · Del · ←/→ = ၁၀ms (Shift ၁၀၀ms၊ Alt = အဆုံး) · Ctrl+Z/Y · အပြာတန်း ဆွဲရွှေ့/အစွန်းဆွဲ' });
const timeline = mk('div', { className: 'tl' }, [bar, $('wf'), hint]);
playRow.remove(); hintDiv?.remove();

// ---------- subtitle list (right inspector) ----------
const inspector = mk('aside', { className: 'inspector' }, [listCard]);

// ---------- assemble ----------
const mid = mk('div', { className: 'mid' }, [rail, leftPanel, stage, inspector]);
document.body.prepend(mk('div', { className: 'app' }, [top, mid, timeline]));
oldHeader.remove(); oldMain.remove();

// ---------- fit the preview + waveform to the space (the page itself never scrolls) ----------
function fit() {
  const cv = FN.cv, cs = getComputedStyle(stage);
  const w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (w > 20 && h > 20) {
    const ar = cv.width / cv.height; let cw = w, ch = w / ar; if (ch > h) { ch = h; cw = h * ar; }
    cv.style.width = Math.floor(cw) + 'px'; cv.style.height = Math.floor(ch) + 'px';
  }
  const wf = $('wf'), ww = Math.round(wf.clientWidth);
  if (ww > 50 && wf.width !== ww) { wf.width = ww; FN.redraw(); }
}
new ResizeObserver(fit).observe(stage); new ResizeObserver(fit).observe(timeline);
window.addEventListener('resize', fit); setInterval(fit, 400);

// ---------- live state: ticks, file info, readiness list ----------
function refresh() {
  const p = P(), md = p.media || {}, subs = p.subtitles.length, cr = p.credits || {};
  fileInfo.textContent = FN.audio ? `${short(md.main) || 'ဖိုင်'} · ${FN.audio.duration.toFixed(1)} s${md.mainIsVideo ? ' · Video' : ''}` : (md.main ? `${short(md.main)} — ဖိုင်ကို ပြန်ရွေးပါ` : 'မရွေးရသေးပါ');
  const done = [!!FN.audio, subs > 0, visited.has(2), visited.has(3), visited.has(4), false];
  railBtns.forEach((b, i) => b.classList.toggle('done', done[i]));
  if (panels[5].classList.contains('on')) {
    const items = [
      [!!FN.audio, 'အသံ', FN.audio ? FN.audio.duration.toFixed(1) + ' s' + (md.mainIsVideo ? ' (Video)' : '') : 'မရွေးရသေး'],
      [subs > 0, 'စာတန်း', subs ? subs + ' ကြောင်း' : 'မရှိသေး'],
      [true, 'နောက်ခံ', md.mainIsVideo ? 'Video ရဲ့ ပုံ' : (md.bg ? short(md.bg) : 'မရွေး (အနက်ရောင်)')],
      [true, 'Music', md.music ? short(md.music) : 'မရှိ'],
      [true, 'Credits', cr.titleCard && (cr.author || cr.reader || cr.poem) ? 'Title card ' + cr.titleDur + ' s' : (cr.corner ? 'ထောင့်မှာ' : 'မရှိ')],
      [true, 'Frame size', p.output.size],
    ];
    checkBox.textContent = '';
    for (const [ok, k, v] of items) checkBox.append(mk('span', { className: ok ? 'ok' : 'no', textContent: ok ? '✔' : '○' }), mk('span', { textContent: `${k}: ${v}` }));
  }
}
setInterval(refresh, 500);

const start = parseInt((location.hash.match(/step(\d)/) || [])[1], 10);
go(start >= 1 && start <= STEPS.length ? start - 1 : 0);
fit(); FN.redraw();
