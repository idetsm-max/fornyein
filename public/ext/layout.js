// Layout module (loaded LAST): turns the app into a step-by-step editor.
//   Left : sticky preview + waveform/transport.      Right: one step at a time (wizard), each part in its own panel.
// It does not rebuild any feature: it moves the cards that the other modules created into the right step,
// so every handler / id keeps working. Steps: 1 အသံ · 2 စာသား · 3 ချိန်ကိုက် · 4 စာတန်းပုံစံ · 5 နောက်ခံ · 6 အသံ/Music · 7 ထုတ်မယ်
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
const short = (s) => (s || '').replace(/^(local:|Music\/|BG\/|Logo\/)/, '');

// ---------- design ----------
document.head.append(mk('style', { textContent: `
:root{--bg:#0d1017;--card:#161b26;--line:#283044;--tx:#e9edf6;--mut:#8b96b0;--ac:#5b9dff;--ac2:#7c6cff;--ok:#3ddc84}
body{background:radial-gradient(1100px 520px at 85% -10%,#1b2342 0,transparent 60%),var(--bg);color:var(--tx);min-height:100vh}
.topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 20px;background:rgba(13,16,23,.88);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:18px;letter-spacing:.3px;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;color:transparent}
.grow{flex:1}
.stepnav{display:flex;gap:8px;padding:12px 20px;overflow:auto;border-bottom:1px solid var(--line)}
.stepnav button{display:flex;align-items:center;gap:8px;white-space:nowrap;border-radius:999px;padding:7px 14px 7px 8px}
.stepnav .n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0e121a;font-size:12px;border:1px solid var(--line)}
.stepnav button.on{background:linear-gradient(135deg,var(--ac),var(--ac2));border-color:transparent;color:#fff}
.stepnav button.on .n{background:rgba(255,255,255,.22);border-color:transparent}
.stepnav button.done:not(.on) .n{background:var(--ok);color:#06210f;border-color:transparent}
.workspace{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:18px;padding:18px 20px;align-items:start}
.previewcol{position:sticky;top:70px}
@media(max-width:1000px){.workspace{grid-template-columns:1fr}.previewcol{position:static}}
.panel{display:none}.panel.on{display:block}
.panel h2{margin:2px 0 6px;font-size:21px}
.panel .desc{color:var(--mut);font-size:14px;line-height:1.7;margin-bottom:14px}
.panel .card,.previewcol .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 14px}
.panelnav{display:flex;justify-content:space-between;gap:10px;margin-top:4px}
button,select,input,textarea{border-radius:8px}
button{background:#1d2434;border:1px solid var(--line);padding:7px 12px;color:var(--tx)}
button:hover:not(:disabled){border-color:var(--ac)}
button.pri,.bigbtn{background:linear-gradient(135deg,var(--ac),var(--ac2));border-color:transparent;color:#fff}
.bigbtn{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:12px;font-weight:600;cursor:pointer;font-size:15px}
.btnlike{border:1px solid var(--line);padding:7px 12px;border-radius:8px;cursor:pointer;color:var(--tx);background:#1d2434}
#export{padding:12px 22px;font-size:16px;font-weight:600}
.check{display:grid;grid-template-columns:22px 1fr;gap:4px 8px;align-items:center;font-size:14px}
.check .ok{color:var(--ok)}.check .no{color:#f5b83d}
#list{max-height:380px}
` }));

// ---------- grab the pieces the other modules created ----------
const oldHeader = document.querySelector('header'), oldMain = document.querySelector('main');
const cards = [...document.querySelectorAll('.card')];
const byText = (s) => cards.find((c) => c.textContent.trim().startsWith(s));
const previewCard = $('cv').closest('.card'), timelineCard = byText('Timeline ကိရိယာ'), textCard = $('txt').closest('.card'), listCard = $('list').closest('.card');
const effectsCard = byText('Effect / Animation / Preset'), creditsCard = byText('Credits'), mixerCard = cards.find((c) => c.textContent.includes('Audio Mixer'));
const musicCard = $('card-music'), bgCard = $('card-bg'), logoCard = $('card-logo');
const srtBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'SRT export');
const card = (title, ...kids) => { const c = mk('div', { className: 'card' }); if (title) c.append(mk('b', { textContent: title })); kids.forEach((k) => c.append(k)); return c; };
const row = (...kids) => mk('div', { className: 'row' }, kids);

// ---------- cards that are new / re-assembled ----------
// step 1: file chooser + frame size
const fileLbl = $('file').closest('label'); fileLbl.childNodes[0].textContent = '';
fileLbl.classList.add('bigbtn'); fileLbl.prepend(mk('span', { textContent: '📂 ဖိုင်ရွေးမယ် (Audio / Video)' })); $('file').style.display = 'none';
const fileInfo = mk('span', { className: 'mut' });
const inputCard = card('ကဗျာဖတ်သံ', row(fileLbl, fileInfo),
  mk('div', { className: 'mut', style: 'margin-top:10px;line-height:1.7', textContent: 'Audio ရွေးရင် နောက်ခံကို အောက်ပိုင်းမှာ သီးသန့်ရွေးပါမယ်။ Video ရွေးရင် Video ထဲက ပုံကို နောက်ခံ၊ အသံကို ပင်မအသံအဖြစ် သုံးပြီး နောက်ခံ ရွေးခွင့်ကို ပိတ်ထားပါမယ်။' }));
const sizeCard = card('Frame size (Output)', row('Aspect / Size', $('size')),
  mk('div', { className: 'mut', style: 'margin-top:8px', textContent: '16:9 = YouTube၊ 9:16 = TikTok/Reels/Shorts၊ 1:1 = Facebook/Instagram။ Aspect တစ်ခုချင်းစီအတွက် စာတန်းနေရာကို သီးသန့်မှတ်ပါတယ်။' }));
// step 4: style (the font/size/position row + colour row that used to sit under the text box)
const styleCard = card('စာတန်း ပုံစံ', $('fsz').closest('.row'), $('extra'));
// step 7: export
const checkBox = mk('div', { className: 'check' });
const exportRow = row($('export'), $('cancel'), $('prog'));
const exportCard = card('စစ်ပြီး ထုတ်မယ်', checkBox, exportRow, row(...(srtBtn ? [srtBtn] : []), mk('span', { className: 'mut', textContent: 'SRT = စာတန်းဖိုင် (YouTube/VLC အတွက်)' })));

// ---------- steps ----------
const STEPS = [
  { name: 'အသံ / Video', title: 'ကဗျာဖတ်သံ ရွေးပါ', desc: 'ကဗျာဖတ်သံ (Audio) သို့ Video ဖိုင်ကို ရွေးပါ၊ ပြီးတော့ Frame size ရွေးပါ။', els: [inputCard, sizeCard] },
  { name: 'စာသား', title: 'စာသား ထည့်ပါ', desc: 'ကဗျာစာသား paste လုပ်ပါ (Zawgyi ဆိုရင် Unicode ပြောင်းပေးပါမယ်)၊ ပြီးရင် "စာတန်းခွဲမယ်" နှိပ်ပါ။', els: [textCard] },
  { name: 'ချိန်ကိုက်', title: 'စာတန်းနဲ့ အသံ ချိန်ကိုက်ပါ', desc: 'Tap-sync နဲ့ ဖတ်သံကို လိုက်နှိပ်ပါ၊ ပြီးရင် ညာဘက် waveform ပေါ်မှာ အပြာတန်းတွေကို ဆွဲပြင်ပါ။ Space = Play။', els: [timelineCard, listCard] },
  { name: 'စာတန်းပုံစံ', title: 'စာတန်း ပုံစံ', desc: 'Font၊ အရွယ်၊ အရောင်၊ နေရာ (Preview ပေါ်မှာ ဆွဲရွှေ့လို့ရ)၊ Effect၊ Animation၊ Preset ရွေးပါ။', els: [styleCard, effectsCard] },
  { name: 'နောက်ခံ', title: 'နောက်ခံ / Logo / Credits', desc: 'နောက်ခံပုံ/Video၊ Logo၊ စာရေးသူ/ဖတ်သူ နာမည်တွေ ထည့်ပါ။ Library (R2) ကိုယ်ပိုင်ဖိုင် နှစ်မျိုးလုံးရပါတယ်။', els: [bgCard, logoCard, creditsCard] },
  { name: 'အသံ / Music', title: 'အသံ + Background Music', desc: 'Background Music ထည့်ပါ (Library သို့ ကိုယ်ပိုင်ဖိုင်)၊ ဖတ်သံ Effect၊ Ducking၊ SE ကို ညှိပါ။', els: [musicCard, mixerCard] },
  { name: 'ထုတ်မယ်', title: 'MP4 ထုတ်မယ်', desc: 'အားလုံးစစ်ပြီး MP4 ထုတ်ပါ။ ထုတ်နေတုန်း tab ကို မပိတ်ပါနဲ့။', els: [exportCard] },
];
const visited = new Set();
const nav = mk('nav', { className: 'stepnav' }), panelCol = mk('div'), navBtns = [], panels = [];
STEPS.forEach((s, i) => {
  const b = mk('button', { onclick: () => go(i) }, [mk('span', { className: 'n', textContent: i + 1 }), s.name]); navBtns.push(b); nav.append(b);
  const p = mk('section', { className: 'panel' }, [mk('h2', { textContent: `${i + 1}. ${s.title}` }), mk('div', { className: 'desc', textContent: s.desc }), ...s.els.filter(Boolean)]);
  const foot = mk('div', { className: 'panelnav' }, [
    i > 0 ? mk('button', { textContent: '← ' + STEPS[i - 1].name, onclick: () => go(i - 1) }) : mk('span'),
    i < STEPS.length - 1 ? mk('button', { className: 'pri', textContent: 'နောက်တစ်ဆင့်: ' + STEPS[i + 1].name + ' →', onclick: () => go(i + 1) }) : mk('span'),
  ]);
  p.append(foot); panels.push(p); panelCol.append(p);
});
function go(i) {
  panels.forEach((p, j) => p.classList.toggle('on', j === i)); navBtns.forEach((b, j) => b.classList.toggle('on', j === i));
  visited.add(i); location.hash = 'step' + (i + 1); refresh();
}

// ---------- top bar + preview column ----------
const importLbl = $('loadJson').closest('label'); importLbl.childNodes[0].textContent = 'Project import'; importLbl.classList.add('btnlike'); $('loadJson').style.display = 'none';
const top = mk('header', { className: 'topbar' }, [mk('span', { className: 'brand', textContent: 'For Nyein' }), mk('span', { className: 'grow' }), $('saveJson'), importLbl, $('status')]);
const previewCol = mk('div', { className: 'previewcol' }, [previewCard]);
const ws = mk('div', { className: 'workspace' }, [previewCol, panelCol]);
document.body.prepend(mk('div', {}, [top, nav, ws]));
oldHeader.remove(); oldMain.remove();
$('status').style.cssText = 'color:var(--mut);font-size:13px;max-width:46ch';

// ---------- live state: step ticks, file info, readiness list ----------
function refresh() {
  const p = P(), md = p.media || {}, subs = p.subtitles.length, cr = p.credits || {};
  fileInfo.textContent = FN.audio ? `${short(md.main) || 'ဖိုင်'} · ${FN.audio.duration.toFixed(1)} s${md.mainIsVideo ? ' · Video' : ''}` : (md.main ? `${short(md.main)} — ဖိုင်ကို ပြန်ရွေးပါ` : 'မရွေးရသေးပါ');
  const done = [!!FN.audio, subs > 0, visited.has(2) && subs > 0, visited.has(3), visited.has(4), visited.has(5), false];
  navBtns.forEach((b, i) => b.classList.toggle('done', done[i]));
  if (panels[6].classList.contains('on')) {
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
go(start >= 1 && start <= 7 ? start - 1 : 0);
FN.redraw();
